import { Location, Direction } from "./physics.js"
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

  static get tileWidth(): number { return this._tileWidth; }
  static get tileHeight(): number { return this._tileHeight; }
  static get tileDepth(): number { return this._tileDepth; }

  static scaleLocation(loc: Location): Location {
    return new Location(Math.floor(loc.x / this.tileWidth),
                        Math.floor(loc.y / this.tileDepth),
                        Math.floor(loc.z / this.tileHeight));
  }

  static create(x: number, y: number, z: number,
                type: TerrainType, shape: TerrainShape) : Terrain {
    return new Terrain(x, y, z, this.tileWidth, this.tileDepth, this.tileHeight,
                       type, shape);
  }

  constructor(private readonly _gridX: number,
              private readonly _gridY: number,
              private readonly _gridZ: number,
              width: number,
              depth: number,
              height: number,
              private readonly _type: TerrainType,
              private readonly _shape: TerrainShape) {
    super(new Location(_gridX * width, _gridY * depth, _gridZ * height),
          width, depth, height, true, Terrain.graphics(_type, _shape));
  }

  get gridX(): number { return this._gridX; }
  get gridY(): number { return this._gridY; }
  get gridZ(): number { return this._gridZ; }
  get shape(): TerrainShape { return this._shape; }
  get type(): TerrainType { return this._type; }
}

class TerrainAttributes {
  private _moisture: number;
  private _terrace: number;
  private _biome: Biome;
  private _type: TerrainType;
  private _shape: TerrainShape;
  
  constructor(private readonly _x: number,
              private readonly _y: number,
              private readonly _height: number) {
    this._moisture = 0.0;
    this._biome = Biome.Water;
    this._terrace = 0;
    this._type = TerrainType.Water;
    this._shape = TerrainShape.Flat;
  }
  
  get x(): number { return this._x; }
  get y(): number { return this._y; }
  get height(): number { return this._height; }
  get terrace(): number { return this._terrace; }
  get type(): TerrainType { return this._type; }
  get shape(): TerrainShape { return this._shape; }
  get moisture(): number { return this._moisture; }
  get biome(): Biome { return this._biome; }

  set terrace(t: number) { this._terrace = t; }
  set type(t: TerrainType) { this._type = t; }
  set shape(s: TerrainShape) { this._shape = s; }
  set biome(b: Biome) { this._biome = b; }
}

class Cloud {
  constructor(_x: number, _y: number,
              private _moisture: number,
              private _direction: Direction,
              private _surface: Array<Array<TerrainAttributes>>) { }

  update(): boolean {
    if (this._moisture <= 0) {
      return true;
    }

    let xDiff = 0;
    let yDiff = 0;
    switch(this._direction) {
    default:
      console.error("unhandled cloud direction");
      break;
    case Direction.North:
      yDiff = -1;
      break;
    case Direction.NorthEast:
      xDiff = 1;
      yDiff = -1;
      break;
    case Direction.East:
      xDiff = 1;
      break;
    case Direction.SouthEast:
      xDiff = 1;
      yDiff = 1;
      break;
    case Direction.South:
      yDiff = 1;
      break;
    case Direction.SouthWest:
      xDiff = -1;
      yDiff = 1;
      break;
    case Direction.West:
      xDiff = -1;
      break;
    case Direction.NorthWest:
      xDiff = -1;
      yDiff = -1;
      break;
    }
    return false;
  }
}

class Surface {
  private _surface: Array<Array<TerrainAttributes>>;

  constructor(private readonly _width: number,
              private readonly _depth: number) {
    this._surface = new Array<Array<TerrainAttributes>>();
  }

  get width(): number { return this._width; }
  get depth(): number { return this._depth; }

  init(heightMap: Array<Array<number>>) {
    for (let y = 0; y < this._depth; y++) {
      this._surface.push(new Array<TerrainAttributes>());
      for (let x = 0; x < this._width; x++) {
        let height = heightMap[y][x];
        this._surface[y].push(new TerrainAttributes(x, y, height));
        console.log("created surface", this._surface[y][x]);
      }
    }
  }

  at(x: number, y: number): TerrainAttributes {
    return this._surface[y][x];
  }

  getNeighbours(centreX: number, centreY: number): Array<TerrainAttributes> {
    let neighbours = new Array<TerrainAttributes>();
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
        neighbours.push(this._surface[y][x]);
      }
    }
    return neighbours;
  }
}

export class TerrainBuilder {
  private _worldTerrain: SquareGrid;
  private _surface: Surface;
  
  constructor(width: number,
              depth: number,
              private readonly _terraces: number,
              private readonly _waterMultiplier: number,
              private readonly _waterLevel: number,
              tileWidth: number,
              tileHeight: number,
              tileDepth: number) {
    Terrain.init(tileWidth, tileDepth, tileHeight);
    this._surface = new Surface(width, depth);
    this._worldTerrain = new SquareGrid(width, depth);
  }

  get terrain(): SquareGrid {
    return this._worldTerrain;
  }
  
