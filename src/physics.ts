import { MovableEntity, PhysicalEntity } from "./entity.ts";
import { Geometry, IntersectInfo, Point3D, Vector3D } from "./geometry.ts";
import { EntityEvent } from "./events.ts";
import { ContextImpl } from "./context.ts";
import { EntityBounds } from "./bounds.ts";

export class Dimensions {
  constructor(
    protected readonly _width: number,
    protected readonly _depth: number,
    protected readonly _height: number
  ) {}

  get width(): number {
    return this._width;
  }
  get depth(): number {
    return this._depth;
  }
  get height(): number {
    return this._height;
  }
  log(): void {
    console.log(" - (WxDxH):", this.width, this.depth, this.height);
  }
}

export class BoundingCuboid {
  private _minLocation: Point3D;
  private _maxLocation: Point3D;

  constructor(centre: Point3D, private _dimensions: Dimensions) {
    const width = this.width * 0.5;
    const depth = this.depth * 0.5;
    const height = this.height * 0.5;

    let x = centre.x - width;
    let y = centre.y - depth;
    let z = centre.z - height;
    this._minLocation = new Point3D(x, y, z);

    x = centre.x + width;
    y = centre.y + depth;
    z = centre.z + height;
    this._maxLocation = new Point3D(x, y, z);
  }

  get minLocation(): Point3D {
    return this._minLocation;
  }
  get maxLocation(): Point3D {
    return this._maxLocation;
  }
  get width(): number {
    return this._dimensions.width;
  }
  get depth(): number {
    return this._dimensions.depth;
  }
  get height(): number {
    return this._dimensions.height;
  }
  get centre(): Point3D {
    return new Point3D(
      this.minLocation.x + this.dimensions.width * 0.5,
      this.minLocation.y + this.dimensions.depth * 0.5,
      this.minLocation.z + this.dimensions.height * 0.5
    );
  }
  get dimensions(): Dimensions {
    return this._dimensions;
  }

  contains(location: Point3D): boolean {
    if (
      location.x < this._minLocation.x ||
      location.y < this._minLocation.y ||
      location.z < this._minLocation.z
    ) {
      return false;
    }

    if (
      location.x > this._maxLocation.x ||
      location.y > this._maxLocation.y ||
      location.z > this._maxLocation.z
    ) {
      return false;
    }

    return true;
  }

  containsBounds(other: BoundingCuboid) {
    return this.contains(other.minLocation) && this.contains(other.maxLocation);
  }

  intersects(other: BoundingCuboid): boolean {
    if (
      other.minLocation.x > this.maxLocation.x ||
      other.maxLocation.x < this.minLocation.x
    ) {
      return false;
    }

    if (
      other.minLocation.y > this.maxLocation.y ||
      other.maxLocation.y < this.minLocation.y
    ) {
      return false;
    }

    if (
      other.minLocation.z > this.maxLocation.z ||
      other.maxLocation.z < this.minLocation.z
    ) {
      return false;
    }

    return true;
  }

  insert(other: BoundingCuboid) {
    if (this.containsBounds(other)) {
      return; // nothing to do.
    }

    const minX =
      other.minLocation.x < this.minLocation.x
        ? other.minLocation.x
        : this.minLocation.x;
    const minY =
      other.minLocation.y < this.minLocation.y
        ? other.minLocation.y
        : this.minLocation.y;
    const minZ =
      other.minLocation.z < this.minLocation.z
        ? other.minLocation.z
        : this.minLocation.z;
    const maxX =
      other.maxLocation.x > this.maxLocation.x
        ? other.maxLocation.x
        : this.maxLocation.x;
    const maxY =
      other.maxLocation.y > this.maxLocation.y
        ? other.maxLocation.y
        : this.maxLocation.y;
    const maxZ =
      other.maxLocation.z > this.maxLocation.z
        ? other.maxLocation.z
        : this.maxLocation.z;

    //console.assert(minX >= 0 && minY >= 0 && minZ >= 0);
    this._dimensions = new Dimensions(maxX - minX, maxY - minY, maxZ - minZ);
    this._minLocation = new Point3D(minX, minY, minZ);
    this._maxLocation = new Point3D(maxX, maxY, maxZ);
  }

