import { Location, GameObject } from "./entity.js"
import { GraphicComponent } from "./graphics.js"
import { SquareGrid } from "./map.js"

export enum TerrainShape {
  Flat,
  RampUpNorth,
  RampUpEast,
  RampUpSouth,
  RampUpWest,
}

export enum TerrainType {
  Water,
  Sand,
  Mud,
  Grass,
  Rock,
}

export enum Biome {
  Water,
  Beach,
  Swamp,
  Grassland,
  Woodland,
  Tundra,
  Desert,
}

export class Terrain extends GameObject {
  private static _tileWidth: number;
  private static _tileDepth: number;
  private static _tileHeight: number;
  private static _terrainGraphics: Map<TerrainType, Array<GraphicComponent>>;

  static init(width: number, depth: number, height: number) {
    this._tileWidth = width;
    this._tileDepth = depth;
    this._tileHeight = height;
    this._terrainGraphics = new Map<TerrainType, Array<GraphicComponent>>();
  }
  
  static addTerrainSprites(type: TerrainType, graphics: Array<GraphicComponent>) {
    this._terrainGraphics.set(type, graphics);
  }
  
  static graphics(type: TerrainType, shape: TerrainShape): GraphicComponent {
    console.assert(this._terrainGraphics.has(type));
    return this._terrainGraphics.get(type)![shape];
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

  constructor(private readonly _gridX: number,
              private readonly _gridY: number,
              private readonly _gridZ: number,
              private readonly _type: TerrainType,
              private readonly _shape: TerrainShape) {
    super(new Location(_gridX * Terrain.tileWidth,
                       _gridY * Terrain.tileDepth,
                       _gridZ * Terrain.tileHeight),
          Terrain.tileWidth, Terrain.tileDepth, Terrain.tileHeight, true,
          Terrain.graphics(_type, _shape));
  }

  get shape(): TerrainShape {
    return this._shape;
  }
  
  get type(): TerrainType {
    return this._type;
  }
}

class TerrainAttributes {
  private _moisture: number;
  private _biome: Biome;
  
  constructor(private readonly _height: number,
              private readonly _terrace: number) {
    this._moisture = 0.0;
    this._biome = Biome.Water;
  }
  
  get terrace(): number { return this._terrace; }
  get height(): number { return this._height; }
  get moisture(): number { return this._moisture; }
  get biome(): Biome { return this._biome; }
}

export class TerrainBuilder {
  private _surface: Array<Array<TerrainAttributes>>;
  private _worldTerrain: SquareGrid;
  
  constructor(private readonly _width: number,
              private readonly _depth: number,
              private readonly _terraces: number,
              private readonly _waterMultiplier: number,
              private readonly _waterLevel: number,
              tileWidth: number,
              tileHeight: number,
              tileDepth: number) {
    Terrain.init(tileWidth, tileDepth, tileHeight);
    this._worldTerrain = new SquareGrid(_width, _depth);
    this._surface = new Array<Array<TerrainAttributes>>();
    for (let y = 0; y < this._depth; y++) {
      this._surface.push(new Array<TerrainAttributes>());
    }
  }
  
  calcTerrace(height: number): number {
    if (height <= this._waterLevel) {
      return 0;
    }
    return Math.floor(height / ((1.0 - this._waterLevel) / this._terraces));
  }
  
  calcRelativeHeight(centreX: number, centreY: number): number {
    let centre = this._surface[centreX][centreY];
    let relativeHeight: number = 0;
    
    for (let yDiff = -1; yDiff < 2; yDiff++) {
      let y = centreY + yDiff;
      if (y < 0 || y > this._depth) {
        continue;
      }
      for (let xDiff = -1; xDiff < 2; xDiff++) {
        let x = centreX + xDiff;
        if (x < 0 || x > this._width) {
          continue;
        }
        let neighbour = this._surface[x][y];
        if (neighbour.terrace < centre.terrace) {
          if (centre.terrace - neighbour.terrace > relativeHeight) {
            relativeHeight = centre.terrace - neighbour.terrace;
          }
        }
      }
    }
    return relativeHeight;
  }
  
  calcType(x: number, y: number): TerrainType {
    let surface = this._surface[x][y];
    switch (surface.biome) {
      default:
      break;
      case Biome.Beach:
      case Biome.Desert:
        return TerrainType.Sand;
      case Biome.Swamp:
      case Biome.Woodland:
        return TerrainType.Mud;
      case Biome.Grassland:
        return TerrainType.Grass;
      case Biome.Tundra:
        return TerrainType.Rock;
    }
    console.assert(surface.biome == Biome.Water);
    return TerrainType.Water;
  }
  
  calcShape(x: number, y: number): TerrainShape {
    let type = TerrainShape.Flat;
    return type;
  }

  build(heightMap: Array<Array<number>>): void {
    for (let y = 0; y < this._depth; y++) {
      for (let x = 0; x < this._width; x++) {
        let height = heightMap[x][y];
        this._surface[y].push(new TerrainAttributes(height, this.calcTerrace(height)));
      }
    }
    
    // Add moisture
    
    // Calculate biome
    
    // Add terrain objects that will be visible.
    for (let y = 0; y < this._depth; y++) {
      for (let x = 0; x < this._width; x++) {
        let type = this.calcType(x, y);
        let shape = this.calcShape(x, y);
        let z = this._surface[x][y].terrace;
        this._worldTerrain.addRaisedTerrain(x, y, z, type, shape);
      
        // Create a column of visible terrain below the surface tile.
        let height = this.calcRelativeHeight(x, y);
        while (height > 0) {
          z--;
          this._worldTerrain.addRaisedTerrain(x, y, z, type, TerrainShape.Flat);
        }
      }
    }
  }
}