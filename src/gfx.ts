import { Point, SquareGrid } from "./map.js"
import { Location, GameObject } from "./entity.js"

export enum CoordSystem {
  Cartisan,
  Isometric,
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

export abstract class GraphicsComponent {
  constructor(protected _currentSpriteId: number) { }
              
  abstract update(): number;
}

export class StaticGraphicsComponent extends GraphicsComponent {
  constructor(id: number) {
    super(id);
  }

  update(): number {
    return this._currentSpriteId;
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

  abstract getDrawCoord(object: GameObject): Point;
  abstract drawFloor(camera: Point, gameMap: SquareGrid): void;
  abstract sortGameObjects(objects: Array<GameObject>): void;

  drawAll(objects: Array<GameObject>, camera: Point): void {
    this.sortGameObjects(objects);
    for (let i in objects) {
      let gameObj = objects[i];
      let coord = this.getDrawCoord(gameObj);
      coord = new Point(coord.x + camera.x, coord.y + camera.y);
      let spriteId = gameObj.graphicsComponent.update();
      this.draw(coord, spriteId);
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

  getDrawCoord(object: GameObject): Point {
    let width = this._tileWidth;
    let height = this._tileHeight;
    return new Point(object.x * width,
                     (object.y * height) - (object.z * height));
  }

  drawFloor(camera: Point, gameMap: SquareGrid) {
    for (let y = 0; y < gameMap.height; y++) {
      for (let x = 0; x < gameMap.width; x++) {
        let gameObj = gameMap.getFloor(x, y);
        let coord = this.getDrawCoord(gameObj);
        let newCoord = new Point(coord.x + camera.x, coord.y + camera.y);
        let spriteId = gameObj.graphicsComponent.update();
        this.draw(newCoord, spriteId);
      }
    }
  }

  sortGameObjects(objects: Array<GameObject>): void {
    // We're drawing a 2D map, so depth is being simulated by the position on
    // the Y axis and the order in which those elements are drawn. Insert
    // the new location and sort the array by draw order.
    objects.sort((a, b) => {
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

  getDrawCoord(object: GameObject): Point {
    let width = this._tileWidth;
    let height = this._tileHeight;
    let coord = convertToIsometric(object.x + object.z,
                                   object.y - object.z,
                                   width, height);

    return coord;
  }

  drawFloor(camera: Point, gameMap: SquareGrid): void {
    for (let y = 0; y < gameMap.height; y++) {
      for (let x = gameMap.width - 1; x >= 0; x--) {
        let gameObj = gameMap.getFloor(x, y);
        let coord = this.getDrawCoord(gameObj);
        coord = new Point(coord.x + camera.x, coord.y + camera.y);
        let spriteId = gameObj.graphicsComponent.update();
        this.draw(coord, spriteId);
      }
    }
  }

  sortGameObjects(objects: Array<GameObject>): void {
    // We're drawing a 2D map, so depth is being simulated by the position on
    // the X axis and the order in which those elements are drawn. Insert
    // the new location and sort the array by draw order.
    objects.sort((a, b) => {
      let locA = a.location;
      let locB = a.location;
      if (locA.z > locB.z) {
        return 1;
      } else if (locB.z > locA.z) {
        return -1;
      }
      if (locA.y > locB.y) {
        return 1;
      } else if (locB.y > locA.y) {
        return -1;
      }
      if (locA.x < locB.x) {
        return 1;
      } else if (locB.x < locA.x) {
        return -1;
      }
      return 0;
    });
  }
}

