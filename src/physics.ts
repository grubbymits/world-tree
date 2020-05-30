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
  return "";
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

export class Location {
  constructor(private _x: number,
              private _y: number,
              private _z: number) { }

  get x(): number { return this._x; }
  get y(): number { return this._y; }
  get z(): number { return this._z; }
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

class MovementCost {
  constructor(private readonly _terrain: Terrain,
              private readonly _cost: number) { }
  get terrain(): Terrain { return this._terrain; }
  get location(): Location { return this._terrain.location; }
  get cost(): number { return this._cost; }
}

export class PathFinder {
  constructor(private _map: SquareGrid,
              private _objects: Array<Entity>) { }

  static isBlocked(toTerrain: Terrain, fromTerrain: Terrain): boolean {
    let toLoc = Terrain.scaleLocation(toTerrain.location);
    let fromLoc = Terrain.scaleLocation(fromTerrain.location);

    if ((toTerrain.shape == fromTerrain.shape) &&
        (toTerrain.shape == TerrainShape.Flat)) {
      return fromLoc.z == toLoc.z;
    } else if (fromLoc.z == toLoc.z || Math.abs(fromLoc.z - toLoc.z) > 1) {
      return false;
    }

    switch (toTerrain.shape) {
    case TerrainShape.RampUpNorth:
    case TerrainShape.RampUpSouth:
      return fromLoc.x == toLoc.x && Math.abs(fromLoc.y - toLoc.y) == 1;
    case TerrainShape.RampUpEast:
    case TerrainShape.RampUpWest:
      return fromLoc.y == toLoc.y && Math.abs(fromLoc.x - toLoc.x) == 1;
    }
    return false;
  }

  findPath(begin: Terrain, end: Terrain) : Array<Terrain> {
    let path = new Array<Terrain>();
  
    // Adapted from:
    // http://www.redblobgames.com/pathfinding/a-star/introduction.html
    let frontier = new Array<MovementCost>();
    let cameFrom = new Map<number, number>();
    let costSoFar = new Map<number, number>();
    cameFrom.set(begin.id, 0);
    costSoFar.set(begin.id, 0);

    // frontier is a sorted list of locations with their lowest cost
    frontier.push(new MovementCost(begin, 0));

    let current: MovementCost = frontier[0];
    // breadth-first search
    while (frontier.length > 0) {
      current = frontier.shift()!;

      // Found!
      if (current.terrain.id == end.id) {
        break;
      }

      let neighbours: Array<Terrain> = this._map.getNeighbours(current.terrain);
      for (let next of neighbours) {
        let newCost = costSoFar.get(current.terrain.id)! +
          this._map.getNeighbourCost(current.terrain, next);

        if (!costSoFar.has(next.id) || newCost < costSoFar.get(next.id)!) {
          frontier.push(new MovementCost(next, newCost));
          costSoFar.set(next.id, newCost);

          frontier.sort((a, b) => {
            if (a.cost > b.cost) {
              return 1;
            } else if (a.cost < b.cost) {
              return -1;
            } else {
              return 0;
            }
          });
          cameFrom.set(next.id, current.terrain.id);
        }
      }
    }

    // Search has ended...
    if (current.terrain.id != end.id) {
      console.log("Could not find a path...");
      return path;
    }

    // finalise the path.
    let step = end;
    path.push(step);
    while (step.id != begin.id) {
      step = this._map.getTerrainFromId(cameFrom.get(step.id)!);
      path.push(step);
    }
    path.reverse();
    return path.splice(1);
  }
}
