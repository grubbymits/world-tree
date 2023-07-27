import { PhysicalEntity } from "./entity.ts";
import { Camera } from "./camera.ts";
import { Point2D, Point3D, Segment2D, Vector2D } from "./geometry.ts";
import { GraphicComponent, Sprite } from "./graphics.ts";
import { Dimensions } from "./physics.ts";
import { TimedEventHandler } from "./events.ts";
import { DrawElementList } from "./render.ts";

export enum RenderOrder {
  Before = -1,
  Any = 0,
  After = 1,
}

export class SceneNode {
  private _preds: Array<SceneNode> = new Array<SceneNode>();
  private _succs: Array<SceneNode> = new Array<SceneNode>();
  private _level: SceneLevel | null;
  // FIXME: Just store the six points, not six segments.
  private _topOutlineSegments: Array<Segment2D> = new Array<Segment2D>();
  private _sideOutlineSegments: Array<Segment2D> = new Array<Segment2D>();
  private _baseOutlineSegments: Array<Segment2D> = new Array<Segment2D>();
  private _drawCoord: Point2D;

  constructor(
    private readonly _entity: PhysicalEntity,
    private _minDrawCoord: Point2D
  ) {
    this.drawCoord = _minDrawCoord;
  }

  overlapX(other: SceneNode): boolean {
    return (
      (this.entity.bounds.minX >= other.entity.bounds.minX &&
        this.entity.bounds.minX < other.entity.bounds.maxX) ||
      (this.entity.bounds.maxX > other.entity.bounds.minX &&
        this.entity.bounds.maxX <= other.entity.bounds.maxX)
    );
  }

  overlapY(other: SceneNode): boolean {
    return (
      (this.entity.bounds.minY >= other.entity.bounds.minY &&
        this.entity.bounds.minY < other.entity.bounds.maxY) ||
      (this.entity.bounds.maxY > other.entity.bounds.minY &&
        this.entity.bounds.maxY <= other.entity.bounds.maxY)
    );
  }

  overlapZ(other: SceneNode): boolean {
    return (
      (this.entity.bounds.minZ >= other.entity.bounds.minZ &&
        this.entity.bounds.minZ < other.entity.bounds.maxZ) ||
      (this.entity.bounds.maxZ > other.entity.bounds.minZ &&
        this.entity.bounds.maxZ <= other.entity.bounds.maxZ)
    );
  }

  updateSegments(diff: Vector2D): void {
    this.topSegments[0] = this.topSegments[0].add(diff);
    this.topSegments[1] = this.topSegments[1].add(diff);
    this.baseSegments[0] = this.baseSegments[0].add(diff);
    this.baseSegments[1] = this.baseSegments[1].add(diff);
    this.sideSegments[0] = this.sideSegments[0].add(diff);
    this.sideSegments[1] = this.sideSegments[1].add(diff);
    this.drawCoord = this.drawCoord.add(diff);
    this.minDrawCoord = this.minDrawCoord.add(diff);
  }

  intersectsTop(other: SceneNode): boolean {
    for (const otherTop of other.topSegments) {
      if (
        this.baseSegments[0].intersects(otherTop) ||
        this.baseSegments[1].intersects(otherTop)
      ) {
        return true;
      }
      if (
        this.sideSegments[0].intersects(otherTop) ||
        this.sideSegments[1].intersects(otherTop)
      ) {
        return true;
      }
    }
    return false;
  }

  clear(): void {
    this._succs = [];
  }
  addSucc(succ: SceneNode) {
    const idx = this._succs.indexOf(succ);
    if (idx != -1) return;
    this._succs.push(succ);
  }
  removeSucc(succ: SceneNode) {
    const idx = this._succs.indexOf(succ);
    if (idx == -1) return;
    this._succs.splice(idx, 1);
  }

  get id(): number {
    return this._entity.id;
  }
  get drawCoord(): Point2D {
    return this._drawCoord;
  }
  set drawCoord(coord: Point2D) {
    this._drawCoord = coord;
  }
  get minDrawCoord(): Point2D {
    return this._minDrawCoord;
  }
  set minDrawCoord(coord: Point2D) {
    this._minDrawCoord = coord;
  }
  get topSegments(): Array<Segment2D> {
    return this._topOutlineSegments;
  }
  get baseSegments(): Array<Segment2D> {
    return this._baseOutlineSegments;
  }
  get sideSegments(): Array<Segment2D> {
    return this._sideOutlineSegments;
  }
  get entity(): PhysicalEntity {
    return this._entity;
  }
  get succs(): Array<SceneNode> {
    return this._succs;
  }
  get level(): SceneLevel | null {
    return this._level;
  }
  set level(level: SceneLevel | null) {
    this._level = level;
  }
  get minZ(): number {
    return this._entity.bounds.minZ;
  }
  get maxZ(): number {
    return this._entity.bounds.maxZ;
  }
  get isRoot(): boolean {
    return this._preds.length == 0;
  }
}

