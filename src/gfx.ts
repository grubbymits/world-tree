import { Point, SquareGrid } from "./map.js"
import { Location, GameObject } from "./entity.js"
import { Terrain } from "./terrain.js"

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
              protected _sprites: Array<Sprite>) { }

  clear(): void {
    this._ctx.fillStyle = '#000000';
    this._ctx.fillRect(0, 0, this._width, this._height);
  }

  draw(coord: Point, id: number): void {
    this._sprites[id].draw(coord, this._ctx);
  }

  drawObject(gameObj: GameObject, camera: Point) {
    let coord = this.getDrawCoord(gameObj);
    console.log("draw:", gameObj);
    console.log("at:", coord);
    coord = new Point(coord.x + camera.x, coord.y + camera.y);
    let spriteId = gameObj.graphicsComponent.update();
    this.draw(coord, spriteId);
  }

  abstract getDrawCoord(object: GameObject): Point;
  abstract drawFloor(camera: Point, gameMap: SquareGrid): void;
  abstract sortGameObjects(objects: Array<GameObject>): void;

  drawAll(objects: Array<GameObject>, camera: Point): void {
    this.sortGameObjects(objects);
    console.log("drawing objects:", objects.length);
    for (let i in objects) {
      this.drawObject(objects[i], camera);
    }
  }
}

export class CartisanRenderer extends Renderer {
  constructor(ctx: CanvasRenderingContext2D,
              width: number,
              height: number,
              sprites: Array<Sprite>) {
    super(ctx, width, height, sprites);
  }

  getDrawCoord(object: GameObject): Point {
    return new Point(object.x, object.y - object.z);
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

function convertToIsometric(x: number, y: number): Point {
  let width = Terrain.tileWidth;
  let height = Terrain.tileHeight;
  let drawX = Math.floor(x * width / 2) + Math.floor(y * width / 2);
  let drawY = Math.floor(y * height / 2) - Math.floor(x * height / 2);
  return new Point(drawX, drawY);
}

export class IsometricRenderer extends Renderer {
  constructor(ctx: CanvasRenderingContext2D,
              width: number,
              height: number,
              sprites: Array<Sprite>) {
    super(ctx, width, height, sprites);
  }

  getDrawCoord(gameObj: GameObject): Point {
    let loc = Terrain.scaleLocation(gameObj.location);
    let coord = convertToIsometric(loc.x + loc.z, loc.y - loc.z);
    return coord;
  }

  drawFloor(camera: Point, gameMap: SquareGrid): void {
    for (let y = 0; y < gameMap.height; y++) {
      for (let x = gameMap.width - 1; x >= 0; x--) {
        let terrain = gameMap.getFloor(x, y);
        this.drawObject(terrain, camera);
      }
    }
  }

  sortGameObjects(objects: Array<GameObject>): void {
    // We're drawing a 2D map, so depth is being simulated by the position on
    // the X axis and the order in which those elements are drawn. Insert
    // the new location and sort the array by draw order.
    objects.sort((a, b) => {
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

