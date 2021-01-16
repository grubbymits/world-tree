import { Entity } from "./entity.js"
import { Camera } from "./camera.js"
import { Point2D,
         Point3D,
         Segment2D } from "./geometry.js"
import { Sprite,
         GraphicComponent } from "./graphics.js"
import { Dimensions } from "./physics.js"

enum RenderOrder {
  Before = -1,
  Any = 0,
  After = 1,
}

class SceneNode {
  private _preds : Array<number> = new Array<number>();
  private _succs : Array<number> = new Array<number>();
  private _level : SceneLevel|null;
  private _topOutlineSegments: Array<Segment2D> = new Array<Segment2D>();
  private _sideOutlineSegments: Array<Segment2D> = new Array<Segment2D>();
  private _baseOutlineSegments: Array<Segment2D> = new Array<Segment2D>();
  private _drawCoord: Point2D = new Point2D(0, 0);

  private static _graph: SceneGraph;
  static set graph(g: SceneGraph) { this._graph = g; }
  static get graph(): SceneGraph { return this._graph; }

  constructor(private readonly _entity: Entity) {
    SceneNode.graph.setDrawCoords(this);
  }

  overlapX(other: SceneNode): boolean {
    return (this.entity.bounds.minX >= other.entity.bounds.minX &&
            this.entity.bounds.minX <= other.entity.bounds.maxX) ||
           (this.entity.bounds.maxX >= other.entity.bounds.minX &&
            this.entity.bounds.maxX <= other.entity.bounds.maxX);
  }

  overlapY(other: SceneNode): boolean {
    return (this.entity.bounds.minY >= other.entity.bounds.minY &&
            this.entity.bounds.minY <= other.entity.bounds.maxY) ||
           (this.entity.bounds.maxY >= other.entity.bounds.minY &&
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

  addPred(predId: number) {
    let idx = this._preds.indexOf(predId);
    if (idx != -1) return;
    this._preds.push(predId);
  }
  addSucc(succId: number) {
    let idx = this._succs.indexOf(succId);
    if (idx != -1) return;
    this._succs.push(succId);
  }
  removePred(predId: number) {
    let idx = this._preds.indexOf(predId);
    if (idx == -1) return;
    this._preds.splice(idx, 1);
  }
  removeSucc(succId: number) {
    let idx = this._succs.indexOf(succId);
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
  get entity(): Entity { return this._entity; }
  get preds(): Array<number> { return this._preds; }
  get succs(): Array<number> { return this._succs; }
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
  private _roots: Array<number> = new Array<number>();
  private _discovered: Set<number> = new Set<number>();
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
  get roots(): Array<number> { return this._roots; }
  get order(): Array<SceneNode> { return this._topologicalOrder; }

  inrange(entity: Entity): boolean {
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

    idx = this._roots.indexOf(node.id);
    if (idx != -1) {
      this._roots.splice(idx, 1);
    }
  }

  update(node: SceneNode, graph: SceneGraph): void {

    node.preds.forEach((predId) => {
      if (graph.drawOrder(predId, node.id) != RenderOrder.Before) {
        graph.nodes.get(predId)!.removeSucc(node.id);
        node.removePred(predId);
      }
    });

    node.succs.forEach((succId) => {
      if (graph.drawOrder(succId, node.id) != RenderOrder.After) {
        node.removeSucc(succId);
        graph.nodes.get(succId)!.removePred(node.id);
      }
    });

    for (let i = 0; i < this._nodes.length; i++) {
      let existing = this._nodes[i];
      if (existing.id == node.id) {
        continue;
      }
      const order = graph.drawOrder(node.id, existing.id);
      if (RenderOrder.Before == order) {
        node.addSucc(existing.id);
        existing.addPred(node.id);
      } else if (RenderOrder.After == order) {
        existing.addSucc(node.id);
        node.addPred(existing.id);
      }
    }

    if (node.isRoot && this._roots.indexOf(node.id) == -1) {
      this._roots.push(node.id);
      //console.log("num roots:", this._roots.length);
    }
    this._discovered.clear();
    this._topologicalOrder.length = 0;
    for (let i in this._roots) {
      if (this._discovered.has(this._roots[i])) {
        continue;
      }
      this.topologicalSort(graph, graph.getNode(this._roots[i]));
    }
  }

  buildGraph(graph: SceneGraph): void {
    console.log("buildGraph of size:", this._nodes.length);

    // TODO: Should be able to form a transistive reduction using ordered
    // pairs...
    // this._nodes.sort((a, b) => graph.drawOrder(a.id, b.id));
    // transistive closure
    for (let i = 0; i < this._nodes.length; i++) {
      let nodeI = this._nodes[i];
      for (let j = 0; j < this._nodes.length; j++) {
        if (i == j) continue;
        let nodeJ = this._nodes[j];
        const order = graph.drawOrder(nodeI.id, nodeJ.id);
        if (RenderOrder.Before == order) {
          nodeI.addSucc(nodeJ.id);
          nodeJ.addPred(nodeI.id);
        } else if (RenderOrder.After == order) {
          nodeJ.addSucc(nodeI.id);
          nodeI.addPred(nodeJ.id);
        }
      }
    }

    for (let i in this._nodes) {
      const node = this._nodes[i];
      if (node.preds.length == 0) {
        this._roots.push(node.id);
        //console.log("root id:", node.id);
      }
    }

    //console.log("num scene roots:", this._roots.length);
    this._discovered.clear();
    this._topologicalOrder.length = 0;
    for (let i in this._roots) {
      if (this._discovered.has(this._roots[i])) {
        continue;
      }
      this.topologicalSort(graph, graph.getNode(this._roots[i]));
    }
    //for (let i = this.order.length - 1; i >= 0; i--) {
      //console.log("-", this.order[i].id);
    //}
  }

  topologicalSort(graph: SceneGraph, node: SceneNode): void {
    this._discovered.add(node.id);
    for (let succId of node.succs) {
      if (this._discovered.has(succId))
        continue;
      this.topologicalSort(graph, graph.getNode(succId));
    }
    this._topologicalOrder.push(node);
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
    SceneNode.graph = this;
  }

  abstract getDrawCoord(location: Point3D): Point2D;
  abstract drawOrder(firstId: number, secondId: number): RenderOrder;

  setDrawCoords(node: SceneNode): void {
    const entity: Entity = node.entity;
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

  get nodes(): Map<number, SceneNode> { return this._nodes; }

  getNode(id: number): SceneNode {
    console.assert(this._nodes.has(id));
    return this._nodes.get(id)!;
  }

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
                      if (a.minZ < b.minZ)
                        return RenderOrder.Before;
                      if (a.minZ > b.minZ)
                        return RenderOrder.After;
                      return RenderOrder.Any;
                    });
      nodeList.forEach((node) => this.insertIntoLevel(node));
      this._levels.forEach((level) => level.buildGraph(this));
    }

    const renderNode = function(node: SceneNode) {
      const entity: Entity = node.entity;
      if (!entity.visible) {
        return;
      }
      const width = entity.graphics[0].width;
      const height = entity.graphics[0].height; 
      if (camera.isOnScreen(node.drawCoord, width, height)) {
        const coord = camera.getDrawCoord(node.drawCoord);
        entity.graphics.forEach((component) => {
          const spriteId: number = component.update();
          Sprite.sprites[spriteId].draw(coord, ctx);
        });
        if (entity.drawGeometry) {
          ctx.strokeStyle = "Orange";
          for (const segment of node.allSegments) {
            ctx.beginPath();
            let drawP0 = camera.getDrawCoord(segment.p0);
            let drawP1 = camera.getDrawCoord(segment.p1);
            ctx.moveTo(drawP0.x, drawP0.y);
            ctx.lineTo(drawP1.x, drawP1.y);
            ctx.stroke();
          }
        }
      }
    };

    let ctx = this._ctx;
    ctx.clearRect(0, 0, this._width, this._height);
    this._levels.forEach((level) => {
      for (let i = level.order.length - 1; i >= 0; i--) {
        const node: SceneNode = level.order[i];
        renderNode(node);
      }
    });
  }