  dump(): void {
    console.log("BoundingCuboid");
    console.log(
      " - min (x,y,z):",
      this.minLocation.x,
      this.minLocation.y,
      this.minLocation.z
    );
    console.log(
      " - max (x,y,z):",
      this.maxLocation.x,
      this.maxLocation.y,
      this.maxLocation.z
    );
    console.log(" - dimensions (WxDxH):", this.width, this.depth, this.height);
  }
}

export class CollisionInfo {
  constructor(
    private readonly _collidedEntity: PhysicalEntity,
    private readonly _blocking: boolean,
    private readonly _intersectInfo: IntersectInfo | null
  ) {}
  get entity(): PhysicalEntity {
    return this._collidedEntity;
  }
  get blocking(): boolean {
    return this._blocking;
  }
  get intersectInfo(): IntersectInfo | null {
    return this._intersectInfo;
  }
}

export class CollisionDetector {
  private static _collisionInfo: Map<MovableEntity, CollisionInfo>;
  private static _missInfo: Map<MovableEntity, Array<PhysicalEntity>>;
  private static _spatialInfo: Octree;

  static init(spatialInfo: Octree): void {
    this._spatialInfo = spatialInfo;
    this._collisionInfo = new Map();
    this._missInfo = new Map();
  }

  static hasCollideInfo(movable: MovableEntity): boolean {
    return this._collisionInfo.has(movable);
  }

  static getCollideInfo(movable: MovableEntity): CollisionInfo {
    console.assert(this.hasCollideInfo(movable));
    return this._collisionInfo.get(movable)!;
  }

  static removeInfo(movable: MovableEntity): void {
    this._collisionInfo.delete(movable);
  }

  static removeMissInfo(movable: MovableEntity): void {
    this._missInfo.delete(movable);
  }

  static addMissInfo(
    actor: MovableEntity,
    entities: Array<PhysicalEntity>
  ): void {
    this._missInfo.set(actor, entities);
  }

  static hasMissInfo(movable: MovableEntity): boolean {
    return this._missInfo.has(movable);
  }

  static getMissInfo(movable: MovableEntity): Array<PhysicalEntity> {
    console.assert(this.hasMissInfo(movable));
    return this._missInfo.get(movable)!;
  }

  static detectInArea(
    movable: MovableEntity,
    path: Vector3D
  ): CollisionInfo | null {
    const dims = EntityBounds.dimensions(movable.id)
    const widthVec3D = new Vector3D(dims.width, 0, 0);
    const depthVec3D = new Vector3D(0, dims.depth, 0);
    const heightVec3D = new Vector3D(0, 0, dims.height);

    const area = new BoundingCuboid(
      EntityBounds.centre(movable.id),
      dims
    );
    const newBounds = new BoundingCuboid(
      EntityBounds.centre(movable.id).add(path),
      dims
    );
    area.insert(newBounds);
    const minLocation = EntityBounds.minLocation(movable.id);
    const maxLocation = EntityBounds.maxLocation(movable.id);
    const beginPoints: Array<Point3D> = [
      minLocation,
      minLocation.add(heightVec3D),
      minLocation.add(depthVec3D),
      minLocation.add(widthVec3D),
      maxLocation.sub(heightVec3D),
      maxLocation.sub(depthVec3D),
      maxLocation.sub(widthVec3D),
      maxLocation,
    ];

    const misses: Array<PhysicalEntity> = new Array<PhysicalEntity>();
    const entities: Array<PhysicalEntity> = this._spatialInfo.getEntities(area);

    for (const entity of entities) {
      if (entity.id == movable.id) {
        continue;
      }

      // If the bounds do not intersect, they can't be colliding.
      if (!EntityBounds.intersectsBounds(
        entity.id,
        newBounds.minLocation,
        newBounds.maxLocation
      )) {
        continue;
      }

      // If both geometries are cuboids, the face the bounds intersect is
      // enough to detect the collision.
      if (entity.geometry.cuboid && movable.geometry.cuboid) {
        // FIXME: Not all entities should block.
        const blocking = true;
        const collision = new CollisionInfo(entity, blocking, null);
        this._collisionInfo.set(movable, collision);
        movable.postEvent(EntityEvent.Collision);
        return collision;
      }

      const geometry: Geometry = entity.geometry;
      for (const beginPoint of beginPoints) {
        const endPoint = beginPoint.add(path);

        const intersectInfo = geometry.obstructsRay(beginPoint, endPoint);
        if (intersectInfo != null) {
          // FIXME: Not all entities should block.
          const blocking = true;
          const collision = new CollisionInfo(entity, blocking, intersectInfo);
          this._collisionInfo.set(movable, collision);
          movable.postEvent(EntityEvent.Collision);
          return collision;
        } else {
          misses.push(entity);
          movable.postEvent(EntityEvent.NoCollision);
        }
      }
    }
    this.addMissInfo(movable, misses);
    return null;
  }
}

