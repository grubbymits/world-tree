import { SquareGrid } from "./map.js"
import { Entity } from "./entity.js"
import { Point3D } from "./geometry.js"
import { Terrain } from "./terrain.js"
import { Camera } from "./camera.js"

export class Point {
  constructor(private readonly _x: number,
              private readonly _y: number) { }
  get x() { return this._x; }
  get y() { return this._y; }
  add(other: Point): Point {
    return new Point(this.x + other.x, this.y + other.y);
  }
  sub(other: Point): Point {
    return new Point(this.x - other.x, this.y - other.y);
  }
}

export class SpriteSheet {
  private static _sheets = new Array<SpriteSheet>();

  private static add(sheet: SpriteSheet) {
    this._sheets.push(sheet);
  }

  private _image: HTMLImageElement;
  private _canvas: HTMLCanvasElement;

  constructor(name: string) {
    this._image = new Image();

    if (name) {
      this._image.src = name + ".png";
    } else {
      throw new Error("No filename passed");
    }
    SpriteSheet.add(this);

    let sheet = this;
    this._image.onload = function() {
      console.log("loaded:", sheet.image.src);
      sheet.canvas = document.createElement('canvas');
      let width: number = sheet.width;
      let height: number = sheet.height;
      sheet.canvas.width = width;
      sheet.canvas.height = height;
      sheet.canvas.getContext('2d')!.drawImage(sheet.image, 0, 0, width, height);
    };
  }

  get image(): HTMLImageElement { return this._image;  }
  get width(): number { return this._image.width; }
  get height(): number { return this._image.height; }
  get canvas(): HTMLCanvasElement { return this._canvas; }
  set canvas(c: HTMLCanvasElement) { this._canvas = c; }

  isTransparentAt(x: number, y: number): boolean {
    let data = this._canvas.getContext('2d')!.getImageData(x, y, 1, 1).data;
    return data[3] == 0;
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
  private readonly _spriteOffset: Point;
  private _drawOffset: Point;

  constructor(private readonly _sheet: SpriteSheet,
              offsetX: number,
              offsetY: number,
              private readonly _width: number,
              private readonly _height: number) {
    this._id = Sprite.sprites.length;
    this._spriteOffset = new Point(offsetX, offsetY);
    this._sheet = _sheet;
    Sprite.add(this);
    this._drawOffset = new Point(0, _height - 1);

    let sprite: Sprite = this;
    this._sheet.image.addEventListener('load', function() {
      // Find the bottom left-most point.
      for (let x = 0; x < _width; x++) {
        for (let y = _height - 1; y >= 0; y--) {
          if (!sprite.isTransparentAt(x, y)) {
            sprite._drawOffset = new Point(x, y-_height);
            console.log("set draw offset:", sprite._drawOffset);
            return;
          }
        }
      }
    });
  }

  draw(coord: Point, ctx: CanvasRenderingContext2D): void {
    ctx.drawImage(this._sheet.image,
                  this._spriteOffset.x, this._spriteOffset.y,
                  this._width, this._height,
                  coord.x + this.drawOffset.x,
                  coord.y + this.drawOffset.y,
                  this._width, this._height);
  }

  isTransparentAt(x: number, y: number): boolean {
    x += this._spriteOffset.x;
    y += this._spriteOffset.y;
    return this._sheet.isTransparentAt(x, y);
  }

  get id(): number { return this._id; }
  get width(): number { return this._width; }
  get height(): number { return this._height; }
  get drawOffset(): Point { return this._drawOffset; }
  set drawOffset(offset: Point) { this._drawOffset = offset; }
}

// Computer graphics have their origin in the top left corner.
// But the entity's position should be rooted at it's base, not possibly above
// it, so we need to make an adjustment when drawing. I'm not sure how to
// handle it because I guess we'll need to inverse for handling clicks.

export abstract class GraphicComponent {
  constructor(protected _currentSpriteId: number) { }
              
