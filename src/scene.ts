import { PhysicalEntity } from "./entity.ts";
import { Camera } from "./camera.ts";
import { Point2D, Point3D, Vector2D } from "./geometry.ts";
import { GraphicComponent, Sprite } from "./graphics.ts";
import { Dimensions } from "./physics.ts";
import { TimedEventHandler } from "./events.ts";
import { DrawElementList } from "./render.ts";
import { EntityBounds } from "./bounds.ts";

export enum RenderOrder {
  Before = -1,
  Any = 0,
  After = 1,
}

function inRange(n: number, lower: number, upper: number): boolean {
  return n >= lower && n <= upper;
}

export class SceneNode {
  private _succs: Array<SceneNode> = new Array<SceneNode>();

  constructor(private readonly _entity: PhysicalEntity,
              private _drawCoord: Point2D) { }
  get id(): number {
    return this._entity.id;
  }
  get drawCoord(): Point2D {
    return this._drawCoord;
  }
  set drawCoord(coord: Point2D) {
    this._drawCoord = coord;
  }
  get entity(): PhysicalEntity {
    return this._entity;
  }
  get succs(): Array<SceneNode> {
    return this._succs;
  }
  clear(): void {
    this._succs = [];
  }
  addSucc(succ: SceneNode) {
    const idx = this._succs.indexOf(succ);
    if (idx != -1) return;
    this._succs.push(succ);
  }
}

type NodeCompare = (firstId: number, secondId: number) => RenderOrder;

export abstract class SceneGraph {
  protected _nodes: Array<SceneNode> = new Array<SceneNode>();
  protected _order: Array<SceneNode> = new Array<SceneNode>();
  protected _prevCameraLower: Point2D = new Point2D(0, 0);
  protected _prevCameraUpper: Point2D = new Point2D(0, 0);
  protected _dirty = true;

  abstract getDrawCoord(location: Point3D): Point2D;
  abstract drawOrder(first: SceneNode, second: SceneNode): RenderOrder;

  constructor() {}

  update(node: SceneNode): void {
    this.dirty = true;
    const entity: PhysicalEntity = node.entity;
    node.drawCoord = this.adjustedDrawCoord(entity);
  }

  adjustedDrawCoord(entity: PhysicalEntity): Point2D {
    const min: Point3D = EntityBounds.minLocation(entity.id);
    const max: Point3D = EntityBounds.maxLocation(entity.id);
    const min2D = this.getDrawCoord(min);
    const max2D = this.getDrawCoord(max);
    const top2D = this.getDrawCoord(new Point3D(max.x, min.y, max.z));

    //  'drawCoord' *   * 'top2D'
    //                / | \
    //               /  |  \
    //              *   |   * 'max2D'
    //              |\  |  /|
    //              | \ | / |
    //              |   *   |
    //      'min2D' *   |   *
    //               \  |  /
    //                \ | /
    //                  *
    //              'bottom2D'
    const drawHeightOffset = min2D.diff(top2D);
    const adjustedCoord = new Point2D(
      min2D.x,
      min2D.y - drawHeightOffset.y
    );
    return adjustedCoord;
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
  get dirty(): boolean {
    return this._dirty;
  }
  set dirty(d: boolean) {
    this._dirty = d;
  }

  insertNode(node: SceneNode): void {
    this.nodes.push(node);
    this.update(node);
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

  shouldDraw(node: SceneNode, camera: Camera): boolean {
    const entity: PhysicalEntity = node.entity;
    if (entity.visible && entity.drawable) {
      // FIXME: Is using the graphics data the right/best thing to do?
      // Over-estimate the draw area to make up for any rounding issues.
      const width = entity.graphics[0].width + 2;
      const height = entity.graphics[0].height + 2;
      const draw = node.drawCoord.add(new Vector2D(-1, -1));
      return camera.isOnScreen(draw, width, height);
    } else {
      return false;
    }
  }

  build(camera: Camera, force: boolean): void {
    if (!force && !this.dirty && !camera.hasMoved) {
      return;
    }

    // Filter out the nodes that don't need drawing.
    const toDraw: Array<SceneNode> = this.nodes.filter((node) =>
      this.shouldDraw(node, camera)
    );

    // TODO: Perform reduction? Or find an elegant way of partitioning the graph?
    // On the actor demo where are ~70 nodes versus ~2000 edges!
    // https://en.wikipedia.org/wiki/Transitive_reduction
    // In the mathematical theory of binary relations, any relation R on a set X may
    // be thought of as a directed graph that has the set X as its vertex set and
    // that has an arc xy for every ordered pair of elements that are related in R.
    // In particular, this method lets partially ordered sets be reinterpreted as
    // directed acyclic graphs, in which there is an arc xy in the graph whenever
    // there is an order relation x < y between the given pair of elements of the
    // partial order.
    toDraw.forEach((node) => node.clear());

    for (let i = 0; i < toDraw.length; i++) {
      const nodeI = toDraw[i];
      for (let j = i + 1; j < toDraw.length; ++j) {
        const nodeJ = toDraw[j];
        const order = this.drawOrder(nodeI, nodeJ);
        if (RenderOrder.Before == order) {
          nodeI.addSucc(nodeJ);
        } else if (RenderOrder.After == order) {
          nodeJ.addSucc(nodeI);
        }
      }
    }

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
      topoSort(toDraw[i]);
    }
    this.dirty = false;
    camera.hasMoved = false;
  }
}

export class Scene {
  private _nodes: Map<number, SceneNode> = new Map<number, SceneNode>();
  private _handler = new TimedEventHandler();

