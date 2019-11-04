import { Location, GameObject } from "./entity.js"
import { GraphicsComponent } from "./gfx.js"

export enum TerrainType {
  Flat = 0,
  RampUpNorth = 1,
  RampUpEast = 2,
  RampUpSouth = 3,
  RampUpWest = 4,
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
