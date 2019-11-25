import { Location } from "./physics.js"
import { Terrain, TerrainShape, TerrainType } from "./terrain.js"
import { Point, GraphicComponent } from "./graphics.js"

export class SquareGrid {
  private readonly _neighbourOffsets: Array<Point> =
    [ new Point(-1, -1), new Point(0, -1), new Point(1, -1),
      new Point(-1, 0),                    new Point(1, 0),
      new Point(-1, 1),  new Point(0, 1),  new Point(1, 1), ];

  // FIXME How to declare multi-dimensional map
  private _raisedTerrain: any;

  private _allTerrain: Map<number, Terrain>;

  constructor(private readonly _width: number,
              private readonly _height: number) {
    this._raisedTerrain = new Map();
    this._allTerrain = new Map<number, Terrain>();
    console.log("creating map", _width, _height);
  }

  get width(): number {
    return this._width;
  }

  get height(): number {
    return this._height;
  }

  addRaisedTerrain(x: number, y: number, z: number, type: TerrainType,
                   shape: TerrainShape) {
    let terrain = new Terrain(x, y, z, type, shape);
    if (!this._raisedTerrain.has(x)) {
      this._raisedTerrain[x] = new Map<number, Array<Terrain>>();
      this._raisedTerrain[x][y] = new Array<Terrain>();
      this._raisedTerrain[x][y].push(terrain);
    } else {
      if (this._raisedTerrain[x].has(y)) {
        this._raisedTerrain[x][y].push(terrain);
      } else {
        this._raisedTerrain[x][y] = new Array<Terrain>();
        this._raisedTerrain[x][y].push(terrain);
      }
    }
    this._allTerrain.set(terrain.id, terrain);
  }

  get allTerrain(): Map<number, Terrain> {
    return this._allTerrain;
  }

  getTerrain(x: number, y: number, z: number): Terrain | null {
    if (x < 0 || x >= this.width) {
      return null;
    }
    if (y < 0 || y >= this.height) {
      return null;
    }
    if (z < 0) {
      return null;
    }
    let raised = this._raisedTerrain[x][y];
    for (let i in raised) {
      if (raised[i].z == z) {
        return raised[i];
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
}
