import { PhysicalEntity,
         GraphicalEntity } from "./entity.js"
import { Camera } from "./camera.js"
import { Point2D,
         Point3D,
         Segment2D } from "./geometry.js"
import { Sprite,
         GraphicComponent } from "./graphics.js"
import { Dimensions } from "./physics.js"
import { TimedEventHandler } from "./events.js"

export enum RenderOrder {
  Before = -1,
  Any = 0,
  After = 1,
}

export class SceneNode {
  private _preds : Array<SceneNode> = new Array<SceneNode>();
  private _succs : Array<SceneNode> = new Array<SceneNode>();
  private _level : SceneLevel|null;
  private _topOutlineSegments: Array<Segment2D> = new Array<Segment2D>();
  private _sideOutlineSegments: Array<Segment2D> = new Array<Segment2D>();
  private _baseOutlineSegments: Array<Segment2D> = new Array<Segment2D>();

  constructor(private readonly _entity: PhysicalEntity,
              private _drawCoord: Point2D) { }

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

  overlapZ(other: SceneNode): boolean {
    return (this.entity.bounds.minZ >= other.entity.bounds.minZ &&
            this.entity.bounds.minZ < other.entity.bounds.maxZ) ||
           (this.entity.bounds.maxZ > other.entity.bounds.minZ &&
            this.entity.bounds.maxZ <= other.entity.bounds.maxZ);
  }

  intersectsTop(other: SceneNode): boolean {
    for (let otherTop of other.topSegments) {
      for (let baseSegment of this.baseSegments) {
        if (baseSegment.intersects(otherTop)) {
          return true;
        }
      }
      for (let sideSegment of this.sideSegments) {
        if (sideSegment.intersects(otherTop)) {
          return true;
        }
      }
    }
    return false;
  }

  addPred(pred: SceneNode) {
    let idx = this._preds.indexOf(pred);
    if (idx != -1) return;
    this._preds.push(pred);
  }
  addSucc(succ: SceneNode) {
    let idx = this._succs.indexOf(succ);
    if (idx != -1) return;
    this._succs.push(succ);
  }
  removePred(pred: SceneNode) {
    let idx = this._preds.indexOf(pred);
    if (idx == -1) return;
    this._preds.splice(idx, 1);
  }
  removeSucc(succ: SceneNode) {
    let idx = this._succs.indexOf(succ);
    if (idx == -1) return;
    this._succs.splice(idx, 1);
  }

  get id(): number { return this._entity.id; }
  get drawCoord(): Point2D { return this._drawCoord; }
  get topSegments(): Array<Segment2D> { return this._topOutlineSegments; }
  get baseSegments(): Array<Segment2D> { return this._baseOutlineSegments; }
  get sideSegments(): Array<Segment2D> { return this._sideOutlineSegments; }
  get allSegments(): Array<Segment2D> {
    let outline = new Array<Segment2D>();
    this.topSegments.forEach(segment => outline.push(segment));
    this.sideSegments.forEach(segment => outline.push(segment));
    this.baseSegments.forEach(segment => outline.push(segment));
    return outline;
  }
  get entity(): PhysicalEntity { return this._entity; }
  get preds(): Array<SceneNode> { return this._preds; }
  get succs(): Array<SceneNode> { return this._succs; }
  get level(): SceneLevel|null { return this._level; }
  get minZ(): number { return this._entity.bounds.minZ; }
  get maxZ(): number { return this._entity.bounds.maxZ; }
  set level(level: SceneLevel|null) { this._level = level; }
  set drawCoord(coord: Point2D) { this._drawCoord = coord; }
  get isRoot(): boolean { return this._preds.length == 0; }
}

type NodeCompare = (firstId: number, secondId: number) => RenderOrder;

class SceneLevel {
  private _nodes: Array<SceneNode> = new Array<SceneNode>();
  private _roots: Array<SceneNode> = new Array<SceneNode>();
  private _discovered: Set<SceneNode> = new Set<SceneNode>();
  private _topologicalOrder: Array<SceneNode> = new Array<SceneNode>();
  private readonly _minZ: number;
  private readonly _maxZ: number;

  constructor(root: SceneNode) {
    this._minZ = root.minZ;
    this._maxZ = root.maxZ;
    this._nodes.push(root);
    root.level = this;
  }

