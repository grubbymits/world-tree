import { Entity,
         MovableEntity } from "./entity.js"
import { TerrainType, TerrainShape, Terrain } from "./terrain.js"
import { SquareGrid } from "./map.js"
import { Point2D,
         Point3D,
         Vector3D,
         Geometry,
         IntersectInfo } from "./geometry.js"
import { Octree } from "./tree.js"
import { EntityEvent } from "./events.js"
import { ContextImpl } from "./context.js"

export enum Direction {
  North,
  NorthEast,
  East,
  SouthEast,
  South,
  SouthWest,
  West,
  NorthWest,
  Max,
}

export function getDirectionName(direction: Direction): string {
  switch (direction) {
  default:
    break;
  case Direction.North:
    return "north";
  case Direction.NorthEast:
    return "north east";
  case Direction.East:
    return "east";
  case Direction.SouthEast:
    return "south east";
  case Direction.South:
    return "south";
  case Direction.SouthWest:
    return "south west";
  case Direction.West:
    return "west";
  case Direction.NorthWest:
    return "north west";
  }
  console.error("unhandled direction when getting name:", direction);
  return "error";
}

export function getDirectionCoords(x: number, y: number,
                                   direction: Direction): Point2D{
  let xDiff: number = 0;
  let yDiff: number = 0;
  switch(direction) {
  default:
    console.error("unhandled cloud direction");
    break;
  case Direction.North:
    yDiff = -1;
    break;
  case Direction.NorthEast:
    xDiff = 1;
    yDiff = -1;
    break;
  case Direction.East:
    xDiff = 1;
    break;
  case Direction.SouthEast:
    xDiff = 1;
    yDiff = 1;
    break;
  case Direction.South:
    yDiff = 1;
    break;
  case Direction.SouthWest:
    xDiff = -1;
    yDiff = 1;
    break;
  case Direction.West:
    xDiff = -1;
    break;
  case Direction.NorthWest:
    xDiff = -1;
    yDiff = -1;
    break;
  }
  return new Point2D(x + xDiff, y + yDiff);
}

export function getDirection(from: Point2D, to: Point2D): Direction {
  let xDiff = from.x - to.x;
  let yDiff = from.y - to.y;

  if (xDiff < 0 && yDiff < 0) {
    return Direction.NorthWest;
  } else if (xDiff == 0 && yDiff < 0) {
    return Direction.North;
  } else if (xDiff > 0 && yDiff < 0) {
    return Direction.NorthEast;
  } else if (xDiff < 0 && yDiff == 0) {
    return Direction.West;
  } else if (xDiff > 0 && yDiff == 0) {
    return Direction.East;
  } else if (xDiff < 0 && yDiff > 0) {
    return Direction.SouthWest;
  } else if (xDiff == 0 && yDiff > 0) {
    return Direction.South;
  }
  console.assert(xDiff > 0 && yDiff > 0, "unhandled direction", xDiff, yDiff);
  return Direction.SouthEast;
}

export function getOppositeDirection(direction: Direction): Direction {
  switch (direction) {
  default:
    break;
  case Direction.NorthEast:
    return Direction.SouthWest;
  case Direction.East:
    return Direction.West;
  case Direction.SouthEast:
    return Direction.NorthWest;
  case Direction.South:
    return Direction.North;
  case Direction.SouthWest:
    return Direction.NorthEast;
  case Direction.West:
    return Direction.East;
  case Direction.NorthWest:
    return Direction.SouthEast;
  }
  console.assert(direction == Direction.North,
                 "unhandled direction");
  return Direction.North;
}

export class Dimensions {
  constructor(protected readonly _width: number,
              protected readonly _depth: number,
              protected readonly _height: number) { }

  get width(): number { return this._width; }
  get depth(): number { return this._depth; }
  get height(): number { return this._height; }
  log(): void {
    console.log(" - (WxDxH):", this.width, this.depth, this.height);
  }
}

export class BoundingCuboid {
  private _minLocation: Point3D;
  private _maxLocation: Point3D;
  private _bottomCentre: Point3D;

  constructor(private _centre: Point3D,
              private _dimensions: Dimensions) {
    this.centre = _centre;
  }

