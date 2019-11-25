import { Location } from "./physics.js"
import { Entity } from "./entity.js"
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

function getShapeName(terrain: TerrainShape): string {
  switch (terrain) {
  default:
    console.error("unhandled terrain shape:", terrain);
  case TerrainShape.Flat:
    return "flat";
  case TerrainShape.RampUpNorth:
    return "ramp up north";
  case TerrainShape.RampUpEast:
    return "ramp up east";
  case TerrainShape.RampUpSouth:
    return "ramp up south";
  case TerrainShape.RampUpWest:
    return "ramp up west";
  }
}

function getTypeName(terrain: TerrainType): string {
  switch (terrain) {
  default:
    console.error("unhandled terrain type:", terrain);
  case TerrainType.Water:
    return "water";
  case TerrainType.Sand:
    return "sand";
  case TerrainType.Mud:
    return "mud";
  case TerrainType.Grass:
    return "grass";
  case TerrainType.Rock:
    return "rock";
  }
}

export class Terrain extends Entity {
  private static _tileWidth: number;
  private static _tileDepth: number;
  private static _tileHeight: number;
  private static _terrainGraphics = new Map<TerrainType, Array<GraphicComponent>>();

  static init(width: number, depth: number, height: number) {
    this._tileWidth = width;
    this._tileDepth = depth;
    this._tileHeight = height;
  }
  
  static addTerrainGraphics(terrainType: TerrainType,
                            graphics: Array<GraphicComponent>) {
    console.log("adding graphics for", getTypeName(terrainType), graphics);
    this._terrainGraphics.set(terrainType, graphics);
  }
  
  static graphics(terrainType: TerrainType,
                  shape: TerrainShape): GraphicComponent {
    console.assert(this._terrainGraphics.has(terrainType),
                   "undefined terrain graphic for TerrainType:",
                   getTypeName(terrainType));
    console.assert(shape < this._terrainGraphics.get(terrainType)!.length,
                   "undefined terrain graphic for TerrainShape:",
                   getShapeName(shape));
    return this._terrainGraphics.get(terrainType)![shape];
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

  set biome(b: Biome) { this._biome = b; }
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
  }

  get terrain(): SquareGrid {
    return this._worldTerrain;
  }
  
  calcTerrace(height: number): number {
    if (height <= this._waterLevel) {
      return 0;
    }
    return Math.floor(height / ((1.0 - this._waterLevel) / this._terraces));
  }
  
  calcRelativeHeight(centreX: number, centreY: number): number {
    let centre = this._surface[centreY][centreX];
    let relativeHeight: number = 0;
    
    for (let yDiff = -1; yDiff < 2; yDiff++) {
      let y = centreY + yDiff;
      if (y < 0 || y >= this._depth) {
        continue;
      }
      for (let xDiff = -1; xDiff < 2; xDiff++) {
        let x = centreX + xDiff;
        if (x < 0 || x >= this._width) {
          continue;
        }
        let neighbour = this._surface[y][x];
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
    let surface = this._surface[y][x];
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
    let shapeType = TerrainShape.Flat;
    return shapeType;
  }

  build(heightMap: Array<Array<number>>): void {
    for (let y = 0; y < this._depth; y++) {
      this._surface.push(new Array<TerrainAttributes>());
      for (let x = 0; x < this._width; x++) {
        let height = heightMap[y][x];
        this._surface[y].push(new TerrainAttributes(height,
                                                    this.calcTerrace(height)));
      }
    }
    
    // Add moisture
    
    // Calculate biome
    let landRange = 1.0 - this._waterLevel;
    let terraceSpacing = landRange / this._terraces;
    let beachLimit = this._waterLevel + (landRange / 10);
    for (let y = 0; y < this._depth; y++) {
      for (let x = 0; x < this._width; x++) {
        let biome = Biome.Water;
        let surface = this._surface[y][x];
        if (surface.height <= this._waterLevel) {
          surface.biome = Biome.Water;
        } else if (surface.height <= beachLimit) {
          surface.biome = Biome.Beach;
        } else {
          surface.biome = Biome.Grassland;
        }
      }
    }
    
    // Add terrain objects that will be visible.
    for (let y = 0; y < this._depth; y++) {
      for (let x = 0; x < this._width; x++) {
        let terrainType = this.calcType(x, y);
        let terrainShape = this.calcShape(x, y);
        let z = this._surface[y][x].terrace;
        this._worldTerrain.addRaisedTerrain(x, y, z, terrainType, terrainShape);
      }
    }
    // Create a column of visible terrain below the surface tile.
    for (let y = 0; y < this._depth; y++) {
      for (let x = 0; x < this._width; x++) {
        let z = this.calcRelativeHeight(x, y);
        let terrain = this._worldTerrain.getTerrain(x, y, z)!;
        while (z > 0) {
          z--;
          this._worldTerrain.addRaisedTerrain(x, y, z, terrain.type,
                                              TerrainShape.Flat);
        }
      }
    }
  }
}