  get nodes(): Array<SceneNode> { return this._nodes; }
  get roots(): Array<SceneNode> { return this._roots; }
  get order(): Array<SceneNode> { return this._topologicalOrder; }

  inrange(entity: PhysicalEntity): boolean {
    return entity.bounds.minZ >= this._minZ && entity.bounds.minZ < this._maxZ;
  }

  add(node: SceneNode, graph: SceneGraph): void {
    node.level = this;
    this._nodes.push(node);
    this.update(node, graph);
  }

  remove(node: SceneNode): void {
    let idx = this._nodes.indexOf(node);
    console.assert(idx != -1);
    this._nodes.splice(idx, 1);

    idx = this._roots.indexOf(node);
    if (idx != -1) {
      this._roots.splice(idx, 1);
    }
  }

  update(node: SceneNode, graph: SceneGraph): void {
    node.preds.forEach((pred) => {
      if (graph.drawOrder(pred, node) != RenderOrder.Before) {
        pred.removeSucc(node);
        node.removePred(pred);
      }
    });

    node.succs.forEach((succ) => {
      if (graph.drawOrder(succ, node) != RenderOrder.After) {
        node.removeSucc(succ);
        succ.removePred(node);
      }
    });

    for (let i = 0; i < this._nodes.length; i++) {
      let existing = this._nodes[i];
      if (existing.id == node.id) {
        continue;
      }
      const order = graph.drawOrder(node, existing);
      if (RenderOrder.Before == order) {
        node.addSucc(existing);
        existing.addPred(node);
      } else if (RenderOrder.After == order) {
        existing.addSucc(node);
        node.addPred(existing);
      }
    }

    if (node.isRoot && this._roots.indexOf(node) == -1) {
      this._roots.push(node);
      //console.log("num roots:", this._roots.length);
    }
    this._discovered.clear();
    this._topologicalOrder.length = 0;
    for (let i in this._roots) {
      if (this._discovered.has(this._roots[i])) {
        continue;
      }
      this.topologicalSort(graph, this._roots[i]);
    }
  }

  buildGraph(graph: SceneGraph): void {

    // TODO: Should be able to form a transistive reduction using ordered
    // pairs...
    // this._nodes.sort((a, b) => graph.drawOrder(a.id, b.id));
    // transistive closure
    let startTime = Date.now();
    for (let i = 0; i < this._nodes.length; i++) {
      let nodeI = this._nodes[i];
      for (let j = 0; j < this._nodes.length; j++) {
        if (i == j) continue;
        let nodeJ = this._nodes[j];
        const order = graph.drawOrder(nodeI, nodeJ);
        if (RenderOrder.Before == order) {
          nodeI.addSucc(nodeJ);
          nodeJ.addPred(nodeI);
        } else if (RenderOrder.After == order) {
          nodeJ.addSucc(nodeI);
          nodeI.addPred(nodeJ);
        }
      }
    }
    let endTime = Date.now();
    console.log("building graph of size:", this._nodes.length);
    console.log("time elasped (ms):", endTime - startTime);

    for (let node of this._nodes) {
      if (node.preds.length == 0) {
        this._roots.push(node);
        //console.log("root id:", node.id);
      }
    }

    //console.log("num scene roots:", this._roots.length);
    this._discovered.clear();
    this._topologicalOrder.length = 0;
    startTime = Date.now();
    for (let i in this._roots) {
      if (this._discovered.has(this._roots[i])) {
        continue;
      }
      this.topologicalSort(graph, this._roots[i]);
    }
    endTime = Date.now();
    console.log("time elasped for graph sort (ms):", endTime - startTime);
  }

  topologicalSort(graph: SceneGraph, node: SceneNode): void {
    this._discovered.add(node);
    for (let succ of node.succs) {
      if (this._discovered.has(succ))
        continue;
      this.topologicalSort(graph, succ);
    }
    this._topologicalOrder.push(node);
  }
}

export abstract class SceneGraph {
  protected _levels: Array<SceneLevel> = new Array<SceneLevel>();

  abstract getDrawCoord(location: Point3D): Point2D;
  abstract drawOrder(first: SceneNode, second: SceneNode): RenderOrder;

  constructor() { }