  constructor(private _graph: SceneGraph) {}

  get graph(): SceneGraph {
    return this._graph;
  }
  get nodes(): Map<number, SceneNode> {
    return this._nodes;
  }

  insertEntity(entity: PhysicalEntity): void {
    const node = new SceneNode(entity, this.graph.adjustedDrawCoord(entity));
    this.nodes.set(node.id, node);
    this.graph.insertNode(node);
  }
  updateEntity(entity: PhysicalEntity): void {
    console.assert(this._nodes.has(entity.id));
    const node: SceneNode = this._nodes.get(entity.id)!;
    this.graph.update(node);
  }
  getNode(id: number): SceneNode {
    console.assert(this.nodes.has(id));
    return this.nodes.get(id)!;
  }
  getLocationAt(x: number, y: number, camera: Camera): Point3D | null {
    const entity: PhysicalEntity | null = this.getEntityDrawnAt(x, y, camera);
    if (entity != null) {
      return EntityBounds.centre(entity.id);
    }
    return null;
  }

  getEntityDrawnAt(
    x: number,
    y: number,
    camera: Camera
  ): PhysicalEntity | null {
    for (let i = 0; i < this.graph.order.length; ++i) {
      const node: SceneNode = this.graph.order[i];
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
      if (!graphic.isTransparentAt(x - onScreenCoord.x, y - onScreenCoord.y)) {
        return entity;
      }
    }
    return null;
  }

  addTimedEvent(callback: any): void {
    this._handler.add(callback);
  }