type NodeCompare = (firstId: number, secondId: number) => RenderOrder;

export class SceneLevel {
  private _nodes: Array<SceneNode> = new Array<SceneNode>();
  private _order: Array<SceneNode> = new Array<SceneNode>();
  private readonly _minZ: number;
  private readonly _maxZ: number;
  private _dirty = true;

  constructor(root: SceneNode) {
    this._minZ = root.minZ;
    this._maxZ = root.maxZ;
    this._nodes.push(root);
    root.level = this;
  }

  get nodes(): Array<SceneNode> {
    return this._nodes;
  }
  get order(): Array<SceneNode> {
    return this._order;
  }
  set order(o: Array<SceneNode>) {
    this._order = o;
  }
  get minZ(): number {
    return this._minZ;
  }
  get maxZ(): number {
    return this._maxZ;
  }
  get dirty(): boolean {
    return this._dirty;
  }
  set dirty(d: boolean) {
    this._dirty = d;
  }

  inrange(entity: PhysicalEntity): boolean {
    return entity.bounds.minZ >= this._minZ && entity.bounds.minZ < this._maxZ;
  }

  add(node: SceneNode, graph: SceneGraph): void {
    this.dirty = true;
    node.level = this;
    this._nodes.push(node);
    this.update(node, graph);
  }

  remove(node: SceneNode): void {
    this.dirty = true;
    const idx = this._nodes.indexOf(node);
    console.assert(idx != -1);
    this._nodes.splice(idx, 1);
    this._nodes.forEach((pred) => pred.removeSucc(node));
  }

  update(node: SceneNode, graph: SceneGraph): void {
    node.clear();
    for (let i = 0; i < this._nodes.length; i++) {
      const existing = this._nodes[i];
      if (existing.id == node.id) {
        continue;
      }
      const order = graph.drawOrder(node, existing);
      if (RenderOrder.Before == order) {
        node.addSucc(existing);
      } else if (RenderOrder.After == order) {
        existing.addSucc(node);
      } else {
        existing.removeSucc(node);
      }
    }
    this.dirty = true;
  }

  shouldDraw(node: SceneNode, camera: Camera): boolean {
    const entity: PhysicalEntity = node.entity;
    if (entity.visible && entity.drawable) {
      // FIXME: Is using the graphics data the right/best thing to do?
      const width = entity.graphics[0].width;
      const height = entity.graphics[0].height;
      return camera.isOnScreen(node.drawCoord, width, height);
    } else {
      return false;
    }
  }

  buildGraph(graph: SceneGraph, camera: Camera, force: boolean): void {
    // https://en.wikipedia.org/wiki/Transitive_reduction
    // In the mathematical theory of binary relations, any relation R on a set X may
    // be thought of as a directed graph that has the set X as its vertex set and
    // that has an arc xy for every ordered pair of elements that are related in R.
    // In particular, this method lets partially ordered sets be reinterpreted as
    // directed acyclic graphs, in which there is an arc xy in the graph whenever
    // there is an order relation x < y between the given pair of elements of the
    // partial order.
    if (!force && !this.dirty) {
      //console.assert(this.order.length != 0);
      return;
    }

    // Filter out the nodes that don't need drawing.
    const toDraw: Array<SceneNode> = this._nodes.filter((node) =>
      this.shouldDraw(node, camera)
    );
    toDraw.sort((a, b) => graph.drawOrder(a, b));

    this.order = [];
    const discovered = new Set<SceneNode>();

    const topoSort = (node: SceneNode): void => {
      if (discovered.has(node)) {
        return;
      }
      discovered.add(node);
      for (const succ of node.succs) {
        topoSort(succ);
      }
      this.order.push(node);
    };

    for (const i in toDraw) {
      if (discovered.has(toDraw[i])) {
        continue;
      }
      topoSort(toDraw[i]);
    }
    this.dirty = false;
  }
}

