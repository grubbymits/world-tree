import { Entity } from "./entity.js"
import { Camera } from "./camera.js"
import { Point2D,
         Point3D } from "./geometry.js"
import { Sprite,
         GraphicComponent } from "./graphics.js"

enum RenderOrder {
  Before = -1,
  Any = 0,
  After = 1,
}

class SceneNode {
  private _pred : SceneNode|null;
  private _succ : SceneNode|null;
  private _level : SceneLevel|null;

  constructor(private readonly _entity: Entity) { }

  overlapX(other: SceneNode): boolean {
    return (this.entity.bounds.minX >= other.entity.bounds.minX &&
            this.entity.bounds.minX < other.entity.bounds.maxX) ||
           (this.entity.bounds.maxX > other.entity.bounds.minX &&
            this.entity.bounds.maxX <= other.entity.bounds.maxX);
  }

  overlapY(other: SceneNode): boolean {
    return (this.entity.bounds.minY >= other.entity.bounds.minY &&
            this.entity.bounds.minY < other.entity.bounds.maxY) ||
           (this.entity.bounds.maxY > other.entity.bounds.minY &&
            this.entity.bounds.maxY <= other.entity.bounds.maxY);
  }

  get entity(): Entity { return this._entity; }
  get pred(): SceneNode|null { return this._pred; }
  get succ(): SceneNode|null { return this._succ; }
  get level(): SceneLevel|null { return this._level; }
  get minZ(): number { return this._entity.bounds.minZ; }
  get maxZ(): number { return this._entity.bounds.maxZ; }
  set pred(pred: SceneNode|null) { this._pred = pred; }
  set succ(succ: SceneNode|null) { this._succ = succ; }
  set level(level: SceneLevel|null) { this._level = level; }
}

type NodeCompare = (nodeA: SceneNode, nodeB: SceneNode) => RenderOrder;

class SceneLevel {
  private _nodes: Array<SceneNode> = new Array<SceneNode>();
  private readonly _minZ: number;
  private readonly _maxZ: number;

  constructor(root: SceneNode) {
    this._minZ = root.minZ;
    this._maxZ = root.maxZ;
    this._nodes.push(root);
    root.level = this;
  }

  get nodes(): Array<SceneNode> { return this._nodes; }

  inrange(entity: Entity): boolean {
    return entity.bounds.minZ >= this._minZ && entity.bounds.minZ < this._maxZ;
  }

  add(node: SceneNode, drawOrder: NodeCompare): void {
    node.level = this;
    this._nodes.push(node);
    this.sort(drawOrder);
  }

  remove(node: SceneNode): void {
    this._nodes.splice(this._nodes.indexOf(node), 1);
  }

  sort(drawOrder: NodeCompare): void {
    this._nodes.sort(drawOrder);
  }
}

export abstract class SceneGraph {
  protected readonly _width: number;
  protected readonly _height: number;
  protected _ctx: CanvasRenderingContext2D;
  protected _levels: Array<SceneLevel> = new Array<SceneLevel>();
  protected _nodes: Map<number, SceneNode> = new Map<number, SceneNode>();

  constructor(protected _canvas: HTMLCanvasElement) {
    this._width = _canvas.width;
    this._height = _canvas.height;
    this._ctx = this._canvas.getContext("2d", { alpha: false })!;
  }

  abstract getDrawCoord(location: Point3D): Point2D;
  abstract setDrawCoord(object: Entity): void;
  abstract drawOrder(first: SceneNode, second: SceneNode): RenderOrder;

  render(camera: Camera): void {
    // Is this the first run? If so, organise the nodes into a level structure.
    if (this._levels.length == 0) {
      let nodeList = new Array<SceneNode>();
      for (let node of this._nodes.values()) {
        nodeList.push(node);
      }
      console.log("first render...");
      console.log("inserted nodes into list:", nodeList.length);
      nodeList.sort((a, b) => {
                      if (a.minZ <= b.minZ)
                        return RenderOrder.Before;
                      return RenderOrder.After
                    });
      nodeList.forEach((node) => this.insertIntoLevel(node));
    }

    let ctx = this._ctx;
    ctx.clearRect(0, 0, this._width, this._height);
    this._levels.forEach((level) => {
      level.nodes.forEach((node) => {
        const entity: Entity = node.entity;
        if (entity.visible &&
            camera.isOnScreen(entity.drawCoord, entity.width, entity.depth)) {
          const coord = camera.getDrawCoord(entity.drawCoord);
          entity.graphics.forEach((component) => {
            const spriteId = component.update();
            Sprite.sprites[spriteId].draw(coord, ctx);
          });
        }
      });
    });
  }

  insertEntity(entity: Entity): void {
    this.setDrawCoord(entity);
    let node = new SceneNode(entity);
    this._nodes.set(entity.id, node);

    // If we haven't initialised levels yet (its done in the first call to
    // render), just store the entity for then.
    // Otherwise, find the level that it belongs in, or create a new level.
    if (this._levels.length != 0) {
      this.insertIntoLevel(node);
    }
  }

  updateEntity(entity: Entity): void {
    console.assert(this._nodes.has(entity.id));
    this.setDrawCoord(entity);
    let node: SceneNode = this._nodes.get(entity.id)!;
    let level: SceneLevel = node.level!;
    if (level.inrange(node.entity)) {
      level.sort(this.drawOrder);
    } else {
      level.remove(node);
      this.insertIntoLevel(node);
    }
  }

  insertIntoLevel(node: SceneNode): void {
    for (let level of this._levels) {
      if (level.inrange(node.entity)) {
        level.add(node, this.drawOrder);
        console.log("level contains num of nodes:", level.nodes.length);
        return;
      }
    }
    console.log("creating new SceneLevel");
    this._levels.push(new SceneLevel(node));
  }

  getLocationAt(x: number, y: number, camera: Camera): Point3D | null {
    let entity: Entity|null = this.getEntityDrawnAt(x, y, camera);
    if (entity != null) {
      return entity.bounds.minLocation;
    }
    return null;
  }

  getEntityDrawnAt(x: number, y: number, camera: Camera): Entity | null {
    for (let i = this._levels.length - 1; i >= 0; i--) {
      const level: SceneLevel = this._levels[i];
      for (let j = 0; j < level.nodes.length; j++) {
        const node: SceneNode = level.nodes[j];
        const entity: Entity = node.entity;
        if (!entity.visible ||
            !camera.isOnScreen(entity.drawCoord, entity.width, entity.depth)) {
          continue;
        }
        let entityDrawCoord: Point2D = camera.getDrawCoord(entity.drawCoord);
        let graphic: GraphicComponent = entity.graphic;
        // Check whether inbounds of the sprite.
        if (x < entityDrawCoord.x || y < entityDrawCoord.y ||
            x > entityDrawCoord.x + graphic.width ||
            y > entityDrawCoord.y + graphic.height) {
          continue;
        }
        if (!graphic.isTransparentAt(x - entityDrawCoord.x,
                                     y - entityDrawCoord.y)) {
          return entity;
        }
      }
    }
    return null;
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
  }

  getDrawCoord(location: Point3D): Point2D {
    return IsometricRenderer.getDrawCoord(location);
  }

  drawOrder(first: SceneNode, second: SceneNode): RenderOrder {
    // priority ordering:
    // - smaller y
    // - greater x

    if (first.overlapX(second)) {
      return first.entity.bounds.maxY < second.entity.bounds.minY ?
        RenderOrder.Before : RenderOrder.After;
    }
    return first.entity.bounds.minX > second.entity.bounds.maxX ?
      RenderOrder.Before : RenderOrder.After;
  }
}
