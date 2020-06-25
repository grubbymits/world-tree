import { Entity } from "./entity.js"
import { TerrainType, TerrainShape, Terrain } from "./terrain.js"
import { SquareGrid } from "./map.js"
import { Point } from "./graphics.js"

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
                                   direction: Direction): Point {
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
  return new Point(x + xDiff, y + yDiff);
}

export function getDirection(from: Point, to: Point): Direction {
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

export class Location {
  constructor(private _x: number,
              private _y: number,
              private _z: number) { }

  get x(): number { return this._x; }
  get y(): number { return this._y; }
  get z(): number { return this._z; }
  set x(x: number) { this._x = x; }
  set y(y: number) { this._y = y; }
  set z(z: number) { this._z = z; }

  isNearlySameAs(other: Location): boolean {
    return Math.floor(this.x) == Math.floor(other.x) &&
           Math.floor(this.y) == Math.floor(other.y) &&
           Math.floor(this.z) == Math.floor(other.z);
  }

  isSameAs(other: Location): boolean {
    return this.x == other.x && this.y == other.y && this.z == other.z;
  }
}

export class Dimensions {
  constructor(protected readonly _width: number,
              protected readonly _depth: number,
              protected readonly _height: number) { }

  get width(): number { return this._width; }
  get depth(): number { return this._depth; }
  get height(): number { return this._height; }
}

// An isometric square has:
// - sides equal length = 1,
// - the short diagonal is length = 1,
// - the long diagonal is length = sqrt(3) ~= 1.73.
export class IsometricPhysicalDimensions extends Dimensions {
  private static readonly _widthRatio: number = 1 / Math.sqrt(3);

  static physicalWidth(spriteWidth: number): number {
    return Math.floor(spriteWidth * this._widthRatio);
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

export class BoundingCuboid {
  private _minLocation: Location;
  private _maxLocation: Location;

  constructor(private _centre: Location,
              private _dimensions: Dimensions) {
    this.updateLocation(_centre);
  }

  get minLocation(): Location { return this._minLocation; }
  get minX(): number { return this.minLocation.x; }
  get minY(): number { return this.minLocation.y; }
  get minZ(): number { return this.minLocation.z; }
  get maxLocation(): Location { return this._maxLocation; }
  get maxX(): number { return this.maxLocation.x; }
  get maxY(): number { return this.maxLocation.y; }
  get maxZ(): number { return this.maxLocation.z; }
  get centre(): Location { return this._centre; }
  get width(): number { return this._dimensions.width; }
  get depth(): number { return this._dimensions.depth; }
  get height(): number { return this._dimensions.height; }

  updateLocation(centre: Location): void {
    this._centre = centre;
    let width = Math.floor(this.width / 2);
    let depth = Math.floor(this.depth / 2);
    let height = Math.floor(this.height / 2);

    let x = centre.x - width;
    let y = centre.y - depth;
    let z = centre.z - height;
    this._minLocation = new Location(x, y, z);

    x = centre.x + width;
    y = centre.y + depth;
    z = centre.z + height;
    this._maxLocation  = new Location(x, y, z);
  }

  contains(location: Location): boolean {
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
    let min = new Location(minX, minY, minZ);
    let max = new Location(maxX, maxY, maxZ);
    let width = Math.floor((max.x - min.x) / 2);
    let depth = Math.floor((max.y - min.y) / 2);
    let height = Math.floor((max.z - min.z) / 2);
    this._centre = new Location(min.x + width,
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
