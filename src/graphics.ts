import { SquareGrid } from "./map.js"
import { Entity } from "./entity.js"
import { Location } from "./physics.js"
import { Terrain } from "./terrain.js"
import { Camera } from "./camera.js"

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

  isTransparentAt(offset: Point): boolean {
    let x: number = this._offsetX + offset.x;
    let y: number = this._offsetY + offset.y;
    let width: number = this._sheet.image.width;
    let alpha: number = (y * (width * 4)) + (x * 4) + 3;
    return alpha == 0;
  }

  get id(): number { return this._id; }
  get width(): number { return this._width; }
  get height(): number { return this._height; }
}

// Computer graphics have their origin in the top left corner.
// But the entity's position should be rooted at it's base, not possibly above
// it, so we need to make an adjustment when drawing. I'm not sure how to
// handle it because I guess we'll need to inverse for handling clicks.

export abstract class GraphicComponent {
  constructor(protected _currentSpriteId: number) { }
              
  abstract update(): number;
  isTransparentAt(offset: Point): boolean {
    return Sprite.sprites[this._currentSpriteId].isTransparentAt(offset);
  }
  get width(): number { 
    return Sprite.sprites[this._currentSpriteId].width;
  }
  get height(): number { 
    return Sprite.sprites[this._currentSpriteId].height;
  }
}

export class StaticGraphicComponent extends GraphicComponent {
  constructor(id: number) {
    super(id);
  }

  update(): number {
    return this._currentSpriteId;
  }
}

export class OssilateGraphicComponent extends GraphicComponent {
  private _increase: boolean = true;
  private _startId: number = 0;
  private _endId: number = 0;
  private _nextUpdate: number = 0;

  constructor(sprites: Array<Sprite>,
              private readonly _interval: number) {
    super(sprites[0].id);
    this._startId = sprites[0].id;
    this._endId = sprites[sprites.length - 1].id;
    this._currentSpriteId =
      Math.floor(Math.random() * (this._endId - this._startId) + this._startId);
    this._nextUpdate = Date.now() + _interval;
  }

  update(): number {
    if (this._nextUpdate > Date.now()) {
      return this._currentSpriteId;
    }

    if (this._increase) {
      if (this._currentSpriteId != this._endId) {
        this._currentSpriteId++;
      } else {
        this._increase = false;
      }
    } else if (this._currentSpriteId != this._startId) {
      this._currentSpriteId--;
    } else {
      this._increase = true;
    }

    this._nextUpdate = Date.now() + this._interval;
    return this._currentSpriteId;
  }
}

class SceneNode {
  private _succ: SceneNode;
  private _pred: SceneNode;

  constructor(private readonly _entity: Entity) { }

  get x(): number { return this._entity.x; }
  get y(): number { return this._entity.y; }
  get z(): number { return this._entity.z; }
  get entity(): Entity { return this._entity; }
  get pred(): SceneNode { return this._pred; }
  get succ(): SceneNode { return this._succ; }
  set succ(s: SceneNode) { this._succ = s; }
  set pred(p: SceneNode) { this._pred = p; }
}

export abstract class SceneGraph {
  protected readonly _width: number;
  protected readonly _height: number;
  protected _ctx: CanvasRenderingContext2D;
  protected _root: SceneNode;
  protected _leaf: SceneNode;
  protected _nodes: Map<Entity, SceneNode> = new Map<Entity, SceneNode>();
  
  constructor(protected _canvas: HTMLCanvasElement,
              entities: Array<Entity>) {
    this._width = _canvas.width;
    this._height = _canvas.height;
    this._ctx = this._canvas.getContext("2d", { alpha: false })!;
    this.initDrawCoords(entities);
    entities.sort(this.drawOrder);
    this._root = new SceneNode(entities[0]);
    this._nodes.set(entities[0], this._root);

    let pred = this._root;
    for (let i = 1; i < entities.length; i++) {
      let entity = entities[i];
      let succ = new SceneNode(entity);
      this._nodes.set(entity, succ);
      pred.succ = succ;
      succ.pred = pred;
      pred = succ;
    }
    this._leaf  = pred;
  }