  setDrawCoords(node: SceneNode): void {
    const entity: PhysicalEntity = node.entity;
    const min: Point3D = entity.bounds.minLocation;
    const max: Point3D = entity.bounds.maxLocation;
    const width = entity.bounds.width;
    const depth = entity.bounds.depth;
    const height = entity.bounds.height;

    node.topSegments.length = 0;
    node.baseSegments.length = 0;
    node.sideSegments.length = 0;

    const min2D = this.getDrawCoord(min);
    const base1 = this.getDrawCoord(new Point3D(min.x, max.y, min.z));
    const base2 = this.getDrawCoord(new Point3D(max.x, max.y, min.z));
    node.baseSegments.push(new Segment2D(min2D, base1));
    node.baseSegments.push(new Segment2D(base1, base2));

    const max2D = this.getDrawCoord(max);
    const top1 = this.getDrawCoord(new Point3D(min.x, min.y, max.z));
    const top2 = this.getDrawCoord(new Point3D(max.x, min.y, max.z));
    node.topSegments.push(new Segment2D(top1, top2));
    node.topSegments.push(new Segment2D(top2, max2D));

    node.sideSegments.push(new Segment2D(min2D, top1));
    node.sideSegments.push(new Segment2D(base2, max2D));

    const drawHeightOffset = min2D.sub(top2);
    const coord = this.getDrawCoord(entity.bounds.minLocation);
    const adjustedCoord = new Point2D(coord.x, coord.y - drawHeightOffset.y);
    node.drawCoord = adjustedCoord;
  }

  get levels(): Array<SceneLevel> { return this._levels; }
  get initialised(): boolean { return this.levels.length != 0; }

  insertNode(node: SceneNode): void {
    this.setDrawCoords(node);
    // If we haven't initialised levels yet (its done in the first call to
    // render), just store the entity for then.
    // Otherwise, find the level that it belongs in, or create a new level.
    if (this.initialised) {
      this.insertIntoLevel(node);
    }
  }

  updateNode(node: SceneNode): void {
    this.setDrawCoords(node);
    let level: SceneLevel = node.level!;
    if (level.inrange(node.entity)) {
      level.update(node, this);
    } else {
      level.remove(node);
      this.insertIntoLevel(node);
    }
  }

  insertIntoLevel(node: SceneNode): void {
    for (let level of this._levels) {
      if (level.inrange(node.entity)) {
        level.add(node, this);
        return;
      }
    }
    console.log("creating new SceneLevel");
    this._levels.push(new SceneLevel(node));
  }

  buildLevels(): void {
    this._levels.forEach((level) => level.buildGraph(this));
  }
}

export class SceneRenderer {
  protected readonly _width: number;
  protected readonly _height: number;
  protected _ctx: CanvasRenderingContext2D;
  protected _handler = new TimedEventHandler();
  protected _nodes: Map<number, SceneNode> = new Map<number, SceneNode>();

  constructor(private _canvas: HTMLCanvasElement,
              private _graph: SceneGraph) {
    this._width = _canvas.width;
    this._height = _canvas.height;
    this._ctx = this._canvas.getContext("2d", { alpha: false })!;
  }

  get ctx(): CanvasRenderingContext2D { return this._ctx; }
  get graph(): SceneGraph { return this._graph; }
  get nodes(): Map<number, SceneNode> { return this._nodes; }

  getNode(id: number): SceneNode {
    console.assert(this.nodes.has(id));
    return this.nodes.get(id)!;
  }

  addTimedEvent(callback: Function): void {
    this._handler.add(callback);
  }

  insertEntity(entity: PhysicalEntity): void {
    let node =
      new SceneNode(entity, this.graph.getDrawCoord(entity.bounds.minLocation));
    this.nodes.set(node.id, node);
    this.graph.insertNode(node);
  }

  updateEntity(entity: PhysicalEntity): void {
    console.assert(this._nodes.has(entity.id));
    let node: SceneNode = this._nodes.get(entity.id)!;
    this.graph.updateNode(node);
  }

  getLocationAt(x: number, y: number, camera: Camera): Point3D | null {
    let entity: PhysicalEntity|null = this.getEntityDrawnAt(x, y, camera);
    if (entity != null) {
      return entity.bounds.minLocation;
    }
    return null;
  }

