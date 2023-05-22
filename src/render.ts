import { GraphicEvent } from "./graphics.ts";
import { Point2D } from "./geometry.ts";

export interface Renderer {
  addBitmap(id: number, bitmap: ImageBitmap): void;
  draw(elements: Uint16Array): void;
}

export class OffscreenRenderer implements Renderer {
  private _ctx: OffscreenCanvasRenderingContext2D;
  private _bitmaps: Array<ImageBitmap> = new Array<ImageBitmap>();
  private _canvas: OffscreenCanvas;

  constructor(private readonly _width: number,
              private readonly _height: number) {
    this._canvas = new OffscreenCanvas(_width, _height);
    this._ctx = this._canvas.getContext('2d')!;
  }

  addBitmap(id: number, bitmap: ImageBitmap): void {
    if (id >= this._bitmaps.length) {
      this._bitmaps.length = id + 1;
    }
    this._bitmaps[id] = bitmap;
  }

  draw(elements: Uint16Array): void {
    this._ctx.clearRect(0, 0, this._width, this._height);
    for (let i = 0; i < elements.length - 2; ++i) {
      const spriteId = elements[i];
      const x = elements[i+1];
      const y = elements[i+2];
      console.assert(spriteId < this._bitmaps.length, "bitmap length mismatch");
      this._ctx.drawImage(this._bitmaps[spriteId], x, y);
    }
  }
}

export class OnscreenRenderer implements Renderer {
  private _worker: Worker | null;
  private _ctx: CanvasRenderingContext2D | null;
  private _bitmaps: Array<ImageBitmap> = new Array<ImageBitmap>();
  private readonly _width: number;
  private readonly _height: number;

  constructor(private _canvas: HTMLCanvasElement) {
    this._width = this.canvas.width;
    this._height = this.canvas.height;
    if (window.Worker) {
      console.log("using webworker for OnscreenRenderer");
      const offscreen = this.canvas.transferControlToOffscreen();
      this._worker = new Worker("/lib/render-worker.js", { type: "module" });
      this.worker.postMessage({ type: GraphicEvent.AddCanvas, canvas: offscreen,
                                width: this.width, height: this.height },
                              [offscreen]);
    } else {
      this._ctx = this.canvas.getContext('2d');
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
      this.worker.postMessage({type: GraphicEvent.AddSprite, id: id,
                              sprite: bitmap}, [ bitmap ] );
    } else {
      if (id >= this.bitmaps.length) {
        this.bitmaps.length = id + 1;
      }
      this.bitmaps[id] = bitmap;
    }
  }

  draw(elements: Uint16Array): void {
    if (window.Worker) {
      // Transfer drawElements to worker.
      this.worker.postMessage({type: GraphicEvent.Draw, drawElements: elements},
                         [ elements.buffer] );
    } else {
      this.ctx.clearRect(0, 0, this.width, this.height);
      for (let i = 0; i < elements.length - 2; ++i) {
        const spriteId = elements[i];
        const x = elements[i+1];
        const y = elements[i+2];
        console.assert(spriteId < this.bitmaps.length, "bitmap length mismatch");
        this.ctx.drawImage(this._bitmaps[spriteId], x, y);
      }
    }
  }
}
