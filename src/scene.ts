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
    for (let i = 0; i < toDraw.length; ++i) {
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
  TwoByOneIsometric,
}

// https://www.significant-bits.com/a-laymans-guide-to-projection-in-videogames/
// http://www.gandraxa.com/isometric_projection.xml
// An isometric square has:
// - sides equal length = sqrt(5)
// - the short diagonal is length = 2,
// - the long diagonal is length = 4.
export class TwoByOneIsometric extends SceneGraph {
  constructor(private readonly _spriteWidth: number,
              private readonly _spriteHeight: number) {
    super();
  }

  get spriteWidth(): number { return this._spriteWidth; }
  get spriteHeight(): number { return this._spriteHeight; }

  // atan(0.5) = 26.565
  // cos(26.565) = 0.8944
  // 1 / magicRatio = 1.118
  private static readonly _magicRatio: number = Math.cos(Math.atan(0.5));

  private static readonly _oneOverMagicRatio: number =
    1 / Math.cos(Math.atan(0.5));

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
    const cubeHeight = (spriteWidth - twoUnits) * this._magicRatio;
    const width = oneUnit * this._magicRatio;
    const depth = width;
    const height = cubeHeight;
    console.assert(width >= 0, 'width < 0');
    console.assert(depth >= 0, 'depth < 0');
    console.assert(height >= 0, 'height < 0');
    return new Dimensions(width, depth, height
      //Math.floor(width),
      //Math.floor(depth),
      //Math.floor(height)
    );
  }

  getDrawCoord(loc: Point3D): Point2D {
    // Tiles are placed overlapping each other by half.
    // If we use the scale above, it means an onscreen x,y (dx,dy) should be:
    let dx = ((loc.x + loc.y) * 2 * TwoByOneIsometric._oneOverMagicRatio);
    let dy = ((loc.y - loc.x - loc.z) * TwoByOneIsometric._oneOverMagicRatio);

    // Attempt snapping.
    // Tiles are placed at each half width, on the x-axis and width/4 on the
    // y-axis. Add or subtract a pixel if it will result in the coordinate
    // being aligned to those values.
    const halfWidth = this.spriteWidth >> 1;
    const modX = dx % this.spriteWidth;
    const modY = dy % this.spriteHeight;
    if (modX == 1 || modX == halfWidth + 1) {
      dx -= 1;
    } else if (modX == this.spriteWidth - 1 || modX == halfWidth - 1) {
      dx += 1;
    }

    const quarterWidth = this.spriteWidth >> 2;
    if (modY == 1 || modY == quarterWidth + 1) {
      dy -= 1;
    } else if (modY == this.spriteHeight - 1 || modY == quarterWidth - 1) {
      dy += 1;
    }
    return new Point2D(dx, dy);
  }

  drawOrder(first: SceneNode, second: SceneNode): RenderOrder {
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

    // First, check whether the sprites could overlap each other.
    const distanceX = Math.abs(first.drawCoord.x - second.drawCoord.x);
    const distanceY = Math.abs(first.drawCoord.y - second.drawCoord.y);
    const widest = Math.max(
      first.entity.graphics[0].width,
      second.entity.graphics[0].width
    );
    const tallest = Math.max(
      first.entity.graphics[0].height,
      second.entity.graphics[0].height
    );
    if (distanceX > widest && distanceY > tallest) {
      return RenderOrder.Any;
    }

    const ida = first.entity.id;
    const idb = second.entity.id;
    const overlapZ = EntityBounds.axisOverlapZ(ida, idb);

    // Draw nodes further from the camera first:
    // - smaller world z.
    // - smaller world y.
    // - larger world x.
    if (overlapZ) {
      // Given a grid on the same z-plane:
      // A B C
      // E F G
      // H I J
      //
      // The scene needs to be drawn like the following, although the order of
      // each row doesn't matter:
      //   C
      //  B G
      // A F J
      //  E I
      //   H
      //
      // We also want to reduce the number of edges created in the graph, so
      // even though two entities may overlap on the x- or y-axis, they may
      // be too far away to require ordering. We choose this distance based
      // upon the larger of the two entities.
      const minXA = EntityBounds.minX(ida);
      const maxXA = EntityBounds.maxX(ida);
      const minYA = EntityBounds.minY(ida);
      const maxYA = EntityBounds.maxY(ida);
      const minXB = EntityBounds.minX(idb);
      const minYB = EntityBounds.minY(idb);
      const maxXB = EntityBounds.maxX(idb);
      const maxYB = EntityBounds.maxY(idb);

      const maxWidth = Math.max(EntityBounds.width(ida), EntityBounds.width(idb));
      const distanceX = Math.min(
        Math.abs(minXA - maxXB),
        Math.abs(maxXA - minXB)
      );
      if (distanceX <= maxWidth) {
        // Draw smaller Y first.
        if (maxYA < minYB) {
          return RenderOrder.Before;
        }
        if (maxYB < minYA) {
          return RenderOrder.After;
        }
      }    
      const maxDepth = Math.max(EntityBounds.depth(ida), EntityBounds.depth(idb));
      const distanceY = Math.min(
        Math.abs(minYA - maxYB),
        Math.abs(maxYA - minYB)
      );
      if (distanceY <= maxDepth) {
        // Draw larger X first
        if (minXA > maxXB) {
          return RenderOrder.Before;
        }
        if (minXB > maxXA) {
          return RenderOrder.After;
        }
      } 

      const overlapX = EntityBounds.axisOverlapX(ida, idb);
      const overlapY = EntityBounds.axisOverlapY(ida, idb);
      // For ramps, draw the lower entity first.
      if (overlapX && overlapY) {
        const minZA = EntityBounds.minZ(ida);
        const minZB = EntityBounds.minZ(idb);
        if (minZA < minZB) {
          return RenderOrder.Before;
        }
        return RenderOrder.After;
      }
    } else if (EntityBounds.axisOverlapX(ida, idb) &&
               EntityBounds.axisOverlapY(ida, idb)) {
      const minZA = EntityBounds.minZ(ida);
      const maxZA = EntityBounds.maxZ(ida);
      const minZB = EntityBounds.minZ(idb);
      const maxZB = EntityBounds.maxZ(idb);
      const maxHeight = Math.max(EntityBounds.height(ida), EntityBounds.height(idb));
      const distanceZ = Math.min(
        Math.abs(minZA - maxZB),
        Math.abs(maxZA - minZB)
      );
      if (distanceZ <= maxHeight) {
        // Draw smaller Z first.
        if (maxZA < minZB) {
          return RenderOrder.Before;
        }
        if (maxZB < minZA) {
          return RenderOrder.After;
        }
      }
    }
    return RenderOrder.Any;
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
    case 'TwoByOneIsometric':
      return Perspective.TwoByOneIsometric;
  }
}