export class Gravity {
  private static readonly _terminal = 10;
  private static _enabled = false;
  private static _context: ContextImpl;
  private static _movableSpeeds: Map<number, number>;

  static init(context: ContextImpl) {
    this._context = context;
    this._enabled = true;
    this._movableSpeeds = new Map<number, number>();
  }

  static update(entities: Array<MovableEntity>): void {
    if (!this._enabled) {
      return;
    }

    // TODO: Remove entity from map when removed from context.
    entities.forEach((movable) => {
      if (movable.gravitySpeed != 0) {
        if (!this._movableSpeeds.has(movable.id)) {
          this._movableSpeeds.set(movable.id, 0);
        }
        let speed = this._movableSpeeds.get(movable.id)! + movable.gravitySpeed;
        if (speed > this._terminal) {
          speed = this._terminal;
        }
        const path = new Vector3D(0, 0, -speed);
        const bounds = new BoundingCuboid(
          EntityBounds.centre(movable.id),
          EntityBounds.dimensions(movable.id)
        );
        const collision = CollisionDetector.detectInArea(movable, path);
        if (collision == null) {
          movable.updatePosition(path);
        }
        this._movableSpeeds.set(movable.id, speed);
      }
    });
  }
}

// TODO Templates/Generics..?

class OctNode {
  // 3x3x3 rounded up to a nice number.
  static readonly MaxEntities = 30;

  private _children: Array<OctNode> = new Array<OctNode>();
  private _entities: Array<PhysicalEntity> = new Array<PhysicalEntity>();

  get children(): Array<OctNode> {
    return this._children;
  }
  get entities(): Array<PhysicalEntity> {
    return this._entities;
  }
  get bounds(): BoundingCuboid {
    return this._bounds;
  }
  get centre(): Point3D {
    return this._bounds.centre;
  }
  get width(): number {
    return this._bounds.width;
  }
  get height(): number {
    return this._bounds.height;
  }
  get depth(): number {
    return this._bounds.depth;
  }
  get recursiveCountNumEntities(): number {
    if (this.entities.length != 0) {
      return this.entities.length;
    }
    let total = 0;
    for (const child of this.children) {
      total += child.recursiveCountNumEntities;
    }
    return total;
  }

  constructor(private _bounds: BoundingCuboid) {}

  insert(entity: PhysicalEntity): boolean {
    let inserted = false;
    const entityBounds = new BoundingCuboid(
      EntityBounds.centre(entity.id),
      EntityBounds.dimensions(entity.id)
    );
    if (this.children.length == 0) {
      // For a leaf node, insert it into the entity list and check that we're
      // within the size limit.
      this.entities.push(entity);
      // Allow the bounds to grow to completely contain the entity. This means
      // that some of the nodes could overlap.
      this.bounds.insert(entityBounds);
      if (this.entities.length > OctNode.MaxEntities) {
        inserted = this.split();
      } else {
        inserted = true;
      }
    } else {
      // Other wise, pass the entity down through one of the children.
      // First try inserting an entity that is fully contained by an existing
      // boundary.
      for (const child of this.children) {
        if (child.bounds.containsBounds(entityBounds)) {
          inserted = child.insert(entity);
          break;
        }
      }
      // Otherwise, place it based on the entity's centre point and we will then
      // grow the bounds.
      if (!inserted) {
        for (const child of this.children) {
          if (child.containsLocation(entityBounds.centre)) {
            inserted = child.insert(entity);
            break;
          }
        }
      }
    }
    console.assert(inserted, "failed to insert entity into octree node");
    return inserted;
  }

