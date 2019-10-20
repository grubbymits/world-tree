import { Location } from "./entity.js"
import { Terrain, TerrainType } from "./terrain.js"
import { GraphicsComponent } from "./gfx.js"

export class Point {
  constructor(private readonly _x: number,
              private readonly _y: number) { }
  get x() { return this._x; }
  get y() { return this._y; }
}

export class SquareGrid {
  private readonly _neighbourOffsets: Array<Point> =
    [ new Point(-1, -1), new Point(0, -1), new Point(1, -1),
      new Point(-1, 0),                    new Point(1, 0),
      new Point(-1, 1),  new Point(0, 1),  new Point(1, 1), ];

  private _floor: Array<Array<Terrain>>;

  // FIXME How to declare multi-dimensional map
  private _raisedTerrain: any;

  private _allTerrain: Map<number, Terrain>;

  constructor(private readonly _width: number,
              private readonly _height: number,
              tileWidth: number,  // x
              tileDepth: number,  // y
              tileHeight: number, // z
              component: GraphicsComponent) {
    this._raisedTerrain = new Map();
    this._floor = new Array<Array<Terrain>>();
    this._allTerrain = new Map<number, Terrain>();

    Terrain.init(tileWidth, tileDepth, tileHeight);
    console.log("creating map", _width, _height);

    for (let x = 0; x < this._width; x++) {
      this._floor[x] = new Array<Terrain>();
      for (let y = 0; y < this._height; y++) {
        let terrain = new Terrain(x, y, 0, TerrainType.Flat, component);
        this._allTerrain[terrain.id] = terrain;
        this._floor[x].push(terrain);
      }
    }
  }

  get width(): number {
    return this._width;
  }

  get height(): number {
    return this._height;
  }

  get raisedTerrain(): Array<Terrain> {
    return this._raisedTerrain;
  }

  addRaisedTerrain(x: number, y: number, z: number, terrainType: TerrainType,
                   component: GraphicsComponent): Terrain {
    let terrain = new Terrain(x, y, z, terrainType, component);
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
    this._allTerrain[terrain.id] = terrain;
    return terrain;
  }

  getFloor(x: number, y: number): Terrain {
    return this._floor[x][y];
  }

  getTerrain(x: number, y: number, z: number): Terrain {
    if (x < 0 || x >= this.width) {
      return null;
    }
    if (y < 0 || y >= this.height) {
      return null;
    }
    if (z == 0) {
      return this.getFloor(x, y);
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
    return this._allTerrain.get(id);
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
   
    for (let z in [ -1, 0, 1 ]) { 
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
