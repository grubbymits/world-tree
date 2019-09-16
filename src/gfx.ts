import { Point, Location, SquareGrid } from "./map.js"

export abstract class Drawable {
  protected _spriteId: number;

  constructor(protected _x: number,
              protected _y: number,
              protected _z: number) {
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

export abstract class Renderer {
  constructor(private _ctx: CanvasRenderingContext2D,
              protected readonly _width: number,
              protected readonly _height: number,
              protected readonly _tileWidth: number,
              protected readonly _tileHeight: number,
              protected _sprites: Array<Sprite>) { }

  clear(): void {
    this._ctx.fillStyle = '#000000';
    this._ctx.fillRect(0, 0, this._width, this._height);
  }

  draw(coord: Point, id: number): void {
    this._sprites[id].draw(coord, this._ctx);
  }

  abstract getDrawCoord(drawable: Drawable): Point;
  abstract drawFloor(camera: Point, gameMap: SquareGrid): void;
  abstract sortDrawables(drawables: Array<Drawable>): void;

  drawAll(drawables: Array<Drawable>, camera: Point): void {
    this.sortDrawables(drawables);
    for (let i in drawables) {
      let drawable = drawables[i];
      let coord = this.getDrawCoord(drawable);
      coord = new Point(coord.x + camera.x, coord.y + camera.y);
      this.draw(coord, drawable.spriteId);
    }
  }
}

export class CartisanRenderer extends Renderer {
  constructor(ctx: CanvasRenderingContext2D,
              width: number,
              height: number,
              tileWidth: number,
              tileHeight: number,
              sprites: Array<Sprite>) {
    super(ctx, width, height, tileWidth, tileHeight, sprites);
  }

  getDrawCoord(drawable: Drawable): Point {
    let width = this._tileWidth;
    let height = this._tileHeight;
    return new Point(drawable.x * width,
                     (drawable.y * height) - (drawable.z * height));
  }

  drawFloor(camera: Point, gameMap: SquareGrid) {
    for (let y = 0; y < gameMap.height; y++) {
      for (let x = 0; x < gameMap.width; x++) {
        let location = gameMap.getLocation(x, y);
        let coord = this.getDrawCoord(location);
        let newCoord = new Point(coord.x + camera.x, coord.y + camera.y);
        this.draw(newCoord, location.spriteId);
      }
    }
  }

  sortDrawables(drawables: Array<Drawable>): void {
    // We're drawing a 2D map, so depth is being simulated by the position on
    // the Y axis and the order in which those elements are drawn. Insert
    // the new location and sort the array by draw order.
    drawables.sort((a, b) => {
      if (a.z < b.z) {
        return 1;
      } else if (b.z < a.z) {
        return -1;
      }
      if (a.y < b.y) {
        return 1;
      } else if (b.y < a.y) {
        return -1;
      }
      return 0;
    });
  }
}

function convertToIsometric(x: number, y: number, width: number,
                            height: number): Point {
  let drawX = Math.floor(x * width / 2) + Math.floor(y * width / 2);
  let drawY = Math.floor(y * height / 2) - Math.floor(x * height / 2);
  return new Point(drawX, drawY);
}

export class IsometricRenderer extends Renderer {
  constructor(ctx: CanvasRenderingContext2D,
              width: number,
              height: number,
              tileWidth: number,
              tileHeight: number,
              sprites: Array<Sprite>) {
    super(ctx, width, height, tileWidth, tileHeight, sprites);
  }

  getDrawCoord(drawable: Drawable): Point {
    let width = this._tileWidth;
    let height = this._tileHeight;
    let coord = convertToIsometric(drawable.x + drawable.z,
                                   drawable.y - drawable.z,
                                   width, height);

    return coord;
  }

  drawFloor(camera: Point, gameMap: SquareGrid): void {
    for (let y = 0; y < gameMap.height; y++) {
      for (let x = gameMap.width - 1; x >= 0; x--) {
        let location = gameMap.getLocation(x, y);
        let coord = this.getDrawCoord(location);
        coord = new Point(coord.x + camera.x, coord.y + camera.y);
        this.draw(coord, location.spriteId);
      }
    }
  }

  sortDrawables(drawables: Array<Drawable>): void {
    // We're drawing a 2D map, so depth is being simulated by the position on
    // the X axis and the order in which those elements are drawn. Insert
    // the new location and sort the array by draw order.
    drawables.sort((a, b) => {
      if (a.z > b.z) {
        return 1;
      } else if (b.z > a.z) {
        return -1;
      }
      if (a.y > b.y) {
        return 1;
      } else if (b.y > a.y) {
        return -1;
      }
      if (a.x < b.x) {
        return 1;
      } else if (b.x < a.x) {
        return -1;
      }
      return 0;
    });
  }
}

