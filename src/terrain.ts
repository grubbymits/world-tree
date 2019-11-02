import { Location, GameObject } from "./entity.js"
import { SquareGrid } from "./map.js"
import { GraphicsComponent } from "./gfx.js"

export enum TerrainType {
  Flat = 0,
  RampUpNorth = 1,
  RampUpEast = 2,
  RampUpSouth = 3,
  RampUpWest = 4,
}

class MovementCost {
  constructor(private readonly _terrain: Terrain,
              private readonly _cost: number) { }
  get terrain(): Terrain { return this._terrain; }
  get location(): Location { return this._terrain.location; }
  get cost(): number { return this._cost; }
}

export class Terrain extends GameObject {
  private static _tileWidth: number;
  private static _tileDepth: number;
  private static _tileHeight: number;


  static init(width: number, depth: number, height: number) {
    this._tileWidth = width;
    this._tileDepth = depth;
    this._tileHeight = height;
  }

  static get tileWidth(): number {
    return this._tileWidth;
  }

  static get tileHeight(): number {
    return this._tileHeight;
  }

  static get tileDepth(): number {
    return this._tileDepth;
  }

  static scaleLocation(loc: Location): Location {
    return new Location(Math.floor(loc.x / this.tileWidth),
                        Math.floor(loc.y / this.tileDepth),
                        Math.floor(loc.z / this.tileHeight));
  }

  static isBlocked(toTerrain: Terrain, fromTerrain: Terrain): boolean {
    let toLoc = Terrain.scaleLocation(toTerrain.location);
    let fromLoc = Terrain.scaleLocation(fromTerrain.location);

    if ((toTerrain.type == fromTerrain.type) &&
        (toTerrain.type == TerrainType.Flat)) {
      return fromLoc.z == toLoc.z;
    } else if (fromLoc.z == toLoc.z || Math.abs(fromLoc.z - toLoc.z) > 1) {
      return false;
    }

    switch (toTerrain.type) {
    case TerrainType.RampUpNorth:
    case TerrainType.RampUpSouth:
      return fromLoc.x == toLoc.x && Math.abs(fromLoc.y - toLoc.y) == 1;
    case TerrainType.RampUpEast:
    case TerrainType.RampUpWest:
      return fromLoc.y == toLoc.y && Math.abs(fromLoc.x - toLoc.x) == 1;
    }
    return false;
  }

  static findPath(begin: Terrain, end: Terrain,
                  map: SquareGrid) : Array<Terrain> {
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

      let neighbours: Array<Terrain> = map.getNeighbours(current.terrain);
      for (let next of neighbours) {
        let newCost = costSoFar.get(current.terrain.id)! +
          map.getNeighbourCost(current.terrain, next);

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
      step = map.getTerrainFromId(cameFrom.get(step.id)!);
      path.push(step);
    }
    path.reverse();
    return path.splice(1);
  }

  constructor(private readonly _gridX: number,
              private readonly _gridY: number,
              private readonly _gridZ: number,
              private readonly _type: TerrainType,
              graphics: GraphicsComponent) {
    super(new Location(_gridX * Terrain.tileWidth,
                       _gridY * Terrain.tileDepth,
                       _gridZ * Terrain.tileHeight),
          Terrain._tileWidth, Terrain._tileDepth, Terrain._tileHeight,
          true, graphics);
  }

  get type(): TerrainType {
    return this._type;
  }
}