  getEntityDrawnAt(x: number, y: number, camera: Camera): GraphicalEntity | null {
    for (let i = this.graph.levels.length - 1; i >= 0; i--) {
      const level: SceneLevel = this.graph.levels[i];
      for (let j = 0; j < level.nodes.length; j++) {
        const node: SceneNode = level.nodes[j];
        if (!node.entity.visible || !node.entity.drawable) {
          continue;
        }
        const entity = <GraphicalEntity>node.entity;
        if (!camera.isOnScreen(node.drawCoord, entity.width, entity.depth)) {
          continue;
        }

        let onScreenCoord: Point2D = camera.getDrawCoord(node.drawCoord);
        let graphic: GraphicComponent = entity.graphic;
        // Check whether inbounds of the sprite.
        if (x < onScreenCoord.x || y < onScreenCoord.y ||
            x > onScreenCoord.x + graphic.width ||
            y > onScreenCoord.y + graphic.height) {
          continue;
        }
        if (!graphic.isTransparentAt(x - onScreenCoord.x,
                                     y - onScreenCoord.y)) {
          return entity;
        }
      }
    }
    return null;
  }

  renderNode(node: SceneNode, camera: Camera): void {
    if (!node.entity.visible || !node.entity.drawable) {
      return;
    }
    // Only graphical entities are drawable.
    const entity = <GraphicalEntity>node.entity;
    const width = entity.graphics[0].width;
    const height = entity.graphics[0].height; 
    if (camera.isOnScreen(node.drawCoord, width, height)) {
      const coord = camera.getDrawCoord(node.drawCoord);
      entity.graphics.forEach((component) => {
        const spriteId: number = component.update();
        Sprite.sprites[spriteId].draw(coord, this.ctx);
      });
    }
  };

  render(camera: Camera): void {
    // Is this the first run? If so, organise the nodes into a level structure.
    if (!this.graph.initialised) {
      let nodeList = new Array<SceneNode>();
      for (let node of this._nodes.values()) {
        nodeList.push(node);
      }
      console.log("first render...");
      console.log("inserted nodes into list:", nodeList.length);
      nodeList.sort((a, b) => {
                      if (a.minZ < b.minZ)
                        return RenderOrder.Before;
                      if (a.minZ > b.minZ)
                        return RenderOrder.After;
                      return RenderOrder.Any;
                    });
      nodeList.forEach((node) => this.graph.insertIntoLevel(node));
      this.graph.buildLevels();
    }

    this.ctx.clearRect(0, 0, this._width, this._height);
    this.graph.levels.forEach((level) => {
      for (let i = level.order.length - 1; i >= 0; i--) {
        const node: SceneNode = level.order[i];
        this.renderNode(node, camera);
      }
    });

    this._handler.service();
  }
}

export enum Perspective {
  TrueIsometric,
  TwoByOneIsometric,
}

// An isometric square has:
// - sides equal length = 1,
// - the short diagonal is length = 1,
// - the long diagonal is length = sqrt(3) ~= 1.73.
export class IsometricPhysicalDimensions extends Dimensions {
  private static readonly _oneOverSqrt3: number = 1 / Math.sqrt(3);

  static physicalWidth(spriteWidth: number): number {
    return Math.round(spriteWidth * this._oneOverSqrt3);
  }

  static physicalDepth(physicalWidth: number,
                       relativeDims: Dimensions) {
    let depthRatio: number = relativeDims.depth / relativeDims.width;
    return Math.round(physicalWidth * depthRatio);
  }

  static physicalHeight(physicalWidth: number,
                        relativeDims: Dimensions): number {
    let heightRatio: number = relativeDims.height / relativeDims.width;
    return Math.round(physicalWidth * heightRatio);
  }

  constructor(spriteWidth: number,
              relativeDims: Dimensions) {
    let width = IsometricPhysicalDimensions.physicalWidth(spriteWidth);
    let depth = IsometricPhysicalDimensions.physicalDepth(width, relativeDims);
    let height = IsometricPhysicalDimensions.physicalHeight(width, relativeDims);
    super(width, depth, height);
  }
}

export class TrueIsometric extends SceneGraph {
  constructor() { super(); }

