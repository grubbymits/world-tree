import { SquareGrid } from "./map.js"
import { Entity } from "./entity.js"
import { Point2D,
         Segment2D,
         Point3D } from "./geometry.js"
import { Terrain } from "./terrain.js"
import { Camera } from "./camera.js"

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
  private readonly _spriteOffset: Point2D;
  private _drawOffset: Point2D;

  constructor(private readonly _sheet: SpriteSheet,
              offsetX: number,
              offsetY: number,
              private readonly _width: number,
              private readonly _height: number) {
    this._id = Sprite.sprites.length;
    this._spriteOffset = new Point2D(offsetX, offsetY);
    this._sheet = _sheet;
    Sprite.add(this);
    this._drawOffset = new Point2D(0, _height - 1);

    let sprite: Sprite = this;
    this._sheet.image.addEventListener('load', function() {
      // Find the bottom left-most point.
      for (let x = 0; x < _width; x++) {
        for (let y = _height - 1; y >= 0; y--) {
          if (!sprite.isTransparentAt(x, y)) {
            sprite._drawOffset = new Point2D(x, y-_height);
            console.log("set draw offset:", sprite._drawOffset);
            return;
          }
        }
      }
    });
  }

  draw(coord: Point2D, ctx: CanvasRenderingContext2D): void {
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
  get drawOffset(): Point2D { return this._drawOffset; }
  set drawOffset(offset: Point2D) { this._drawOffset = offset; }
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
  get offset(): Point2D {
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
  private _succ: SceneNode|null = null;
  private _pred: SceneNode|null = null;

  constructor(private readonly _entity: Entity) { }

  get x(): number { return this._entity.x; }
  get y(): number { return this._entity.y; }
  get z(): number { return this._entity.z; }
  get entity(): Entity { return this._entity; }
  get pred(): SceneNode|null { return this._pred; }
  get succ(): SceneNode|null { return this._succ; }
  set succ(s: SceneNode|null) { this._succ = s; }
  set pred(p: SceneNode|null) { this._pred = p; }
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

  abstract getDrawCoord(location: Point3D): Point2D;
  abstract setDrawCoord(object: Entity): void;
  abstract drawBefore(a: Entity, b: Entity): boolean;

  dump(): void {
    console.log("scene graph contains number node:", this._nodes.size);
    console.log("draw order:");
    let node = this._root;
    while (node != null) {
      console.log(node.x, node.y, node.z);
      node = node.succ!;
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
    while (node != null) {
      let entity: Entity = node.entity;
      if (camera.isOnScreen(entity.drawCoord, entity.width, entity.depth) &&
          entity.visible) {
        let coord = camera.getDrawCoord(entity.drawCoord);
        for (let i in entity.graphics) {
          let component = entity.graphics[i];
          let spriteId = component.update();
          Sprite.sprites[spriteId].draw(coord, this._ctx);
        }
        if (entity.drawGeometry) {
          this.renderGeometry(entity, camera);
        }
      }
      node = node.succ!;
    }
  }

  getLocationAt(x: number, y: number, camera: Camera): Point3D | null {
    let entity: Entity|null = this.getEntityDrawnAt(x, y, camera);
    if (entity != null) {
      return entity.bounds.minLocation;
    }
    return null;
  }

  getEntityDrawnAt(x: number, y: number, camera: Camera): Entity | null {
    let node = this._leaf;
    while (node != null && node != undefined) {
      let entity: Entity = node.entity;
      if (entity.visible &&
          camera.isOnScreen(entity.drawCoord, entity.width, entity.depth)) {
        let entityDrawCoord: Point2D = camera.getDrawCoord(entity.drawCoord);
        let graphic: GraphicComponent = entity.graphic;
        // Check whether inbounds of the sprite.
        if (x < entityDrawCoord.x || y < entityDrawCoord.y ||
            x > entityDrawCoord.x + graphic.width ||
            y > entityDrawCoord.y + graphic.height) {
          node = node.pred!;
          continue;
        }
        if (!graphic.isTransparentAt(x - entityDrawCoord.x,
                                     y - entityDrawCoord.y)) {
          return entity;
        }
      }
      node = node.pred!;
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
      this._root.pred = null;
      this._root.succ = null;
      return;
    }
    return this.insertNode(node);
  }

  insertNode(node: SceneNode): void {
    // Update root?
    if (this.drawBefore(node.entity, this._root.entity)) {
      return this.insertBefore(node, this._root);
    }

    // Update leaf?
    if (this.drawBefore(this._leaf.entity, node.entity)) {
      return this.insertAfter(node, this._leaf);
    }

    let existing = this._root.succ;
    while (existing != null) {
      if (this.drawBefore(node.entity, existing.entity)) {
        this.insertBefore(node, existing);
        console.assert(this._root.pred == null,
                       "expected root to have no predecessor");
        console.assert(this._leaf.succ == null,
                       "expected leaf to have no successor",
                       this._leaf.entity.id);
        return;
      }
      existing = existing.succ!;
    }
    console.error("unable to insert entity into scene graph");
    console.log("entity at", node.entity.x, node.entity.y, node.entity.z);
    console.log("current leaf at:",
                this._leaf.entity.x,
                this._leaf.entity.y,
                this._leaf.entity.z);
  }

  insert(first: SceneNode, second: SceneNode, third: SceneNode): void {
    first.succ = second;
    second.pred = first;
    second.succ = third;
    third.pred = second;

    // verify insertion...
    let verifyChainMap = new Map();
    let node = this._root;
    let numFound = 0;
    while (node != null) {
      console.assert(!verifyChainMap.has(node.entity.id),
                     "node accessible more than once!");
      verifyChainMap.set(node, true);
      node = node.succ!;
      numFound++;
    }
    if (numFound == this._nodes.size) {
      //console.log("successful insertion");
    } else {
      console.error("unsuccessful insertion, only found", numFound,
                    "out of a total", this._nodes.size);
    }
  }

  insertBefore(node: SceneNode, succ: SceneNode): void {
    let first = succ.pred!;
    let second = node;
    let third = succ;

    if (first == null) {
      console.assert(succ.entity.id == this._root.entity.id,
                     "expected root node");
      console.log("updating root scene node:", node.entity.id);
      this._root = node;
      this._root.pred = null;
      this._root.succ = succ;
      succ.pred = this._root;
    } else {
      this.insert(first, second, third);
    }
  }

  insertAfter(node: SceneNode, pred: SceneNode): void {
    let first = pred;
    let second = node;
    let third = pred.succ!;

    if (third == null) {
      console.assert(pred.entity.id == this._leaf.entity.id,
                     "expected leaf node");
      console.log("updating leaf scene node:", node.entity.id);
      this._leaf = node;
      this._leaf.succ = null;
      this._leaf.pred = pred;
      pred.succ = this._leaf;
    } else {
      this.insert(first, second, third);
    }
  }

  remove(node: SceneNode): void {
    if (node.pred == null) {
      this._root = node.succ!;
      this._root.pred = null;
    } else if (node.succ == null) {
      this._leaf = node.pred!;
      this._leaf.succ = null;
    } else {
      let first = node.pred;
      let second = node.succ;
      first.succ = second;
      second.pred = first;
    }
    //console.log("removed node");
  }

  updateEntity(entity: Entity): void {
    console.assert(this._nodes.has(entity), "entity not in node map");
    this.setDrawCoord(entity);
    let node = this._nodes.get(entity)!;

    let pred = node.pred!;
    let succ = node.succ!;
    let drawBeforeSucc = succ != null && this.drawBefore(entity, succ.entity);
    let drawAfterPred = pred != null && this.drawBefore(pred.entity, entity);

    // Nothing to do.
    if (drawAfterPred && drawBeforeSucc ||
        pred == null && drawBeforeSucc ||
        succ == null && drawAfterPred) {
      console.log("no update needed");
      return;
    }

    this.remove(node);
    this.insertNode(node);
    return;

    /*
    if (pred != null && !drawAfterPred) {
      while (pred != null) {
        if (this.drawBefore(entity, pred.entity)) {
          return this.insertBefore(node, pred);
        }
        pred = pred.pred!;
      }
      return this.insertBefore(node, this._root);
    } else if (succ != null && !drawBeforeSucc) {
      while (succ != null) {
        if (this.drawBefore(entity, succ.entity)) {
          return this.insertBefore(node, succ);
        }
        succ = succ.succ!;
      }
      return this.insertAfter(node, this._leaf);
    }
    console.error("didn't update scene graph");
    */
  }
}

export class IsometricRenderer extends SceneGraph {
  constructor(canvas: HTMLCanvasElement) {
    super(canvas);
  }

  private static readonly _sqrt3 = Math.sqrt(3);
  private static readonly _halfSqrt3 = Math.sqrt(3) * 0.5;

  static getDrawCoord(loc: Point3D): Point2D {
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
    return new Point2D(dx, dy);
  }

  setDrawCoord(entity: Entity): void {
    let coord =
      IsometricRenderer.getDrawCoord(entity.bounds.minLocation);
    entity.drawCoord = new Point2D(coord.x, coord.y - entity.depth);

    // Create six lines that represent the drawing boundary.
    const min: Point3D = entity.bounds.minLocation;
    const max: Point3D = entity.bounds.maxLocation;

    const p0: Point2D = entity.drawCoord;
    const p1: Point2D =
      IsometricRenderer.getDrawCoord(new Point3D(min.x, min.y, max.z));
    const p2: Point2D =
      IsometricRenderer.getDrawCoord(new Point3D(max.x, min.y, max.z));
    const p3: Point2D = IsometricRenderer.getDrawCoord(max);
    const p4: Point2D =
      IsometricRenderer.getDrawCoord(new Point3D(max.x, max.y, min.z));
    const p5: Point2D =
      IsometricRenderer.getDrawCoord(new Point3D(min.x, max.y, min.z));

    entity.topOutline.length = 0;
    entity.sideOutline.length = 0;
    entity.baseOutline.length = 0;

    entity.sideOutline.push(new Segment2D(p0, p1));
    entity.topOutline.push(new Segment2D(p1, p2));
    entity.topOutline.push(new Segment2D(p2, p3));
    entity.sideOutline.push(new Segment2D(p3, p4));
    entity.baseOutline.push(new Segment2D(p4, p5));
    entity.baseOutline.push(new Segment2D(p5, p0));
  }

  getDrawCoord(location: Point3D): Point2D {
    return IsometricRenderer.getDrawCoord(location);
  }

  drawBefore(first: Entity, second: Entity): boolean {
    // priority ordering:
    // - smaller z
    // - smaller y
    // - greater x

    // renders a 3D grid fine
    const sameX = first.x == second.x;
    const sameY = first.y == second.y;
    const sameZ = first.z == second.z;
    if (sameX) {
      if (sameY) {
        return first.z < second.z;
      }
      return first.y < second.y;
    }

    const overlapX = (first.bounds.minX > second.bounds.minX &&
                      first.bounds.minX < second.bounds.maxX) ||
                     (first.bounds.maxX > second.bounds.minX &&
                      first.bounds.maxX < second.bounds.maxX);
    const overlapY = (first.bounds.minY > second.bounds.minY &&
                      first.bounds.minY < second.bounds.maxY) ||
                     (first.bounds.maxY > second.bounds.minY &&
                      first.bounds.maxY < second.bounds.maxY);
    const overlapZ = (first.bounds.minZ > second.bounds.minZ &&
                      first.bounds.minZ < second.bounds.maxZ) ||
                     (first.bounds.maxZ > second.bounds.minZ &&
                      first.bounds.maxZ < second.bounds.maxZ);

    if (!overlapX && !overlapY && !overlapZ) {
      return first.x > second.x;
    }

    // If the entities aren't nicely aligned on the grid, then we need to
    // check for intersections.
    for (let sideSegment of second.sideOutline) {
      for (let baseSegment of first.baseOutline) {
        if (baseSegment.intersects(sideSegment)) {
          return true;
        }
      }
      for (let topSegment of first.topOutline) {
        if (topSegment.intersects(sideSegment)) {
          return true;
        }
      }
    }
    return first.x > second.x;
  }
}
