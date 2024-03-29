import { MovableEntity, PhysicalEntity } from "./entity.ts";
import { Geometry, IntersectInfo, Point3D, Vector3D } from "./geometry.ts";
import { Octree } from "./tree.ts";
import { EntityEvent } from "./events.ts";
import { ContextImpl } from "./context.ts";

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
  private _bottomCentre: Point3D;
  private _topCentre: Point3D;

  constructor(private _centre: Point3D, private _dimensions: Dimensions) {
    this.centre = _centre;
  }

  get minLocation(): Point3D {
    return this._minLocation;
  }
  get minX(): number {
    return this.minLocation.x;
  }
  get minY(): number {
    return this.minLocation.y;
  }
  get minZ(): number {
    return this.minLocation.z;
  }
  get maxLocation(): Point3D {
    return this._maxLocation;
  }
  get maxX(): number {
    return this.maxLocation.x;
  }
  get maxY(): number {
    return this.maxLocation.y;
  }
  get maxZ(): number {
    return this.maxLocation.z;
  }
  get bottomCentre(): Point3D {
    return this._bottomCentre;
  }
  get topCentre(): Point3D {
    return this._topCentre;
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
  get dimensions(): Dimensions {
    return this._dimensions;
  }

  get centre(): Point3D {
    return this._centre;
  }
  set centre(centre: Point3D) {
    this._centre = centre;
    const width = this.width / 2;
    const depth = this.depth / 2;
    const height = this.height / 2;

    let x = centre.x - width;
    let y = centre.y - depth;
    let z = centre.z - height;
    this._bottomCentre = new Point3D(centre.x, centre.y, z);
    this._topCentre = new Point3D(centre.x, centre.y, centre.z + height);
    this._minLocation = new Point3D(x, y, z);

    x = centre.x + width;
    y = centre.y + depth;
    z = centre.z + height;
    this._maxLocation = new Point3D(x, y, z);
  }

  update(d: Vector3D): void {
    this._centre = this._centre.add(d);
    this._bottomCentre = this._bottomCentre.add(d);
    this._minLocation = this._minLocation.add(d);
    this._maxLocation = this._maxLocation.add(d);
  }

  futureBounds(d: Vector3D): BoundingCuboid {
    let bounds = new BoundingCuboid(this.centre, this.dimensions);
    bounds.update(d);
    return bounds;
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

  axisOverlapX(other: BoundingCuboid): boolean {
    if (
      (other.minLocation.x >= this.minLocation.x &&
        other.minLocation.x <= this.maxLocation.x) ||
      (other.maxLocation.x >= this.minLocation.x &&
        other.maxLocation.x <= this.maxLocation.x)
    ) {
      return true;
    }
    return false;
  }

  axisOverlapY(other: BoundingCuboid): boolean {
    if (
      (other.minLocation.y >= this.minLocation.y &&
        other.minLocation.y <= this.maxLocation.y) ||
      (other.maxLocation.y >= this.minLocation.y &&
        other.maxLocation.y <= this.maxLocation.y)
    ) {
      return true;
    }
    return false;
  }

  axisOverlapZ(other: BoundingCuboid): boolean {
    if (
      (other.minLocation.z >= this.minLocation.z &&
        other.minLocation.z <= this.maxLocation.z) ||
      (other.maxLocation.z >= this.minLocation.z &&
        other.maxLocation.z <= this.maxLocation.z)
    ) {
      return true;
    }
    return false;
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
    const min = new Point3D(minX, minY, minZ);
    const max = new Point3D(maxX, maxY, maxZ);
    const width = (max.x - min.x) / 2;
    const depth = (max.y - min.y) / 2;
    const height = (max.z - min.z) / 2;
    this._centre = new Point3D(min.x + width, min.y + depth, min.z + height);
    this._minLocation = min;
    this._maxLocation = max;
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
    console.log(
      " - centre (x,y,z):",
      this.centre.x,
      this.centre.y,
      this.centre.z
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
    path: Vector3D,
    area: BoundingCuboid
  ): CollisionInfo | null {
    const bounds = movable.bounds;
    const widthVec3D = new Vector3D(bounds.width, 0, 0);
    const depthVec3D = new Vector3D(0, bounds.depth, 0);
    const heightVec3D = new Vector3D(0, 0, bounds.height);

    const newBounds: BoundingCuboid = movable.bounds.futureBounds(path);
    const beginPoints: Array<Point3D> = [
      bounds.minLocation,
      bounds.minLocation.add(heightVec3D),
      bounds.minLocation.add(depthVec3D),
      bounds.minLocation.add(widthVec3D),
      bounds.maxLocation.sub(heightVec3D),
      bounds.maxLocation.sub(depthVec3D),
      bounds.maxLocation.sub(widthVec3D),
      bounds.maxLocation,
    ];

    const misses: Array<PhysicalEntity> = new Array<PhysicalEntity>();
    const entities: Array<PhysicalEntity> = this._spatialInfo.getEntities(area);

    for (const entity of entities) {
      if (entity.id == movable.id) {
        continue;
      }

      // First check bounding box intersection.
      if (!entity.bounds.intersects(newBounds)) {
        continue;
      }

      // If both geometries are cuboids, we don't have to check further.
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
  private static _enabled = false;
  private static _force = 0;
  private static _context: ContextImpl;

  static init(force: number, context: ContextImpl) {
    this._force = -force;
    this._context = context;
    this._enabled = true;
  }

  static update(entities: Array<MovableEntity>): void {
    if (!this._enabled) {
      return;
    }

    if (this._force < 0) {
      const path = new Vector3D(0, 0, this._force);
      entities.forEach((movable) => {
        const bounds = movable.bounds;
        // Create a bounds to contain the current location and the destination.
        const area = new BoundingCuboid(
          bounds.centre.add(path),
          bounds.dimensions
        );
        area.insert(bounds);
        const collision = CollisionDetector.detectInArea(movable, path, area);
        if (collision == null) {
          movable.updatePosition(path);
        }
      });
    }
  }
}
