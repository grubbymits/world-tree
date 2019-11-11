import { Location, GameObject } from "./entity.js"
import { TerrainType, TerrainShape, Terrain } from "./terrain.js"
import { SquareGrid } from "./map.js"

class MovementCost {
  constructor(private readonly _terrain: Terrain,
              private readonly _cost: number) { }
  get terrain(): Terrain { return this._terrain; }
  get location(): Location { return this._terrain.location; }
  get cost(): number { return this._cost; }
}

export class PathFinder {
  constructor(private _map: SquareGrid,
              private _objects: Array<GameObject>) { }

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