  protected static readonly _sqrt3 = Math.sqrt(3);
  protected static readonly _halfSqrt3 = Math.sqrt(3) * 0.5;

  static getDrawCoord(loc: Point3D): Point2D {
    // An isometric square has:
    // - sides equal length = 1,
    // - the short diagonal is length = 1,
    // - the long diagonal is length = sqrt(3) ~= 1.73.
    // We're allowing the height to vary, so its a cuboid, not a cube, but with
    // a square top.

    // Tiles are placed overlapping each other by half.
    // If we use the scale above, it means an onscreen x,y (dx,dy) should be:
    const dx = Math.round(this._halfSqrt3 * (loc.x + loc.y));
    const dy = Math.round((0.5 * (loc.y - loc.x)) - loc.z);
    return new Point2D(dx, dy);
  }

  getDrawCoord(location: Point3D): Point2D {
    return TrueIsometric.getDrawCoord(location);
  }

  drawOrder(first: SceneNode, second: SceneNode): RenderOrder {
    // priority ordering:
    // - smaller y
    // - greater x

    if (first.overlapX(second)) {
      return first.entity.bounds.minY <= second.entity.bounds.minY ?
        RenderOrder.Before : RenderOrder.After;
    }
    if (first.overlapY(second)) {
      return first.entity.bounds.minX >= second.entity.bounds.minX ?
        RenderOrder.Before : RenderOrder.After;
    }
    if (!first.overlapZ(second)) {
      return RenderOrder.Any;
    }
    if (first.intersectsTop(second)) {
      return RenderOrder.Before;
    }
    if (second.intersectsTop(first)) {
      return RenderOrder.After;
    }
    return RenderOrder.Any;
  }
}

// https://www.significant-bits.com/a-laymans-guide-to-projection-in-videogames/
// http://www.gandraxa.com/isometric_projection.xml
// An isometric square has:
// - sides equal length = sqrt(5)
// - the short diagonal is length = 2,
// - the long diagonal is length = 4.
export class TwoByOneIsometric extends SceneGraph {
  constructor() { super(); }

  private static readonly _magicRatio: number = 
    Math.cos(Math.atan(0.5));

  private static readonly _oneOverMagicRatio: number =
    1 / Math.cos(Math.atan(0.5));

  static getDrawCoord(loc: Point3D): Point2D {
    // We're allowing the height to vary, so its a cuboid, not a cube, but with
    // a square top.

    // Tiles are placed overlapping each other by half.
    // If we use the scale above, it means an onscreen x,y (dx,dy) should be:
    const dx = Math.round((loc.x + loc.y) * 2 * this._oneOverMagicRatio);
    const dy = Math.round((loc.y - loc.x - loc.z) * this._oneOverMagicRatio);
    return new Point2D(dx, dy);
  }

  static getDimensions(spriteWidth: number,
                       spriteHeight: number): Dimensions {
    const oneUnit = spriteWidth * 0.25;
    const twoUnits = spriteWidth * 0.5;
    const width = oneUnit * this._magicRatio;
    const depth = twoUnits * Math.sin(Math.atan(0.5));
    const height = (spriteHeight - twoUnits) * this._magicRatio;
    return new Dimensions(Math.round(width),
                          Math.round(depth),
                          Math.round(height));
  }

  static drawOrder(first: SceneNode, second: SceneNode): RenderOrder {
    if (first.overlapX(second)) {
      return first.entity.bounds.minY < second.entity.bounds.minY ?
        RenderOrder.Before : RenderOrder.After;
    }
    if (first.overlapY(second)) {
      return first.entity.bounds.minX > second.entity.bounds.minX ?
        RenderOrder.Before : RenderOrder.After;
    }
    if (!first.overlapZ(second)) {
      return RenderOrder.Any;
    }
    if (first.intersectsTop(second)) {
      return RenderOrder.Before;
    }
    if (second.intersectsTop(first)) {
      return RenderOrder.After;
    }
    return RenderOrder.Any;
  }

  getDrawCoord(location: Point3D): Point2D {
    return TwoByOneIsometric.getDrawCoord(location);
  }

  drawOrder(first: SceneNode, second: SceneNode): RenderOrder {
    // priority ordering:
    // - smaller y
    // - greater x
    return TwoByOneIsometric.drawOrder(first, second);
  }
}
