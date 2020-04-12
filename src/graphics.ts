import { SquareGrid } from "./map.js"
import { Entity,
         StaticEntity } from "./entity.js"
import { Location } from "./physics.js"
import { Terrain } from "./terrain.js"
import { Camera } from "./camera.js"

export enum CoordSystem {
  Cartisan,
  Isometric,
}

export class Point {
  constructor(private readonly _x: number,
              private readonly _y: number) { }
  get x() { return this._x; }
  get y() { return this._y; }
}

export class SpriteSheet {
  private static _sheets = new Array<SpriteSheet>();

  private static add(sheet: SpriteSheet) {
    this._sheets.push(sheet);
  }

  private _image: HTMLImageElement;

  constructor(name: string) {
    this._image = new Image();

    if (name) {
      this._image.src = name + ".png";
    } else {
      throw new Error("No filename passed");
    }
    console.log("load", name);
    SpriteSheet.add(this);
  }

  get image(): HTMLImageElement {
    return this._image;
  }
}

export class Sprite {
  private static _sprites = new Array<Sprite>();

  private static add(sprite: Sprite) {
    this._sprites.push(sprite);
  }

  static get sprites(): Array<Sprite> {
    return this._sprites;
  }

  private readonly _id: number;

  constructor(private readonly _sheet: SpriteSheet,
              private readonly _offsetX: number,
              private readonly _offsetY: number,
              private readonly _width: number,
              private readonly _height: number) {
    this._id = Sprite.sprites.length;
    Sprite.add(this);
  }

  draw(coord: Point, ctx: CanvasRenderingContext2D): void {
    ctx.drawImage(this._sheet.image,
                  this._offsetX, this._offsetY,
                  this._width, this._height,
                  coord.x, coord.y,
                  this._width, this._height);
  }

  get id(): number {
    return this._id;
  }
}

export abstract class GraphicComponent {
  constructor(protected _currentSpriteId: number) { }
              
  abstract update(): number;
}

export class StaticGraphicComponent extends GraphicComponent {
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
  protected _ctx: CanvasRenderingContext2D;
  
  constructor(protected _canvas: HTMLCanvasElement) {
    this._width = _canvas.width;
    this._height = _canvas.height;
    this._ctx = this._canvas.getContext("2d", { alpha: false })!;
  }

  abstract getDrawCoord(object: Entity): Point;
  abstract sortEntitys(objects: Array<Entity>): void;

  render(entities: Array<Entity>, camera: Camera) {
    this.sortEntitys(entities);
    this._ctx.clearRect(0, 0, this._width, this._height);
    for (let i in entities) {
      let entity = entities[i];
      let coord: Point;
      if (entity.static) {
        let staticEntity = <StaticEntity>(entity);
        coord = staticEntity.drawCoord;
      } else {
        coord = this.getDrawCoord(entity);
      }
      if (!camera.isOnScreen(coord, entity.width, entity.depth)) {
        continue;
      }
      coord = camera.getDrawCoord(coord);
      let spriteId = entity.graphicsComponent.update();
      Sprite.sprites[spriteId].draw(coord, this._ctx);
    }
  }
}

export class CartisanRenderer extends Renderer {
  constructor(canvas: HTMLCanvasElement) {
    super(canvas);
  }

  static getDrawCoord(entity: Entity): Point {
    return new Point(entity.x, entity.y - entity.z);
  }

  getDrawCoord(entity: Entity): Point {
    return CartisanRenderer.getDrawCoord(entity);
  }

  sortEntitys(entities: Array<Entity>): void {
    // We're drawing a 2D map, so depth is being simulated by the position on
    // the Y axis and the order in which those elements are drawn. Insert
    // the new location and sort the array by draw order.
    entities.sort((a, b) => {
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

export class IsometricRenderer extends Renderer {
  constructor(canvas: HTMLCanvasElement) {
    super(canvas);
  }

  static getDrawCoord(entity: Entity): Point {
    // An isometric square has:
    // - sides equal length = 1,
    // - the short diagonal is length = 1,
    // - the long diagonal is length = sqrt(3) ~= 1.73.
    // We're allowing the height to vary, so its a cuboid, not a cube, but with
    // a square top.

    // Tiles are placed overlapping each other by half.
    // If we use the scale above, it means an onscreen x,y (dx,dy) should be:
    let dx = Math.floor(0.5 * Math.sqrt(3) * (entity.x + entity.y));
    let dy = Math.floor((0.5 * (entity.y - entity.x)) - entity.z);
    return new Point(dx, dy);
  }

  getDrawCoord(entity: Entity): Point {
    return IsometricRenderer.getDrawCoord(entity);
  }

  sortEntitys(entities: Array<Entity>): void {
    // We're drawing a 2D map, so depth is being simulated by the position on
    // the X axis and the order in which those elements are drawn. Insert
    // the new location and sort the array by draw order.
    entities.sort((a, b) => {
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

