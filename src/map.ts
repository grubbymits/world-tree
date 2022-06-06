import { Direction,
         getDirectionFromPoints,
         getOppositeDirection } from "./physics.js"
import { Point2D,
         Point3D } from "./geometry.js"
import { Terrain,
         TerrainShape,
         TerrainType,
         TerrainFeature,
         isFlat,
         isRampUp } from "./terrain.js"
import { GraphicComponent } from "./graphics.js"
import { ContextImpl } from "./context.js"

export class SquareGrid {
  private readonly _neighbourOffsets: Array<Point2D> =
    [ new Point2D(-1, -1), new Point2D(0, -1),  new Point2D(1, -1),
      new Point2D(-1, 0),                       new Point2D(1, 0),
      new Point2D(-1, 1),  new Point2D(0, 1),   new Point2D(1, 1), ];

  private _surfaceTerrain: Array<Array<Terrain>>;
  private _totalSurface: number = 0;
  private _totalSubSurface: number = 0;

  constructor(private readonly _context: ContextImpl,
              private readonly _width: number,
              private readonly _height: number) {
    this._surfaceTerrain = new Array();
    for (let y = 0; y < _height; ++y) {
      this._surfaceTerrain.push(new Array<Terrain>(_width));
    }
  }

  get width(): number { return this._width; }
  get height(): number { return this._height; }
  get totalSurface(): number { return this._totalSurface; }
  get totalSubSurface(): number { return this._totalSubSurface; }
  get surfaceTerrain(): Array<Array<Terrain>> { return this._surfaceTerrain; }

  addSurfaceTerrain(x: number, y: number, z: number, type: TerrainType,
                    shape: TerrainShape, feature: TerrainFeature): void {
    let terrain = Terrain.create(this._context, x, y, z, type, shape, feature);
    this.surfaceTerrain[y][x] = terrain;
    this._totalSurface++;
  }

  addSubSurfaceTerrain(x: number, y: number, z: number, type: TerrainType,
                       shape: TerrainShape): void {
    console.assert(this.getSurfaceTerrainAt(x, y)!.z > z,
                   "adding sub-surface terrain which is above surface!");
    Terrain.create(this._context, x, y, z, type, shape, TerrainFeature.None);
    this._totalSubSurface++;
  }

  getSurfaceTerrainAt(x: number, y: number): Terrain|null {
    if ((x < 0 || x >= this.width) ||
        (y < 0 || y >= this.height)) {
      return null;
    }
    return this.surfaceTerrain[y][x];
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
   
    for (let offset of this._neighbourOffsets) {
      let neighbour = this.getSurfaceTerrainAt(centre.x + offset.x,
                                               centre.y + offset.y);
      if (!neighbour) {
        continue;
      }
      neighbours.push(neighbour);
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
    let centrePoint: Point2D = new Point2D(centre.x, centre.y);
    return neighbours.filter(function(to: Terrain) {
      console.assert(Math.abs(centre.z - to.z) <= 1,
                     "can only handle neighbours separated by 1 terrace max");

      let toPoint: Point2D = new Point2D(to.x, to.y);
      let direction: Direction = getDirectionFromPoints(centrePoint, toPoint);
      console.assert(direction == Direction.North ||
                     direction == Direction.East ||
                     direction == Direction.South ||
                     direction == Direction.West);
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