export abstract class SceneGraph {
  protected _levels: Array<SceneLevel> = new Array<SceneLevel>();
  protected _numNodes = 0;
  protected _prevCameraLower: Point2D = new Point2D(0, 0);
  protected _prevCameraUpper: Point2D = new Point2D(0, 0);

  abstract getDrawCoord(location: Point3D): Point2D;
  abstract drawOrder(first: SceneNode, second: SceneNode): RenderOrder;

  constructor() {}

  updateDrawOutline(node: SceneNode): void {
    const entity: PhysicalEntity = node.entity;
    const min: Point3D = entity.bounds.minLocation;
    const minDraw: Point2D = this.getDrawCoord(min);
    const diff: Vector2D = minDraw.diff(node.minDrawCoord);
    node.updateSegments(diff);
  }

  setDrawOutline(node: SceneNode): void {
    const entity: PhysicalEntity = node.entity;
    const min: Point3D = entity.bounds.minLocation;
    const max: Point3D = entity.bounds.maxLocation;

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

    // FIXME: Still not convinced this is right.
    //  image root: *  /*\ 'top1'
    //                /   \
    //       'top2'* /     \
    //              |\     /|
    //              | \   / |
    // minDrawCoord *  \ /  |
    //               \  |  / 
    //                \ | /  * other limit
    // 
    const drawHeightOffset = min2D.diff(top2);
    const adjustedCoord = new Point2D(min2D.x, min2D.y - drawHeightOffset.y);
    node.drawCoord = adjustedCoord;
  }

  get levels(): Array<SceneLevel> {
    return this._levels;
  }
  get initialised(): boolean {
    return this.levels.length != 0;
  }
  get numNodes(): number {
    return this._numNodes;
  }

  updateNode(node: SceneNode): void {
    if (!this.initialised) {
      return;
    }
    this.updateDrawOutline(node);
    console.assert(
      node.level != null,
      "node with id:",
      node.entity.id,
      "isn't assigned a level!"
    );
    const level: SceneLevel = node.level!;
    if (level.inrange(node.entity)) {
      level.update(node, this);
    } else {
      level.remove(node);
      this.insertIntoLevel(node);
    }
  }

  insertIntoLevel(node: SceneNode): void {
    for (const level of this.levels) {
      if (level.inrange(node.entity)) {
        level.add(node, this);
        return;
      }
    }
    this.levels.push(new SceneLevel(node));
  }

  insertNode(node: SceneNode): void {
    this.setDrawOutline(node);
    //this._numEntities++;
    if (this.initialised) {
      this.insertIntoLevel(node);
    }
  }

  initialise(nodes: Map<number, SceneNode>): void {
    const nodeList = new Array<SceneNode>();
    for (const node of nodes.values()) {
      nodeList.push(node);
      this.setDrawOutline(node);
    }
    nodeList.sort((a, b) => {
      if (a.minZ < b.minZ) {
        return RenderOrder.Before;
      }
      if (a.minZ > b.minZ) {
        return RenderOrder.After;
      }
      return RenderOrder.Any;
    });
    nodeList.forEach((node) => this.insertIntoLevel(node));
  }

  cameraHasMoved(camera: Camera): boolean {
    const lower = camera.min;
    const upper = camera.max;
    const needsRedraw =
      this._prevCameraLower.x != lower.x ||
      this._prevCameraLower.y != lower.y ||
      this._prevCameraUpper.x != upper.x ||
      this._prevCameraUpper.y != upper.y;
    this._prevCameraLower = lower;
    this._prevCameraUpper = upper;
    return needsRedraw;
  }

  buildLevels(camera: Camera, force: boolean): void {
    if (this.cameraHasMoved(camera)) {
      force = true;
    }
    this._levels.forEach((level) => level.buildGraph(this, camera, force));
  }
}

export class Scene {
  private _nodes: Map<number, SceneNode> = new Map<number, SceneNode>();
  private _numEntities = 0;
  private _handler = new TimedEventHandler();

  constructor(private _graph: SceneGraph) {}

  get graph(): SceneGraph {
    return this._graph;
  }
  get numEntities(): number {
    return this._numEntities;
  }
  get nodes(): Map<number, SceneNode> {
    return this._nodes;
  }
  get ctx(): CanvasRenderingContext2D | null {
    return null;
  }