  get minLocation(): Point3D { return this._minLocation; }
  get minX(): number { return this.minLocation.x; }
  get minY(): number { return this.minLocation.y; }
  get minZ(): number { return this.minLocation.z; }
  get maxLocation(): Point3D { return this._maxLocation; }
  get maxX(): number { return this.maxLocation.x; }
  get maxY(): number { return this.maxLocation.y; }
  get maxZ(): number { return this.maxLocation.z; }
  get centre(): Point3D { return this._centre; }
  get bottomCentre(): Point3D { return this._bottomCentre; }
  get width(): number { return this._dimensions.width; }
  get depth(): number { return this._dimensions.depth; }
  get height(): number { return this._dimensions.height; }
  get dimensions(): Dimensions { return this._dimensions; }

  set centre(centre: Point3D) {
    this._centre = centre;
    let width = this.width / 2;
    let depth = this.depth / 2;
    let height = this.height / 2;

    let x = centre.x - width;
    let y = centre.y - depth;
    let z = centre.z - height;
    this._bottomCentre = new Point3D(centre.x, centre.y, z);
    this._minLocation = new Point3D(x, y, z);

    x = centre.x + width;
    y = centre.y + depth;
    z = centre.z + height;
    this._maxLocation  = new Point3D(x, y, z);
  }

  update(d: Vector3D): void {
    this._centre = this._centre.add(d);
    this._bottomCentre = this._bottomCentre.add(d);
    this._minLocation = this._minLocation.add(d);
    this._maxLocation = this._maxLocation.add(d);
  }

  contains(location: Point3D): boolean {
    if (location.x < this._minLocation.x ||
        location.y < this._minLocation.y ||
        location.z < this._minLocation.z)
      return false;

    if (location.x > this._maxLocation.x ||
        location.y > this._maxLocation.y ||
        location.z > this._maxLocation.z)
      return false;

    return true;
  }

  containsBounds(other: BoundingCuboid) {
    return this.contains(other.minLocation) &&
           this.contains(other.maxLocation);
  }

  intersects(other: BoundingCuboid): boolean {
    if (other.minLocation.x > this.maxLocation.x ||
        other.maxLocation.x < this.minLocation.x)
      return false;

    if (other.minLocation.y > this.maxLocation.y ||
        other.maxLocation.y < this.minLocation.y)
      return false;

    if (other.minLocation.z > this.maxLocation.z ||
        other.maxLocation.z < this.minLocation.z)
      return false;

    return true;
  }

  insert(other: BoundingCuboid) {
    if (this.containsBounds(other)) {
      return; // nothing to do.
    }

    let minX = other.minLocation.x < this.minLocation.x ?
      other.minLocation.x : this.minLocation.x;
    let minY = other.minLocation.y < this.minLocation.y ?
      other.minLocation.y : this.minLocation.y;
    let minZ = other.minLocation.z < this.minLocation.z ?
      other.minLocation.z : this.minLocation.z;
    let maxX = other.maxLocation.x > this.maxLocation.x ?
      other.maxLocation.x : this.maxLocation.x;
    let maxY = other.maxLocation.y > this.maxLocation.y ?
      other.maxLocation.y : this.maxLocation.y;
    let maxZ = other.maxLocation.z > this.maxLocation.z ?
      other.maxLocation.z : this.maxLocation.z;

    console.assert(minX >= 0 && minY >= 0 && minZ >= 0);
    this._dimensions =
      new Dimensions(maxX - minX, maxY - minY, maxZ - minZ);
    const min = new Point3D(minX, minY, minZ);
    const max = new Point3D(maxX, maxY, maxZ);
    const width = (max.x - min.x) / 2;
    const depth = (max.y - min.y) / 2;
    const height = (max.z - min.z) / 2;
    this._centre = new Point3D(min.x + width,
                                min.y + depth,
                                min.z + height);
    this._minLocation = min;
    this._maxLocation = max;
  }

  dump(): void {
    console.log("BoundingCuboid");
    console.log(" - min (x,y,z):",
                this.minLocation.x,
                this.minLocation.y,
                this.minLocation.z);
    console.log(" - max (x,y,z):",
                this.maxLocation.x,
                this.maxLocation.y,
                this.maxLocation.z);
    console.log(" - centre (x,y,z):",
                this.centre.x,
                this.centre.y,
                this.centre.z);
    console.log(" - dimensions (WxDxH):",
                this.width, this.depth, this.height);
  }
}