  render(camera: Camera, force: boolean): DrawElementList {
    this.graph.build(camera, force);
    const elements: number = this.graph.order.length;
    // - 2 bytes for each uint16
    // - 3 entries per draw element: sprite id, x, y
    // - 2 graphics per entry to hopefully avoid a resize.
    const initByteLength = elements * 2 * 3 * 2;
    let buffer = new ArrayBuffer(initByteLength);
    let drawElements = new Int16Array(buffer);
    let idx = 0;
    for (let i = this.graph.order.length - 1; i >= 0; i--) {
      const node: SceneNode = this.graph.order[i];
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

    // TODO: Shrink the buffer to the necessary size.
    //if (buffer.byteLength != initByteLength) {
    //buffer.resize(idx * 2);
    //}

    this._handler.service();
    return new DrawElementList(drawElements, idx);
  }

  verifyRenderer(entities: Array<PhysicalEntity>): boolean {
    if (this.nodes.size != entities.length) {
      console.error(
        "scene-level comparison between scene node and entities failed"
      );
    }
    if (this.graph.nodes.length != entities.length) {
      console.error(
        "graph-level comparison between scene node and entities failed"
      );
    }
    let counted = 0;
    const levelNodeIds = new Array<number>();
    const nodeIds = new Array<number>();
    const entityIds = new Array<number>();

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

  // atan(0.5) = 26.565
  // cos(26.565) = 0.8944
  // 1 / magicRatio = 1.118
  private static readonly _magicRatio: number = Math.cos(Math.atan(0.5));

  private static readonly _oneOverMagicRatio: number =
    1 / Math.cos(Math.atan(0.5));

  static getDrawCoord(loc: Point3D): Point2D {
    // Tiles are placed overlapping each other by half.
    // If we use the scale above, it means an onscreen x,y (dx,dy) should be:
    const dx = Math.floor((loc.x + loc.y) * 2 * this._oneOverMagicRatio);
    const dy = Math.floor((loc.y - loc.x - loc.z) * this._oneOverMagicRatio);
    return new Point2D(dx, dy);
  }

  static getDimensions(spriteWidth: number, spriteHeight: number): Dimensions {
    // We're allowing the height to vary, so its a cuboid, not a cube, but with
    // a square top.
    // one unit width ratio = 0.25 * magicRatio ~= 0.2236
    // two unit ratio = 0.5 * magicRatio ~= 0.4472
    // graphic width  |  physical width   |   graphic height  | physical height
    //      161       |     36.0007       |       161         |   72.001
    //      161       |     36.0007       |       123         |   38.013
    //      322       |     72.001        |       246         |   76.026
    //      322       |     72.001        |       322         |   144.0028
    const oneUnit = spriteWidth * 0.25;
    const twoUnits = spriteWidth * 0.5;
    const width = oneUnit * this._magicRatio;
    const depth = width; //twoUnits * Math.sin(Math.atan(0.5));
    const height = (spriteHeight - twoUnits) * this._magicRatio;
    return new Dimensions(
      Math.floor(width),
      Math.floor(depth),
      Math.floor(height)
    );
  }

  static drawOrder(first: SceneNode, second: SceneNode): RenderOrder {
    // https://shaunlebron.github.io/IsometricBlocks/
    // draw coords
    // (0, 0) ______________ x
    //      |
    //      |
    //      |
    //      |
    //      |
    //      |
    //      |
    //      y

    // world coords
    //    z      x
    //    |    /
    //    |   /
    //    |  /
    //    | /
    // (0, 0, 0)
    //     \
    //      \
    //       \
    //        \
    //         y

    // Draw nodes further from the camera first:
    // - smaller world z.
    // - smaller world y.
    // - larger world x.
    const ida = first.entity.id;
    const idb = second.entity.id;
    if (EntityBounds.axisOverlapZ(ida, idb))  {
      // For ramps, draw the lower entity first.
      if (EntityBounds.axisOverlapX(ida, idb) &&
          EntityBounds.axisOverlapY(ida, idb)) {
        if (EntityBounds.minZ(ida) < EntityBounds.minZ(idb)) {
          return RenderOrder.Before;
        }
        return RenderOrder.After;
      }
      // Draw smaller Y first.
      if (EntityBounds.maxY(ida) < EntityBounds.minY(idb)) {
        return RenderOrder.Before;
      }
      if (EntityBounds.maxY(idb) < EntityBounds.minY(ida)) {
        return RenderOrder.After;
      }
      // Draw larger X first
      if (EntityBounds.minX(ida) > EntityBounds.maxX(idb)) {
        return RenderOrder.Before;
      }
      if (EntityBounds.minX(idb) > EntityBounds.maxX(ida)) {
        return RenderOrder.After;
      }
    } else if (EntityBounds.axisOverlapX(ida, idb) &&
               EntityBounds.axisOverlapY(ida, idb)) {
      // Draw smaller Z first.
      if (EntityBounds.maxZ(ida) < EntityBounds.minZ(idb)) {
        return RenderOrder.Before;
      }
      if (EntityBounds.maxZ(idb) < EntityBounds.minZ(ida)) {
        return RenderOrder.After;
      }
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

export function getDimensionsFromPerspective(spriteWidth: number,
                                             spriteHeight: number,
                                             perspective: Perspective): Dimensions {
  switch (perspective) {
    default:
      throw new Error('unsupported perspective');
      break;
    case Perspective.TwoByOneIsometric:
      return TwoByOneIsometric.getDimensions(spriteWidth, spriteHeight);
  }
}

export function getPerspectiveFromString(name: string): Perspective {
  switch (name) {
    default:
      throw new Error('unsupported perspective name');
      break;
    case 'TrueIsometric':
      return Perspective.TrueIsometric;
    case 'TwoByOneIsometric':
      return Perspective.TwoByOneIsometric;
  }
}