  insertEntity(entity: PhysicalEntity): void {
    const node = new SceneNode(
      entity,
      this.graph.getDrawCoord(entity.bounds.minLocation)
    );
    this.nodes.set(node.id, node);
    // If we haven't initialised levels yet (its done in the first call to
    // render), just store the entity for then.
    // Otherwise, find the level that it belongs in, or create a new level.
    if (this.graph.initialised) {
      this.graph.insertNode(node);
    }
    this._numEntities++;
  }
  updateEntity(entity: PhysicalEntity): void {
    console.assert(this._nodes.has(entity.id));
    const node: SceneNode = this._nodes.get(entity.id)!;
    this.graph.updateNode(node);
  }
  getNode(id: number): SceneNode {
    console.assert(this.nodes.has(id));
    return this.nodes.get(id)!;
  }
  getLocationAt(x: number, y: number, camera: Camera): Point3D | null {
    const entity: PhysicalEntity | null = this.getEntityDrawnAt(x, y, camera);
    if (entity != null) {
      // FIXME: This is not a surface location.
      return entity.bounds.minLocation;
    }
    return null;
  }

  getEntityDrawnAt(
    x: number,
    y: number,
    camera: Camera
  ): PhysicalEntity | null {
    for (let i = this.graph.levels.length - 1; i >= 0; i--) {
      const level: SceneLevel = this.graph.levels[i];
      for (let j = 0; j < level.nodes.length; j++) {
        const node: SceneNode = level.nodes[j];
        const entity: PhysicalEntity = node.entity;
        if (!entity.visible || !entity.drawable) {
          continue;
        }
        if (!camera.isOnScreen(node.drawCoord, entity.width, entity.depth)) {
          continue;
        }

        const onScreenCoord: Point2D = camera.getDrawCoord(node.drawCoord);
        const graphic: GraphicComponent = entity.graphic;
        // Check whether inbounds of the sprite.
        if (
          x < onScreenCoord.x ||
          y < onScreenCoord.y ||
          x > onScreenCoord.x + graphic.width ||
          y > onScreenCoord.y + graphic.height
        ) {
          continue;
        }
        if (
          !graphic.isTransparentAt(x - onScreenCoord.x, y - onScreenCoord.y)
        ) {
          return entity;
        }
      }
    }
    return null;
  }

  addTimedEvent(callback: any): void {
    this._handler.add(callback);
  }

  numToDraw(): number {
    let num = 0;
    this.graph.levels.forEach((level) => {
      num += level.order.length;
    });
    return num;
  }

  render(camera: Camera, force: boolean): DrawElementList {
    if (!this.graph.initialised) {
      this.graph.initialise(this.nodes);
    }
    this.graph.buildLevels(camera, force);
    const elements: number = this.numToDraw();
    // - 2 bytes for each uint16
    // - 3 entries per draw element: sprite id, x, y
    // - 2 graphics per entry to hopefully avoid a resize.
    const initByteLength = elements * 2 * 3 * 2;
    let buffer = new ArrayBuffer(initByteLength);
    let drawElements = new Int16Array(buffer);
    let idx = 0;
    this.graph.levels.forEach((level) => {
      for (let i = level.order.length - 1; i >= 0; i--) {
        const node: SceneNode = level.order[i];
        const entity: PhysicalEntity = node.entity;
        const coord = camera.getDrawCoord(node.drawCoord);
        // double the size of the buffer if we're running out of space.
        if (entity.graphics.length * 3 + idx >= drawElements.length) {
          //buffer.resize(buffer.byteLength * 2);
          let new_buffer = new ArrayBuffer(buffer.byteLength * 2);
          new Int16Array(new_buffer).set(new Int16Array(buffer));
          buffer = new_buffer;
          drawElements = new Int16Array(buffer);
        }
        entity.graphics.forEach((component) => {
          const spriteId: number = component.update();
          drawElements[idx] = spriteId;
          drawElements[idx + 1] = coord.x;
          drawElements[idx + 2] = coord.y;
          idx += 3;
        });
      }
    });

    // TODO: Shrink the buffer to the necessary size.
    //if (buffer.byteLength != initByteLength) {
    //buffer.resize(idx * 2);
    //}

    this._handler.service();
    return new DrawElementList(drawElements, idx);
  }