  abstract update(): number;
  isTransparentAt(x: number, y: number): boolean {
    return Sprite.sprites[this._currentSpriteId].isTransparentAt(x, y);
  }
  get width(): number { 
    return Sprite.sprites[this._currentSpriteId].width;
  }
  get height(): number { 
    return Sprite.sprites[this._currentSpriteId].height;
  }
  get offset(): Point {
    return Sprite.sprites[this._currentSpriteId].drawOffset;
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
  
  constructor(protected _canvas: HTMLCanvasElement) {
    this._width = _canvas.width;
    this._height = _canvas.height;
    this._ctx = this._canvas.getContext("2d", { alpha: false })!;
  }

  abstract getDrawCoord(location: Point3D): Point;
  abstract setDrawCoord(object: Entity): void;
  abstract drawBefore(a: Entity, b: Entity): boolean;

  dump(): void {
    console.log("scene graph contains number node:", this._nodes.size);
    console.log("draw order:");
    let node = this._root;
    while (node != undefined) {
      console.log(node.x, node.y, node.z);
      node = node.succ;
    }
  }

  renderGeometry(entity: Entity, camera: Camera): void {
    // draw red lines from which vertex of the bounding cuboid to draw a
    // red outline of it.
    let points: Array<Point3D> = entity.geometry.points;
    let first = points[0];
    let coord = camera.getDrawCoord(this.getDrawCoord(first));
    this._ctx.strokeStyle = "#FF0000";
    this._ctx.beginPath();
    this._ctx.moveTo(coord.x, coord.y);
    for (let i = 1; i < points.length; i++) {
      coord = camera.getDrawCoord(this.getDrawCoord(points[i]));
      this._ctx.lineTo(coord.x, coord.y);
    }
    this._ctx.stroke();
  }

  render(camera: Camera): void {
    this._ctx.clearRect(0, 0, this._width, this._height);
    let node = this._root;
    while (node != undefined) {
      let entity: Entity = node.entity;
      if (camera.isOnScreen(entity.drawCoord, entity.width, entity.depth) &&
          entity.visible) {
        let coord = camera.getDrawCoord(entity.drawCoord);
        for (let i in entity.graphics) {
          let component = entity.graphics[i];
          let spriteId = component.update();
          Sprite.sprites[spriteId].draw(coord, this._ctx);
        }
      }
      node = node.succ;
    }
    this.renderGeometry(this._root.entity, camera);
  }

  getLocationAt(x: number, y: number, camera: Camera): Point3D | null {
    let entity: Entity|null = this.getEntityDrawnAt(x, y, camera);
    if (entity != undefined) {
      return entity.bounds.minLocation;
    }
    return null;
  }

  getEntityDrawnAt(x: number, y: number, camera: Camera): Entity | null {
    let node = this._leaf;
    while (node != undefined) {
      let entity: Entity = node.entity;
      if (entity.visible &&
          camera.isOnScreen(entity.drawCoord, entity.width, entity.depth)) {
        let entityDrawCoord: Point = camera.getDrawCoord(entity.drawCoord);
        let graphic: GraphicComponent = entity.graphic;
        // Check whether inbounds of the sprite.
        if (x < entityDrawCoord.x || y < entityDrawCoord.y ||
            x > entityDrawCoord.x + graphic.width ||
            y > entityDrawCoord.y + graphic.height) {
          node = node.pred;
          continue;
        }
        if (!graphic.isTransparentAt(x - entityDrawCoord.x,
                                     y - entityDrawCoord.y)) {
          return entity;
        }
      }
      node = node.pred;
    }
    return null;
  }

  insertEntity(entity: Entity): void {
    this.setDrawCoord(entity);
    let node = new SceneNode(entity);
    this._nodes.set(entity, node);
    if (this._root == undefined) {
      console.log("set initial root of the scene");
      this._root = node;
      this._leaf = node;
      return;
    }

    let existing = this._root;
    while (existing != undefined) {
      if (!this.drawBefore(existing.entity, node.entity)) {
        if (existing == this._root) {
          this._root = node;
          this._root.succ = existing;
          existing.pred = this._root;
        } else {
          let first = existing.pred;
          let second = node;
          let third = existing;

          first.succ = second;
          second.pred = first;
          second.succ = third;
          third.pred = second;
        }
        return;
      }
      existing = existing.succ;
    }
    let last = this._leaf;
    this._leaf = node;
    last.succ = this._leaf;
    this._leaf.pred = last;
  }

  updateEntity(entity: Entity): void {
    this.setDrawCoord(entity);
  }
}

export class IsometricRenderer extends SceneGraph {
  constructor(canvas: HTMLCanvasElement) {
    super(canvas);
  }

  private static readonly _sqrt3 = Math.sqrt(3);
  private static readonly _halfSqrt3 = Math.sqrt(3) * 0.5;

  static getDrawCoord(loc: Point3D): Point {
    // An isometric square has:
    // - sides equal length = 1,
    // - the short diagonal is length = 1,
    // - the long diagonal is length = sqrt(3) ~= 1.73.
    // We're allowing the height to vary, so its a cuboid, not a cube, but with
    // a square top.

    // Tiles are placed overlapping each other by half.
    // If we use the scale above, it means an onscreen x,y (dx,dy) should be:
    let dx = Math.floor(this._halfSqrt3 * (loc.x + loc.y));
    let dy = Math.floor((0.5 * (loc.y - loc.x)) - loc.z);
    return new Point(dx, dy);
  }

  setDrawCoord(entity: Entity): void {
    let coord =
      IsometricRenderer.getDrawCoord(entity.bounds.minLocation);
    entity.drawCoord = new Point(coord.x, coord.y - entity.depth);
  }

  getDrawCoord(location: Point3D): Point {
    return IsometricRenderer.getDrawCoord(location);
  }

  drawBefore(first: Entity, second: Entity): boolean {
    let sameX: boolean = first.x == second.x;
    let sameY: boolean = first.y == second.y;
    let sameZ: boolean = first.z == second.z;

    // First should have a larger x.
    // First would have a smaller y.
    // First would have a smaller z.

    if (first.bounds.minZ < second.bounds.minZ) {
      return true;
    }
    if (first.bounds.minY < second.bounds.minY) {
      return true;
    }
    return first.bounds.minX > second.bounds.maxX;
    if (sameX && sameY) {
      return first.z < second.z;
    } else if (sameX && sameZ) {
      return first.y < second.y;
    } else if (sameY && sameZ) {
      return first.x > second.x;
    }
    if (sameX) {
      return first.z < second.z || first.y < second.y;
    } else if (sameY) {
      return first.z < second.z || first.x > second.x;
    } else {
      return first.x > second.x;
    }
  }
}
