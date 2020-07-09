import { Direction,
         getDirection,
         getOppositeDirection } from "./physics.js"
import { Point3D } from "./geometry.js"
import { Terrain,
         TerrainShape,
         TerrainType,
         TerrainFeature,
         isFlat,
         isRampUp } from "./terrain.js"
import { Point,
         GraphicComponent } from "./graphics.js"
import { Context } from "./context.js"

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
    let cost: number = centre.x == to.x || centre.y == to.y ? 2 : 3;
    if (isFlat(centre.shape) && isFlat(to.shape)) {
      return cost;
    }
    return centre.z == to.z ? cost : cost * 2;
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
}