  split(): boolean {
    this._children = new Array<OctNode>();
    // split each dimension into 2.
    const width = this.bounds.width / 2;
    const depth = this.bounds.depth / 2;
    const height = this.bounds.height / 2;
    const dimensions = new Dimensions(width, depth, height);

    // half the dimensions again to get the distances to/from the centre.
    const offset = [-0.5, 0.5];

    // Create eight children.
    for (let z = 0; z < 2; z++) {
      for (let y = 0; y < 2; y++) {
        for (let x = 0; x < 2; x++) {
          const offsetX = offset[x] * dimensions.width;
          const offsetY = offset[y] * dimensions.depth;
          const offsetZ = offset[z] * dimensions.height;
          const centre = new Point3D(
            this.centre.x + offsetX,
            this.centre.y + offsetY,
            this.centre.z + offsetZ
          );

          const bounds = new BoundingCuboid(centre, dimensions);
          this.children.push(new OctNode(bounds));
        }
      }
    }

    const insertIntoChild = function (child: OctNode, entity: PhysicalEntity) {
      if (child.containsLocation(EntityBounds.centre(entity.id))) {
        return child.insert(entity);
      }
      return false;
    };

    // Insert the entities into the children.
    for (const entity of this._entities) {
      let inserted = false;
      for (const child of this._children) {
        if (insertIntoChild(child, entity)) {
          inserted = true;
          break;
        }
      }
      console.assert(
        inserted,
        "failed to insert into children, entity centred at:",
        EntityBounds.centre(entity.id)
      );
    }

    this._entities = [];
    return true;
  }

  containsBounds(bounds: BoundingCuboid): boolean {
    return this.bounds.containsBounds(bounds);
  }

  containsLocation(location: Point3D): boolean {
    return this.bounds.contains(location);
  }

  containsEntity(entity: PhysicalEntity): boolean {
    return this.entities.indexOf(entity) != -1;
  }

  recursivelyContainsEntity(entity: PhysicalEntity): boolean {
    if (this.containsEntity(entity)) {
      return true;
    }
    for (const child of this._children) {
      if (child.recursivelyContainsEntity(entity)) {
        return true;
      }
    }
    return false;
  }

  recursiveRemoveEntity(entity: PhysicalEntity): boolean {
    const idx = this.entities.indexOf(entity);
    if (idx != -1) {
      this.entities.splice(idx, 1);
      return true;
    }
    for (const child of this.children) {
      if (child.recursiveRemoveEntity(entity)) {
        return true;
      }
    }
    return false;
  }
}

export class Octree {
  private _root: OctNode;
  private _numEntities = 0;
  private readonly _worldBounds: BoundingCuboid;

  constructor(dimensions: Dimensions) {
    const x = dimensions.width / 2;
    const y = dimensions.depth / 2;
    const z = dimensions.height / 2;
    const centre = new Point3D(x, y, z);
    this._worldBounds = new BoundingCuboid(centre, dimensions);
    this._root = new OctNode(this._worldBounds);
  }

  get root(): OctNode {
    return this._root;
  }
  get bounds(): BoundingCuboid {
    return this.root.bounds;
  }

  insert(entity: PhysicalEntity): void {
    const inserted = this._root.insert(entity);
    console.assert(inserted, "failed to insert");
    this._numEntities++;
  }

  findEntitiesInArea(
    root: OctNode,
    area: BoundingCuboid,
    entities: Array<PhysicalEntity>
  ) {
    if (root.entities.length != 0) {
      root.entities.forEach((entity) => entities.push(entity));
    } else {
      for (const child of root.children) {
        if (!child.bounds.intersects(area)) {
          continue;
        }
        this.findEntitiesInArea(child, area, entities);
      }
    }
  }

  getEntities(area: BoundingCuboid): Array<PhysicalEntity> {
    const entities = new Array<PhysicalEntity>();
    this.findEntitiesInArea(this.root, area, entities);
    return entities;
  }

  update(entity: PhysicalEntity): void {
    const removed: boolean = this.root.recursiveRemoveEntity(entity);
    console.assert(removed);
    this._numEntities--;
    this.insert(entity);
  }

  verify(entities: Array<PhysicalEntity>): boolean {
    for (const entity of entities) {
      if (!this._root.recursivelyContainsEntity(entity)) {
        console.error(
          "tree doesn't contain entity at (x,y,z):",
          entity.x,
          entity.y,
          entity.z
        );
        return false;
      }
    }
    return true;
  }
}
