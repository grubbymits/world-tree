import { GraphicEvent } from "./graphics.ts";
import { Point2D } from "./geometry.ts";

export class DrawElementList {
  constructor(
    private readonly _array: Int16Array,
    private readonly _length: number
  ) {}

  get array(): Int16Array {
    return this._array;
  }
  get buffer(): ArrayBuffer {
    return this._array.buffer;
  }
  get length(): number {
    return this._length;
  }
}

export interface Renderer {
  addBitmap(id: number, bitmap: ImageBitmap): void;
  draw(elements: DrawElementList): void;
}

export class DummyRenderer implements Renderer {
  addBitmap(id: number, bitmap: ImageBitmap): void {}
  draw(elements: DrawElementList): void {}
}

export class OffscreenRenderer implements Renderer {
  private _ctx: OffscreenCanvasRenderingContext2D;
  private _bitmaps: Array<ImageBitmap> = new Array<ImageBitmap>();
  private _canvas: OffscreenCanvas;

  constructor(
    private readonly _width: number,
    private readonly _height: number
  ) {
    this._canvas = new OffscreenCanvas(_width, _height);
    this._ctx = this._canvas.getContext("2d")!;
  }

  get bitmaps(): Array<ImageBitmap> {
    return this._bitmaps;
  }

  addBitmap(id: number, bitmap: ImageBitmap): void {
    if (id >= this.bitmaps.length) {
      this.bitmaps.length = id + 1;
    }
    this.bitmaps[id] = bitmap;
  }

  draw(elements: DrawElementList): void {
    this._ctx.clearRect(0, 0, this._width, this._height);
    const array: Int16Array = elements.array;
    for (let i = 0; i < elements.length - 2; i += 3) {
      const spriteId = array[i];
      const x = array[i + 1];
      const y = array[i + 2];
      console.assert(spriteId < this.bitmaps.length, "bitmap length mismatch");
      this._ctx.drawImage(this.bitmaps[spriteId], x, y);
    }
  }
}

export class OnscreenRenderer implements Renderer {
  private _worker: Worker | null;
  private _ctx: CanvasRenderingContext2D | null;
  private _bitmaps: Array<ImageBitmap> = new Array<ImageBitmap>();
  private readonly _width: number;
  private readonly _height: number;

  private readonly workerBlob_ = new Blob([
    `
    const ctx = {};
    ctx.sprites = new Array();
    ctx.valid = false;

    onmessage = function(e) {
    switch (e.data.type) {
      default:
        console.error('unhandled graphic event');
        break;
      case 0: //GraphicEvent.AddCanvas:
        ctx.width = e.data.width;
        ctx.height = e.data.height;
        ctx.canvas = e.data.canvas;
        break;
      case 1: { //GraphicEvent.AddSprite:
        const id = e.data.id;
        const sprite = e.data.sprite
        if (id == ctx.sprites.length) {
          ctx.sprites.push(sprite);
        } else if (id < ctx.sprites.length) {
          ctx.sprites[id] = sprite;
        } else {
          for (let i = ctx.sprites.length; i < id; ++i) {
            ctx.sprites.push(0);
          }
          ctx.sprites.push(sprite);
        }
        ctx.valid = false;
        break;
      }
      case 2: { //GraphicEvent.Draw:
        if (ctx.canvas == undefined) break;

        const nodes = new Int16Array(e.data.buffer);
        if (!ctx.valid) {
          for (let i = 0; i < e.data.length; i += 3) {
            const spriteId = nodes[i];
            if (spriteId >= ctx.sprites.length) return;
            if (typeof ctx.sprites[spriteId] === "number") return;
          }
          ctx.valid = true;
        }

        const ctx2d = ctx.canvas.getContext("2d");
        ctx2d.save();
        ctx2d.clearRect(0, 0, ctx.width, ctx.height);
        for (let i = 0; i < e.data.length; i += 3) {
          const spriteId = nodes[i];
          const x =  nodes[i+1];
          const y = nodes[i+2];
          ctx2d.drawImage(ctx.sprites[spriteId], x, y);
        }
        ctx2d.restore();
        break;
      }
    }
  }`,
  ]);

  constructor(private _canvas: HTMLCanvasElement) {
    this._width = this.canvas.width;
    this._height = this.canvas.height;
    if (window.Worker) {
      const offscreen = this.canvas.transferControlToOffscreen();
      const workerBlobURL = window.URL.createObjectURL(this.workerBlob_);
      this._worker = new Worker(workerBlobURL); //, {type: 'module'});
      this.worker.postMessage(
        {
          type: GraphicEvent.AddCanvas,
          canvas: offscreen,
          width: this.width,
          height: this.height,
        },
        [offscreen]
      );
    } else {
      this._ctx = this.canvas.getContext("2d");
    }
  }

  get width(): number {
    return this._width;
  }
  get height(): number {
    return this._height;
  }
  get canvas(): HTMLCanvasElement {
    return this._canvas;
  }
  get ctx(): CanvasRenderingContext2D {
    return this._ctx!;
  }
  get bitmaps(): Array<ImageBitmap> {
    return this._bitmaps;
  }
  get worker(): Worker {
    return this._worker!;
  }

  addBitmap(id: number, bitmap: ImageBitmap): void {
    if (window.Worker) {
      this.worker.postMessage(
        { type: GraphicEvent.AddSprite, id: id, sprite: bitmap },
        [bitmap]
      );
    } else {
      if (id >= this.bitmaps.length) {
        this.bitmaps.length = id + 1;
      }
      this.bitmaps[id] = bitmap;
    }
  }

  draw(elements: DrawElementList): void {
    if (window.Worker) {
      // Transfer drawElements to worker.
      this.worker.postMessage(
        {
          type: GraphicEvent.Draw,
          buffer: elements.buffer,
          length: elements.length,
        },
        [elements.buffer]
      );
    } else {
      this.ctx.clearRect(0, 0, this.width, this.height);
      console.assert(elements.length % 3 == 0, "elements not mod 3");
      const array: Int16Array = elements.array;
      for (let i = 0; i < elements.length - 2; i += 3) {
        const spriteId = array[i];
        const x = array[i + 1];
        const y = array[i + 2];
        if (spriteId >= this.bitmaps.length) continue;
        console.assert(
          spriteId < this.bitmaps.length,
          "bitmap length mismatch",
          spriteId
        );
        this.ctx.drawImage(this.bitmaps[spriteId], x, y);
      }
    }
  }
}
