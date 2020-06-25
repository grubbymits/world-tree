import { Location,
         Direction,
         getDirection,
         getOppositeDirection } from "./physics.js"
import { Terrain,
         TerrainShape,
         TerrainType,
         TerrainFeature,
         isRampUp } from "./terrain.js"
import { Point,
         GraphicComponent } from "./graphics.js"
import { Context } from "./context.js"

class MovementCost {
  constructor(private readonly _terrain: Terrain,
              private readonly _cost: number) { }
  get terrain(): Terrain { return this._terrain; }
  get location(): Location { return this._terrain.location; }
  get cost(): number { return this._cost; }
}

export class SquareGrid {
  private readonly _neighbourOffsets: Array<Point> =
    [ new Point(-1, -1), new Point(0, -1), new Point(1, -1),
      new Point(-1, 0),                    new Point(1, 0),
      new Point(-1, 1),  new Point(0, 1),  new Point(1, 1), ];

  private _raisedTerrain: Map<number, Map<number, Array<Terrain>>>;
  private _allTerrain: Map<number, Terrain>;

  constructor(private readonly _context: Context,
              private readonly _width: number,
              private readonly _height: number) {
    this._raisedTerrain = new Map();
    this._allTerrain = new Map<number, Terrain>();
    console.log("creating map", _width, _height);
  }

  get width(): number { return this._width; }
  get height(): number { return this._height; }

  addRaisedTerrain(x: number, y: number, z: number, type: TerrainType,
                   shape: TerrainShape, feature: TerrainFeature) {
    let terrain = Terrain.create(this._context, x, y, z, type, shape, feature);
    if (!this._raisedTerrain.has(x)) {
      this._raisedTerrain.set(x, new Map<number, Array<Terrain>>());
      this._raisedTerrain.get(x)!.set(y, new Array<Terrain>());
      this._raisedTerrain.get(x)!.get(y)!.push(terrain);
    } else {
      if (this._raisedTerrain.get(x)!.has(y)) {
        this._raisedTerrain.get(x)!.get(y)!.push(terrain);
      } else {
        this._raisedTerrain.get(x)!.set(y, new Array<Terrain>());
        this._raisedTerrain.get(x)!.get(y)!.push(terrain);
      }
    }
    this._allTerrain.set(terrain.id, terrain);
  }

  get allTerrain(): Map<number, Terrain> {
    return this._allTerrain;
  }

  getTerrain(x: number, y: number, z: number): Terrain | null {
    if ((x < 0 || x >= this.width) ||
        (y < 0 || y >= this.height) ||
        (z < 0)) {
      console.log("SquareGrid: terrain coordinates out-of-range");
      return null;
    }

    let raised: Array<Terrain> = this._raisedTerrain.get(x)!.get(y)!;
    for (let terrain of raised) {
      if (terrain.gridZ == z) {
        return terrain;
      }
    }
    return null;
  }

  getTerrainFromId(id: number): Terrain {
    return this._allTerrain.get(id)!;
  }

  getNeighbourCost(centre: Terrain, to: Terrain): number {
    // If a horizontal, or vertical, move cost 1 then a diagonal move would be
    // 1.444... So scale by 2 and round. Double the cost of changing height.
    if ((centre.x == to.x) || (centre.y == to.y)) {
      return centre.z == to.z ? 2 : 4;
    }
    return centre.z == to.z ? 3 : 6;
  }
  
  getNeighbours(centre: Terrain): Array<Terrain> {
    let neighbours = new Array<Terrain>();
   
    for (let z of [ -1, 0, 1 ]) {
      for (let offset of this._neighbourOffsets) {
        let neighbour = this.getTerrain(centre.x + offset.x,
                                        centre.y + offset.y,
                                        centre.z + z);
        if (!neighbour) {
          continue;
        }
        neighbours.push(neighbour);
      }
    }
    return neighbours;
  }

  getAccessibleNeighbours(centre: Terrain): Array<Terrain> {

    // Blocked by different Z values, other than when:
    // direction, entering non-blocking tile
    // north,     RampUpNorth
    // east,      RampUEast
    // south,     RampUpSouth
    // west,      RampUpWest

    // Blocked by different Z values, other than when:
    // direction, leaving non-blocking tile
    // north,     RampUpSouth
    // east,      RampUpWest
    // south,     RampUpNorth
    // west,      RampUpEast

    let neighbours = this.getNeighbours(centre);
    let centrePoint: Point = new Point(centre.x, centre.y);
    return neighbours.filter(function(to: Terrain) {
      console.assert(Math.abs(centre.z - to.z) <= 1,
                     "can only handle neighbours separated by 1 terrace max");

      let toPoint: Point = new Point(to.x, to.y);
      let direction: Direction = getDirection(centrePoint, toPoint);
      let oppositeDir: Direction = getOppositeDirection(direction);
      if (to.z == centre.z) {
        return true;
      } else if (to.z > centre.z) {
        return !isRampUp(centre.shape, direction) && isRampUp(to.shape, direction);
      } else if (to.z < centre.z) {
        return !isRampUp(centre.shape, oppositeDir) && isRampUp(to.shape, oppositeDir);
      }
      return false;
    });
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

      let neighbours: Array<Terrain> = this.getAccessibleNeighbours(current.terrain);
      for (let next of neighbours) {
        let newCost = costSoFar.get(current.terrain.id)! +
          this.getNeighbourCost(current.terrain, next);

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
      step = this.getTerrainFromId(cameFrom.get(step.id)!);
      path.push(step);
    }
    path.reverse();
    return path.splice(1);
  }
}
