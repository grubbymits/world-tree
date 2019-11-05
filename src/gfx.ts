import { Point, SquareGrid } from "./map.js"
import { Location, GameObject } from "./entity.js"
import { Terrain } from "./terrain.js"
import { Camera } from "./camera.js"

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
  protected readonly _width: number;
  protected readonly _height: number;
  protected _offscreenCanvas: HTMLCanvasElement;
  protected _ctx: CanvasRenderingContext2D;
  protected _visible: CanvasRenderingContext2D;

  constructor(protected _canvas: HTMLCanvasElement,
              protected _sprites: Array<Sprite>) {
    this._visible = this._canvas.getContext("2d", { alpha: false })!;
    this._width = _canvas.width;
    this._height = _canvas.height;
    this._offscreenCanvas = document.createElement('canvas');
    this._offscreenCanvas.width = this._width;
    this._offscreenCanvas.height = this._height;
    this._ctx = this._offscreenCanvas.getContext("2d", { alpha: false })!;
  }

  draw(coord: Point, id: number): void {
    this._sprites[id].draw(coord, this._ctx);
  }

  drawObject(gameObj: GameObject, camera: Camera) {
    let coord = this.getDrawCoord(gameObj);
    if (!camera.isOnScreen(coord)) {
      return;
    }
    coord = camera.getDrawCoord(coord);
    let spriteId = gameObj.graphicsComponent.update();
    this.draw(coord, spriteId);
  }

  abstract getDrawCoord(object: GameObject): Point;
  abstract drawFloor(gameMape: SquareGrid, camera: Camera): void;
  abstract sortGameObjects(objects: Array<GameObject>): void;

  drawAll(objects: Array<GameObject>, camera: Camera): void {
    this.sortGameObjects(objects);
    for (let i in objects) {
      this.drawObject(objects[i], camera);
    }
  }

  update(objects: Array<GameObject>, gameMap: SquareGrid, camera: Camera) {
    this._ctx.clearRect(0, 0, this._width, this._height);
    this.drawFloor(gameMap, camera);
    this.drawAll(objects, camera);
  }

  render(): void {
    this._visible.drawImage(this._offscreenCanvas, 0, 0);
  }
}

export class CartisanRenderer extends Renderer {
  constructor(canvas: HTMLCanvasElement,
              sprites: Array<Sprite>) {
    super(canvas, sprites);
  }

  getDrawCoord(object: GameObject): Point {
    return new Point(object.x, object.y - object.z);
  }

  drawFloor(gameMap: SquareGrid, camera: Camera) {
    for (let y = 0; y < gameMap.height; y++) {
      for (let x = 0; x < gameMap.width; x++) {
        let gameObj = gameMap.getFloor(x, y);
        let coord = this.getDrawCoord(gameObj);
        coord = camera.getDrawCoord(coord);
        let spriteId = gameObj.graphicsComponent.update();
        this.draw(coord, spriteId);
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
  constructor(canvas: HTMLCanvasElement,
              sprites: Array<Sprite>) {
    super(canvas, sprites);
  }

  getDrawCoord(gameObj: GameObject): Point {
    let loc = Terrain.scaleLocation(gameObj.location);
    let coord = convertToIsometric(loc.x + loc.z, loc.y - loc.z);
    return coord;
  }

  drawFloor(gameMap: SquareGrid, camera: Camera): void {
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

