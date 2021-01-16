import { Entity,
         Actor } from "./entity.js"
import { TerrainType, TerrainShape, Terrain } from "./terrain.js"
import { SquareGrid } from "./map.js"
import { Point2D,
         Point3D,
         Vector3D,
         Geometry } from "./geometry.js"
import { Octree } from "./tree.js"

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
  console.error("unhandled direction when getting name");
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
    let width = Math.floor(this.width / 2);
    let depth = Math.floor(this.depth / 2);
    let height = Math.floor(this.height / 2);

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

    this._dimensions =
      new Dimensions(maxX - minX, maxY - minY, maxZ - minZ);
    let min = new Point3D(minX, minY, minZ);
    let max = new Point3D(maxX, maxY, maxZ);
    let width = Math.floor((max.x - min.x) / 2);
    let depth = Math.floor((max.y - min.y) / 2);
    let height = Math.floor((max.z - min.z) / 2);
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

export class CollisionDetector {
  constructor(private readonly _spatialInfo : Octree) { }

  detectInArea(actor: Actor, path: Vector3D, area: BoundingCuboid): boolean {
    const bounds = actor.bounds;
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

    let entities: Array<Entity> = this._spatialInfo.getEntities(area);
    for (let entity of entities) {
      if (entity.id == actor.id) {
        continue;
      }
      const geometry: Geometry = entity.geometry;
      for (const beginPoint of beginPoints) {
        const endPoint = beginPoint.add(path);

        if (geometry.obstructs(beginPoint, endPoint)) {
          console.log("actor at", bounds.minLocation);
          console.log("obstructed by entity at", entity.bounds.minLocation);
          return true;
        }
      }
    }
    return false;
  }
}