  abstract getDrawCoord(object: Entity): Point;
  abstract drawOrder(a: Entity, b: Entity): number;
  abstract initDrawCoords(objects: Array<Entity>): void;

  render(camera: Camera) {
    this._ctx.clearRect(0, 0, this._width, this._height);
    let node = this._root;
    while (node != undefined) {
      let entity: Entity = node.entity;
      if (entity.visible) {
        let coord: Point = this.getDrawCoord(entity);
        if (camera.isOnScreen(coord, entity.width, entity.depth)) {
          coord = camera.getDrawCoord(coord);
          for (let i in entity.graphics) {
            let component = entity.graphics[i];
            let spriteId = component.update();
            Sprite.sprites[spriteId].draw(coord, this._ctx);
          }
        }
      }
      node = node.succ;
    }
  }

  getDrawnAt(draw: Point, camera: Camera): Entity | null {
    console.log("getDrawnAt:", draw);
    console.log("camera centre: ", camera.pivot);
    let node = this._leaf;
    while (node != undefined) {
      let entity: Entity = node.entity;
      if (camera.isOnScreen(entity.drawCoord, entity.width, entity.depth)) {
        let entityDrawCoord: Point = camera.getDrawCoord(entity.drawCoord);
        // Check whether inbounds of the sprite.
        if (draw.x < entityDrawCoord.x || draw.y < entityDrawCoord.y ||
            draw.x > entityDrawCoord.x + entity.graphic.width ||
            draw.y > entityDrawCoord.y + entity.graphic.height) {
          node = node.pred;
          continue;
        }
        let spriteOffset: Point = 
          new Point(draw.x - entityDrawCoord.x, draw.y - entityDrawCoord.y);
        if (!entity.graphic.isTransparentAt(spriteOffset)) {
          console.log("found entity drawn at:", entityDrawCoord);
          return entity;
        }
      }
      node = node.pred;
    }
    return null;
  }

  insertEntity(entity: Entity): void {
    let node = new SceneNode(entity);
    this._nodes.set(entity, node);
    let next = this._root;
    let last = next;
    while (next != undefined) {
      if (this.drawOrder(node.entity, next.entity) == -1) {
        node.pred = next.pred;
        node.succ = next;
        next.pred = node;
        return;
      }
      last = next;
      next = next.succ;
    }
    console.log("inserting node at end");
    last.succ = node;
    node.pred = last;
    this._leaf = node;
  }
}

export class IsometricRenderer extends SceneGraph {
  constructor(canvas: HTMLCanvasElement,
              entities: Array<Entity>) {
    super(canvas, entities);
  }

  private static readonly _sqrt3 = Math.sqrt(3);
  private static readonly _halfSqrt3 = Math.sqrt(3) * 0.5;

  static getDrawCoord(entity: Entity): Point {
    // An isometric square has:
    // - sides equal length = 1,
    // - the short diagonal is length = 1,
    // - the long diagonal is length = sqrt(3) ~= 1.73.
    // We're allowing the height to vary, so its a cuboid, not a cube, but with
    // a square top.

    // Tiles are placed overlapping each other by half.
    // If we use the scale above, it means an onscreen x,y (dx,dy) should be:
    let dx = Math.floor(this._halfSqrt3 * (entity.x + entity.y));
    let dy = Math.floor((0.5 * (entity.y - entity.x)) - entity.z);
    return new Point(dx, dy);
  }

  getDrawCoord(entity: Entity): Point {
    if (entity.hasMoved) {
      let coord = IsometricRenderer.getDrawCoord(entity);
      entity.drawCoord = coord;
    }
    return entity.drawCoord;
  }

  initDrawCoords(entities: Array<Entity>): void {
    for (let entity of entities) {
      entity.drawCoord = IsometricRenderer.getDrawCoord(entity);
    }
  }

  drawOrder(a: Entity, b: Entity): number {
    // max x, min y and min z (top right of screen, lowest level) would be
    // first drawn. Then from max x we could draw columns, reducing x after each
    // column. Then z can be increased and the drawing can continue.
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
  }
}
