import { Point, Location } from "./map.js"

export abstract class Drawable {
  protected _spriteId: number;

  constructor(protected _x: number,
              protected _y: number,
              protected _z: number,
              protected _drawPoint: Point) {
    this._spriteId = 0;
  }

  get x(): number {
    return this._x;
  }

  get y(): number {
    return this._y;
  }

  get z(): number {
    return this._z;
  }

  get drawPoint(): Point {
    return this._drawPoint;
  }

  get spriteId(): number {
    return this._spriteId;
  }

  set spriteId(id: number) {
    this._spriteId = id;
  }
}

export class SpriteSheet {
  private _image: HTMLImageElement;

  constructor(name: string) {
    this._image = new Image();

    if (name) {
      this._image.src = name + ".png";
    } else {
      throw new Error("No filename passed");
    }
    console.log("load", name);
  }

  get image(): HTMLImageElement {
    return this._image;
  }
}

export class Sprite {
  constructor(private readonly _sheet: SpriteSheet,
              private readonly _offsetX: number,
              private readonly _offsetY: number,
              private readonly _width: number,
              private readonly _height: number) { }

  draw(coord: Point, ctx: CanvasRenderingContext2D): void {
    ctx.drawImage(this._sheet.image,
                  this._offsetX, this._offsetY,
                  this._width, this._height,
                  coord.x, coord.y,
                  this._width, this._height);
  }
}

export class Renderer {
  constructor(private _ctx: CanvasRenderingContext2D,
              private readonly _width: number,
              private readonly _height: number,
              private _sprites: Array<Sprite>) { }

  clear(): void {
    this._ctx.fillStyle = '#000000';
    this._ctx.fillRect(0, 0, this._width, this._height);
  }

  draw(coord: Point, id: number): void {
    this._sprites[id].draw(coord, this._ctx);
  }

  drawAll(drawables: Array<Drawable>, camera: Point): void {
    for (let i in drawables) {
      let drawable = drawables[i];
      let coord = new Point(drawable.drawPoint.x + camera.x,
                            drawable.drawPoint.y + camera.y);
      this.draw(coord, drawable.spriteId);
    }
  }
}