  insertEntity(entity: Entity): void {
    let node = new SceneNode(entity);
    this._nodes.set(node.id, node);

    // If we haven't initialised levels yet (its done in the first call to
    // render), just store the entity for then.
    // Otherwise, find the level that it belongs in, or create a new level.
    if (this._levels.length != 0) {
      this.insertIntoLevel(node);
    }
  }

  updateEntity(entity: Entity): void {
    console.assert(this._nodes.has(entity.id));
    let node: SceneNode = this._nodes.get(entity.id)!;
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
            !camera.isOnScreen(node.drawCoord, entity.width, entity.depth)) {
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
    return Math.floor(spriteWidth * this._oneOverSqrt3);
  }

  static physicalDepth(physicalWidth: number,
                       relativeDims: Dimensions) {
    let depthRatio: number = relativeDims.depth / relativeDims.width;
    return Math.floor(physicalWidth * depthRatio);
  }

  static physicalHeight(physicalWidth: number,
                        relativeDims: Dimensions): number {
    let heightRatio: number = relativeDims.height / relativeDims.width;
    return Math.floor(physicalWidth * heightRatio);
  }

  constructor(spriteWidth: number,
              relativeDims: Dimensions) {
    let width = IsometricPhysicalDimensions.physicalWidth(spriteWidth);
    let depth = IsometricPhysicalDimensions.physicalDepth(width, relativeDims);
    let height = IsometricPhysicalDimensions.physicalHeight(width, relativeDims);
    super(width, depth, height);
  }
}

export class IsometricRenderer extends SceneGraph {
  constructor(canvas: HTMLCanvasElement) {
    super(canvas);
  }

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
    const dx = Math.floor(this._halfSqrt3 * (loc.x + loc.y));
    const dy = Math.floor((0.5 * (loc.y - loc.x)) - loc.z);
    return new Point2D(dx, dy);
  }

  getDrawCoord(location: Point3D): Point2D {
    console.error('wtf');
    return IsometricRenderer.getDrawCoord(location);
  }

  drawOrder(firstId: number, secondId: number): RenderOrder {
    const first: SceneNode = this._nodes.get(firstId)!;
    const second: SceneNode = this._nodes.get(secondId)!;
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
export class TwoByOneIsometricRenderer extends SceneGraph {
  constructor(canvas: HTMLCanvasElement) {
    super(canvas);
  }

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
    return new Dimensions(width, depth, height);
  }

  getDrawCoord(location: Point3D): Point2D {
    return TwoByOneIsometricRenderer.getDrawCoord(location);
  }

  drawOrder(firstId: number, secondId: number): RenderOrder {
    const first: SceneNode = this._nodes.get(firstId)!;
    const second: SceneNode = this._nodes.get(secondId)!;
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