  calcRelativeHeight(x: number, y: number): number {
    let neighbours = this._surface.getNeighbours(x, y);
    let relativeHeight: number = 0;
    let centre = this._surface.at(x, y);
   
    for (let neighbour of neighbours) { 
      if (neighbour.terrace < centre.terrace) {
        if (centre.terrace - neighbour.terrace > relativeHeight) {
          relativeHeight = centre.terrace - neighbour.terrace;
        }
      }
    }
    return relativeHeight;
  }
  
  calcType(x: number, y: number): TerrainType {
    let surface = this._surface.at(x, y);
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

  smoothEdge(x: number, y: number) {
    let centre = this._surface.at(x, y);
    if (centre.shape != TerrainShape.Flat || centre.terrace == 0) {
      return;
    }
    let neighbours = this._surface.getNeighbours(x, y);
    let toEvaluate = new Array<TerrainAttributes>();
    let adjacentToLower: boolean = false;
    for (let neighbour of neighbours) {
      if (neighbour.x != centre.x && neighbour.y != centre.y) {
        continue;
      }
      if (neighbour.terrace < centre.terrace) {
        adjacentToLower = true;
      }
      if (neighbour.shape != TerrainShape.Flat) {
        toEvaluate.push(neighbour);
      }
    }
    // Don't have a corner to smooth out.
    if (toEvaluate.length < 2 || !adjacentToLower) {
      return;
    }
    console.log("smoothing terrain", centre);
    centre.terrace = centre.terrace - 1;
  }

  calcShape(x: number, y: number): TerrainShape {
    let neighbours = this._surface.getNeighbours(x, y);
    let shapeType = TerrainShape.Flat;
    let centre = this._surface.at(x, y);
    let toEvaluate = new Array<TerrainAttributes>();

    for (let neighbour of neighbours) {
      if (neighbour.terrace == centre.terrace) {
        continue;
      }
      if (neighbour.terrace > centre.terrace) {
        continue;
      }
      if ((neighbour.terrace - centre.terrace) > 1) {
        continue;
      }
      if ((neighbour.x != centre.x) && (neighbour.y != centre.y)) {
        continue;
      }
      toEvaluate.push(neighbour);
    }

    if (toEvaluate.length == 0 || toEvaluate.length > 1) {
      return TerrainShape.Flat;
    }

    let neighbour = toEvaluate[0];
    if (neighbour.y > centre.y) {
      return TerrainShape.RampUpNorth;
    } else if (neighbour.x < centre.x) {
      return TerrainShape.RampUpEast;
    } else if (neighbour.x > centre.x) {
      return TerrainShape.RampUpWest;
    } else if (neighbour.y < centre.y) {
      return TerrainShape.RampUpSouth;
    }

    return TerrainShape.Flat;
  }

  build(heightMap: Array<Array<number>>): void {
    this._surface.init(heightMap);

    // Calculate the terraces.
    for (let y = 0; y < this._surface.depth; y++) {
      for (let x = 0; x < this._surface.width; x++) {
        let surface = this._surface.at(x, y);
        let terrace = surface.height <= this._waterLevel ? 0 :
          Math.floor(surface.height / ((1.0 - this._waterLevel) / this._terraces));
        surface.terrace = terrace;
      }
    }

    // Add moisture
    
    // Calculate biome, type and shape.
    let landRange = 1.0 - this._waterLevel;
    let terraceSpacing = landRange / this._terraces;
    let beachLimit = this._waterLevel + (landRange / 10);
    for (let y = 0; y < this._surface.depth; y++) {
      for (let x = 0; x < this._surface.width; x++) {
        let biome = Biome.Water;
        let surface = this._surface.at(x, y);
        if (surface.height <= this._waterLevel) {
          surface.biome = Biome.Water;
        } else if (surface.height <= beachLimit) {
          surface.biome = Biome.Beach;
        } else {
          surface.biome = Biome.Grassland;
        }

        surface.type = this.calcType(x, y);
        surface.shape = this.calcShape(x, y);
        if (surface.shape != TerrainShape.Flat) {
          console.log("modified surface shape", surface);
        }
      }
    }

    // After terraces and shapes have been calculated, smooth out the terrace
    // corners after some edges have been turned into ramps. 
    for (let y = 0; y < this._surface.depth; y++) {
      for (let x = 0; x < this._surface.width; x++) {
        this.smoothEdge(x, y);
      }
    }
    
    // Add terrain objects that will be visible.
    for (let y = 0; y < this._surface.depth; y++) {
      for (let x = 0; x < this._surface.width; x++) {
        let surface = this._surface.at(x, y);
        this._worldTerrain.addRaisedTerrain(x, y, surface.terrace,
                                            surface.type, surface.shape);
      }
    }

    // Create a column of visible terrain below the surface tile.
    for (let y = 0; y < this._surface.depth; y++) {
      for (let x = 0; x < this._surface.width; x++) {
        let z = this._surface.at(x, y).terrace;
        let zStop = z - this.calcRelativeHeight(x, y);
        let terrain = this._worldTerrain.getTerrain(x, y, z)!;
        if (terrain == null) {
          console.error("didn't find terrain in map at", x, y, z);
        }
        while (z > zStop) {
          z--;
          this._worldTerrain.addRaisedTerrain(x, y, z, terrain.type,
                                              TerrainShape.Flat);
        }
      }
    }
  }
}
