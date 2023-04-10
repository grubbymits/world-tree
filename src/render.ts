import {
  DrawElement,
  GraphicEvent,
} from "./graphics.ts"
import { Point2D } from "./geometry.ts"

export class Renderer {
  protected _bitmaps: Array<ImageBitmap> = new Array<ImageBitmap>();

  constructor(protected readonly _width: number,
              protected readonly _height: number) { }

  get width(): number {
    return this._width;
  }
  get height(): number {
    return this._height;
  }
  get bitmaps(): Array<ImageBitmap> {
    return this._bitmaps;
  }

  addBitmap(id: number, bitmap: ImageBitmap): void {
    if (id == this.bitmaps.length) {
      this.bitmaps.push(bitmap);
    } else if (id < this.bitmaps.length) {
      this.bitmaps[id] = bitmap;
    } else {
      for (let i = this.bitmaps.length; i < id; ++i) {
        this.bitmaps.push({});
      }
      this.bitmaps.push(bitmap);
    }
    console.assert(id < this.bitmaps.length, "bitmap length mismatch");
  }
  draw(element: Array<DrawElement>): void;
}

export class OffscreenRenderer extends Renderer {
  private _ctx: OffscreenRenderingContext2D;

  constructor(width: number,
              height: number) {
    super(width, height);
    this._canvas = OffscreenCanvas();
    this._canvas.width = this.width;
    this._canvas.height = this.height;
    this._ctx = this._canvas.getContext('2d');
  }

  draw(elements: Array<DrawElement>): void {
    this._ctx.clearRect(0, 0, this._width, this._height);
    for (let i in elements) {
      const spriteId: number = elements[i].spriteId;
      console.assert(spriteId < this.bitmaps.length, "bitmap length mismatch");
      const coord: Point2D = elements[i].coord;
      this._ctx.draw(this.bitmaps[spriteId], coord.x, coord.y);
    }
  }
}

export class OnscreenRenderer extends Renderer {
  private _worker: Worker | null;
  private _ctx: ContextRendering2D | null;

  constructor(private _canvas: HTMLCanvasElement) {
    super(this.canvas.width, this.canvas.height);
    if (window.Worker) {
      const offscreen = this.canvas.transferControlToOffscreen();
      this._worker = new Worker("gfx-worker.ts");
      this.worker.postMessage({ type: GraphicEvent.AddCanvas, canvas: offscreen,
                                width: this.width, height: this.height },
                              [offscreen]);
    } else {
      this._ctx = this.canvas.getContext('2d');
    }
  }

  get canvas(): HTMLCanvasElement {
    return this._canvas;
  }
  get ctx(): CanvasRenderingContext2D {
    return this._ctx!;
  }
  get worker(): Worker {
    return this._worker!;
  }

  addBitmap(id: number, bitmap: ImageBitmap): void {
    if (window.Worker) {
      this.worker.postMessage({type: GraphicEvent.AddSprite, id: id,
                              sprite: bitmap}, [ bitmap ] );
    } else {
      super.addBitmap(id, bitmap);
    }
  }

  draw(elements: Array<DrawElement>): void {
    if (window.Worker) {
      // Transfer drawElements to worker.
      this.worker.postMessage({type: GraphicEvent.Draw, drawElements: elements},
                         [ elements.buffer] );
    } else {
      this.ctx.clearRect(0, 0, this._width, this._height);
      for (let i in elements) {
        const spriteId: number = elements[i].spriteId;
        const coord: Point2D = elements[i].coord;
        this.ctx.drawImage(this.bitmaps[spriteId], coord.x, coord.y);
      }
    }
  }
}
