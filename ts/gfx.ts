import { Point } from "map"

class SpriteSheet {
  private _image: HTMLImageElement;
  private _ready: boolean;

  constructor(name: string) {
    this._image = new Image();
    this._ready = false;

    if (name) {
      this._image.src = "res/img/" + name + ".png";
    } else {
      throw new Error("No filename passed");
    }
    console.log("load", name);
  }

  get image(): HTMLImageElement {
    return this._image;
  }
}

class Sprite {
  constructor(private readonly _sheet: SpriteSheet,
              private readonly _offsetX: number,
              private readonly _offsetY: number,
              private readonly _width: number,
              private readonly _height: number) { }

  render(coord: Point, ctx: CanvasRenderingContext2D): void {
    ctx.drawImage(this._sheet.image,
                  this._offsetX, this._offsetY,
                  this._width, this._height,
                  coord.x, coord.y,
                  this._width, this._height);
  }
}

class Renderer {
  constructor(private _ctx: CanvasRenderingContext2D,
              private readonly _width: number,
              private readonly _height: number,
              private _sprites: Array<Sprite>) { }

  clear(): void {
    this._ctx.fillStyle = '#000000';
    this._ctx.fillRect(0, 0, this._width, this._height);
  }

  render(coord: Point, id: number): void {
    this._sprites[id].render(coord, this._ctx);
  }
}