  verifyRenderer(entities: Array<PhysicalEntity>): boolean {
    if (this.graph.numNodes != entities.length) {
      console.error(
        "top-level comparison between scene node and entities failed"
      );
    }
    let counted = 0;
    const levelNodeIds = new Array<number>();
    const nodeIds = new Array<number>();
    const entityIds = new Array<number>();

    for (const level of this.graph.levels) {
      counted += level.nodes.length;
      level.nodes.forEach((node) => levelNodeIds.push(node.id));
    }

    for (const node of this.nodes.values()) {
      nodeIds.push(node.id);
    }

    entities.forEach((entity) => entityIds.push(entity.id));

    if (
      nodeIds.length != entityIds.length ||
      nodeIds.length != levelNodeIds.length
    ) {
      console.error("number of scene nodes and entities don't match up");
      return false;
    }

    if (this.numEntities != entities.length) {
      console.error("mismatch in number of entities in context and scene");
    }

    nodeIds.sort((a, b) => {
      if (a < b) {
        return -1;
      } else {
        return 1;
      }
    });
    entityIds.sort((a, b) => {
      if (a < b) {
        return -1;
      } else {
        return 1;
      }
    });
    levelNodeIds.sort((a, b) => {
      if (a < b) {
        return -1;
      } else {
        return 1;
      }
    });

    for (let i = 0; i < nodeIds.length; ++i) {
      if (i != nodeIds[i]) {
        console.error("mismatch in expected ids:", i, nodeIds[i]);
        return false;
      }
      if (nodeIds[i] != entityIds[i]) {
        console.error("mismatch node vs entity ids:", nodeIds[i], entityIds[i]);
        return false;
      }
      if (nodeIds[i] != levelNodeIds[i]) {
        console.error(
          "mismatch top level node vs found in level ids:",
          nodeIds[i],
          levelNodeIds[i]
        );
        return false;
      }
    }

    return true;
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

  static physicalDepth(physicalWidth: number, relativeDims: Dimensions) {
    const depthRatio: number = relativeDims.depth / relativeDims.width;
    return Math.round(physicalWidth * depthRatio);
  }

  static physicalHeight(
    physicalWidth: number,
    relativeDims: Dimensions
  ): number {
    const heightRatio: number = relativeDims.height / relativeDims.width;
    return Math.round(physicalWidth * heightRatio);
  }

  constructor(spriteWidth: number, relativeDims: Dimensions) {
    const width = IsometricPhysicalDimensions.physicalWidth(spriteWidth);
    const depth = IsometricPhysicalDimensions.physicalDepth(
      width,
      relativeDims
    );
    const height = IsometricPhysicalDimensions.physicalHeight(
      width,
      relativeDims
    );
    super(width, depth, height);
  }
}

export class TrueIsometric extends SceneGraph {
  constructor() {
    super();
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
    const dx = Math.round(this._halfSqrt3 * (loc.x + loc.y));
    const dy = Math.round(0.5 * (loc.y - loc.x) - loc.z);
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
      return first.entity.bounds.minY <= second.entity.bounds.minY
        ? RenderOrder.Before
        : RenderOrder.After;
    }
    if (first.overlapY(second)) {
      return first.entity.bounds.minX >= second.entity.bounds.minX
        ? RenderOrder.Before
        : RenderOrder.After;
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
  constructor() {
    super();
  }

  private static readonly _magicRatio: number = Math.cos(Math.atan(0.5));

  private static readonly _oneOverMagicRatio: number =
    1 / Math.cos(Math.atan(0.5));

  static getDrawCoord(loc: Point3D): Point2D {
    // Tiles are placed overlapping each other by half.
    // If we use the scale above, it means an onscreen x,y (dx,dy) should be:
    const dx = Math.round((loc.x + loc.y) * 2 * this._oneOverMagicRatio);
    const dy = Math.round((loc.y - loc.x - loc.z) * this._oneOverMagicRatio);
    return new Point2D(dx, dy);
  }

  static getDimensions(spriteWidth: number, spriteHeight: number): Dimensions {
    // We're allowing the height to vary, so its a cuboid, not a cube, but with
    // a square top.
    const oneUnit = spriteWidth * 0.25;
    const twoUnits = spriteWidth * 0.5;
    const width = oneUnit * this._magicRatio;
    const depth = twoUnits * Math.sin(Math.atan(0.5));
    const height = (spriteHeight - twoUnits) * this._magicRatio;
    return new Dimensions(
      Math.round(width),
      Math.round(depth),
      Math.round(height)
    );
  }

  static drawOrder(first: SceneNode, second: SceneNode): RenderOrder {
    if (first.overlapX(second)) {
      return first.entity.bounds.minY < second.entity.bounds.minY
        ? RenderOrder.Before
        : RenderOrder.After;
    }
    if (first.overlapY(second)) {
      return first.entity.bounds.minX > second.entity.bounds.minX
        ? RenderOrder.Before
        : RenderOrder.After;
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