export class CollisionInfo {
  constructor(private readonly _collidedEntity: Entity,
              private readonly _blocking: boolean,
              private readonly _intersectInfo: IntersectInfo) { }
  get entity(): Entity { return this._collidedEntity; }
  get blocking(): boolean { return this._blocking; }
  get intersectInfo(): IntersectInfo { return this._intersectInfo; }
}

export class CollisionDetector {
  private static _collisionInfo: Map<MovableEntity, CollisionInfo>;
  private static _missInfo: Map<MovableEntity, Array<Entity>>;
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

  static addMissInfo(movable: MovableEntity, entities: Array<Entity>): void {
    this._missInfo.set(movable, entities);
  }

  static hasMissInfo(movable: MovableEntity): boolean {
    return this._missInfo.has(movable);
  }

  static getMissInfo(movable: MovableEntity): Array<Entity> {
    console.assert(this.hasMissInfo(movable));
    return this._missInfo.get(movable)!;
  }

  static detectInArea(movable: MovableEntity, path: Vector3D, maxAngle: Vector3D,
                      area: BoundingCuboid): CollisionInfo|null {
    const bounds = movable.bounds;
    const widthVec3D = new Vector3D(bounds.width, 0, 0);
    const depthVec3D = new Vector3D(0, bounds.depth, 0);
    const heightVec3D = new Vector3D(0, 0, bounds.height);

    const beginPoints: Array<Point3D> = [
      bounds.minLocation, 
      bounds.minLocation.add(heightVec3D),
      bounds.minLocation.add(depthVec3D),
      bounds.minLocation.add(widthVec3D),
      bounds.maxLocation.sub(heightVec3D),
      bounds.maxLocation.sub(depthVec3D),
      bounds.maxLocation.sub(widthVec3D),
      bounds.maxLocation
    ];

    let misses: Array<Entity> = new Array<Entity>();
    const entities: Array<Entity> = this._spatialInfo.getEntities(area);

    for (let entity of entities) {
      if (entity.id == movable.id) {
        continue;
      }
      const geometry: Geometry = entity.geometry;
      for (const beginPoint of beginPoints) {
        const endPoint = beginPoint.add(path);

        if (geometry.obstructs(beginPoint, endPoint)) {
          const blocking =
            maxAngle.zero || geometry.obstructs(beginPoint, endPoint.add(maxAngle));
          const collision =
            new CollisionInfo(entity, blocking, geometry.intersectInfo!);
          this._collisionInfo.set(movable, collision);
          movable.postEvent(EntityEvent.Collision);
          return collision;
        } else {
          misses.push(entity);
          movable.postEvent(EntityEvent.NoCollision);
        }
      }
      if (movable.bounds.intersects(entity.bounds) && maxAngle.zero) {
        console.log("movable entity intersects entity but hasn't collided!");
      }
    }
    this.addMissInfo(movable, misses);
    return null;
  }
}

export class Gravity {
  private static _enabled: boolean = false;
  private static _force: number = 0;
  private static _context: ContextImpl;
  private static readonly _zero: Vector3D = new Vector3D(0, 0, 0);

  static init(force: number, context: ContextImpl) {
    this._force = force;
    this._context = context;
    this._enabled = true;
  }

  static update(entities: Array<MovableEntity>): void {
    if (!this._enabled) {
      return;
    }

    for (let movable of entities) {
      const relativeEffect = movable.lift - this._force;
      if (relativeEffect >= 0) {
        continue;
      }
      const path = new Vector3D(0, 0, relativeEffect)
      let bounds = movable.bounds;
      // Create a bounds to contain the current location and the destination.
      let area = new BoundingCuboid(bounds.centre.add(path), bounds.dimensions);
      area.insert(bounds);
      const collision =
        CollisionDetector.detectInArea(movable, path, this._zero, area);
      if (collision == null) {
        movable.updatePosition(path);
        movable.postEvent(EntityEvent.Moving);
        console.log("applying gravity");
      }
    }
  }
}
