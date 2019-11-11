import { Location, GameObject } from "./entity.js"
import { GraphicComponent } from "./graphics.js"
import { SquareGrid } from "./map.js"

export enum TerrainShape {
  Flat = 0,
  RampUpNorth = 1,
  RampUpEast = 2,
  RampUpSouth = 3,
  RampUpWest = 4,
}

export enum TerrainType {
  WATER = 0,
  SAND = 1,
  MUD = 2,
  GRASS = 3,
  ROCK = 4,
}

export enum Biome {
  BEACH,
  SWAMP,
  GRASSLAND,
  WOODLAND,
  DESERT,
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

export class TerrainBuilder {
  private _worldTerrain: SquareGrid;
  
  constructor(private readonly _width: number,
              private readonly _depth: number,
              private readonly _terraces: number,
              private readonly _waterLevel: number,
              tileWidth: number,
              tileHeight: number,
              tileDepth: number) {
    Terrain.init(tileWidth, tileDepth, tileHeight);
    this._worldTerrain = new SquareGrid(_width, _depth);
  }

  build(heightMap: Array<Array<number>>): void {
  }
}