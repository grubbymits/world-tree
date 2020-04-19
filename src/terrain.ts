import { Location,
         Dimensions,
         CartisanDimensionsFromSprite,
         IsometricDimensionsFromSprite,
         Direction } from "./physics.js"
import { Rain } from "./weather.js"
import { StaticEntity } from "./entity.js"
import { Point,
         CoordSystem,
         GraphicComponent } from "./graphics.js"
import { SquareGrid } from "./map.js"

export enum TerrainShape {
  Flat,
  FlatNorthEdge,
  FlatNorthEastEdge,
  FlatEastEdge,
  RampUpNorth,
  RampUpNorthEdge,
  RampUpEast,
  RampUpEastEdge,
  RampUpSouth,
  RampUpSouthEdge,
  RampUpWest,
  RampUpWestEdge,
}

export enum TerrainType {
  Water,
  Sand,
  Mud,
  DryGrass,
  WetGrass,
  Rock,
}

export enum Biome {
  Water,
  Beach,
  Marshland,
  Grassland,
  Woodland,
  Tundra,
  Desert,
}

function getBiomeName(biome: Biome): string {
  switch (biome) {
  default:
    console.error("unhandled biome type:", biome);
  case Biome.Water:
    return "water";
  case Biome.Beach:
    return "beach";
  case Biome.Marshland:
    return "marshland";
  case Biome.Grassland:
    return "grassland";
  case Biome.Woodland:
    return "woodland";
  case Biome.Tundra:
    return "tundra";
  case Biome.Desert:
    return "desert";
  }
}

function getShapeName(terrain: TerrainShape): string {
  switch (terrain) {
  default:
    console.error("unhandled terrain shape:", terrain);
  case TerrainShape.Flat:
    return "flat";
  case TerrainShape.FlatNorthEdge:
    return "flat north edge";
  case TerrainShape.FlatNorthEastEdge:
    return "flat north east edge";
  case TerrainShape.FlatEastEdge:
    return "flat east edge";
  case TerrainShape.RampUpNorth:
    return "ramp up north";
  case TerrainShape.RampUpNorthEdge:
    return "ramp up north edge";
  case TerrainShape.RampUpEast:
    return "ramp up east";
  case TerrainShape.RampUpEastEdge:
    return "ramp up east edge";
  case TerrainShape.RampUpSouth:
    return "ramp up south";
  case TerrainShape.RampUpSouthEdge:
    return "ramp up south edge";
  case TerrainShape.RampUpWest:
    return "ramp up west";
  case TerrainShape.RampUpWestEdge:
    return "ramp up west edge";
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
  case TerrainType.DryGrass:
    return "dry grass";
  case TerrainType.WetGrass:
    return "wet grass";
  case TerrainType.Rock:
    return "rock";
  }
}

function isFlat(terrain: TerrainShape): boolean {
  switch (terrain) {
  default:
    break;
  case TerrainShape.Flat:
  case TerrainShape.FlatNorthEdge:
  case TerrainShape.FlatNorthEastEdge:
  case TerrainShape.FlatEastEdge:
    return true;
  }
  return false;
}

function mean(grid: Array<Float32Array>): number {
  let total: number = 0;
  let numElements: number = 0;
  for (let row of grid) {
    let acc = row.reduce(function (acc: number, value: number) {
      return acc + value;
    }, 0);
    total += acc;
    numElements += row.length;
  }
  return total / numElements;
}

function meanWindow(grid: Array<Float32Array>, centreX: number, centreY: number,
                    offsets: Array<number>): number {
  let total: number = 0;
  let numElements: number = offsets.length * offsets.length;
  for (let dy in offsets) {
    let y = centreY + offsets[dy];
    for (let dx in offsets) {
      let x = centreX + offsets[dx];
      total += grid[y][x];
    }
  }
  return total / numElements;
}

function standardDevWindow(grid: Array<Float32Array>, centreX: number, centreY: number,
                           offsets: Array<number>): number {

  let avg: number = meanWindow(grid, centreX, centreY, offsets);
  if (avg == 0) {
    return 0;
  }
  let total: number = 0;
  let diffsSquared = new Array<Float32Array>();
  let size = offsets.length;

  for (let dy in offsets) {
    let y = centreY + offsets[dy];
    let row = new Float32Array(size);
    let wx: number = 0;
    for (let dx in offsets) {
      let x = centreX + offsets[dx];
      let diff = grid[y][x] - avg;
      row[wx] = diff * diff;
      wx++;
    }
    diffsSquared.push(row);
  }
  return Math.sqrt(mean(diffsSquared));
}

function gaussianBlur(grid: Array<Float32Array>, width: number,
                      depth: number) : Array<Float32Array> {

  const offsets: Array<number> = [ -2, -1, 0, 1, 2 ];
  const distancesSquared: Array<number> = [ 4, 1, 0, 1, 4];

  let result = new Array<Float32Array>();
  // Just copy the two left columns
  for (let y = 0; y < 2; y++) {
    result[y] = grid[y];
  }
  // Just copy the two right columns.
  for (let y = depth - 2; y < depth; y++) {
    result[y] = grid[y];
  }

  let filter = new Float32Array(5);
  for (let y = 2; y < depth - 2; y++) {
    result[y] = new Float32Array(width);

    // Just copy the edge values.
    for (let x = 0; x < 2; x++) {
      result[y][x] = grid[y][x];
    }
    for (let x = width - 2; x < width; x++) {
      result[y][x] = grid[y][x];
    }

    for (let x = 2; x < width - 2; x++) {
      let sigma: number = standardDevWindow(grid, x, y, offsets);
      if (sigma == 0) {
        continue;
      }

      let sigmaSquared = sigma * sigma;
      const denominator: number = Math.sqrt(2 * Math.PI * sigmaSquared);

      let sum: number = 0;
      for (let i in distancesSquared) {
        let numerator: number = Math.exp(-(distancesSquared[i] / (2 * sigmaSquared)));
        filter[i] = numerator / denominator;
        sum += filter[i];
      }
      for (let coeff of filter) {
        coeff /= sum;
      }

      let blurred: number = 0;
      for (let i in offsets) {
        let dx = offsets[i];
        blurred += grid[y][x + dx] * filter[i];
      }

      for (let i in offsets) {
        let dy = offsets[i];
        blurred += grid[y + dy][x] * filter[i];
      }
      result[y][x] = blurred; //Math.floor(blurred);
    }
  }

  return result;
}

export class Terrain extends StaticEntity {
  private static _dimensions: Dimensions;
  private static _sys: CoordSystem;
  private static _terrainGraphics = new Map<TerrainType, Array<GraphicComponent>>();

  static init(dims: Dimensions, sys: CoordSystem) {
    this._dimensions = dims;
    this._sys = sys;
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
                   "undefined terrain graphic for:", getTypeName(terrainType),
                   getShapeName(shape));
    return this._terrainGraphics.get(terrainType)![shape];
  }

  static get width(): number { return this._dimensions.width; }
  static get depth(): number { return this._dimensions.depth; }
  static get height(): number { return this._dimensions.height; }
  static get sys(): CoordSystem { return this._sys; }

  static scaleLocation(loc: Location): Location {
    return new Location(Math.floor(loc.x / this.width),
                        Math.floor(loc.y / this.depth),
                        Math.floor(loc.z / this.height));
  }

  static create(x: number, y: number, z: number,
                type: TerrainType, shape: TerrainShape) : Terrain {
    return new Terrain(x, y, z, this._dimensions, type, shape);
  }

  constructor(private readonly _gridX: number,
              private readonly _gridY: number,
              private readonly _gridZ: number,
              dimensions: Dimensions,
              private readonly _type: TerrainType,
              private readonly _shape: TerrainShape) {
    super(new Location(_gridX * dimensions.width,
                       _gridY * dimensions.depth,
                       _gridZ * dimensions.height),
          dimensions, true, Terrain.graphics(_type, _shape), Terrain.sys);
  }

  get gridX(): number { return this._gridX; }
  get gridY(): number { return this._gridY; }
  get gridZ(): number { return this._gridZ; }
  get shape(): TerrainShape { return this._shape; }
  get type(): TerrainType { return this._type; }
}

export class TerrainAttributes {
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

  set moisture(m: number) { this._moisture = m; }
  set terrace(t: number) { this._terrace = t; }
  set type(t: TerrainType) { this._type = t; }
  set shape(s: TerrainShape) { this._shape = s; }
  set biome(b: Biome) { this._biome = b; }
}

export class Surface {
  private _surface: Array<Array<TerrainAttributes>>;

  constructor(private readonly _width: number,
              private readonly _depth: number) {
    this._surface = new Array<Array<TerrainAttributes>>();
  }

  get width(): number { return this._width; }
  get depth(): number { return this._depth; }

  init(heightMap: Array<Array<number>>) {
    console.log("initialise surface");
    for (let y = 0; y < this._depth; y++) {
      this._surface.push(new Array<TerrainAttributes>());
      for (let x = 0; x < this._width; x++) {
        let height = heightMap[y][x];
        this._surface[y].push(new TerrainAttributes(x, y, height));
      }
    }
  }

  inbounds(coord: Point): boolean {
    if (coord.x < 0 || coord.x >= this._width ||
        coord.y < 0 || coord.y >= this._depth)
      return false;
    return true;
  }

  at(x: number, y: number): TerrainAttributes {
    return this._surface[y][x];
  }

  // Return surface neighbours in a 3x3 radius.
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
  private readonly _terraceSpacing: number;
  private readonly _waterLevel: number = 0.0;
  private readonly _landRange: number = this._ceiling - this._waterLevel;
  private readonly _beachLimit: number = this._waterLevel + (this._landRange / 10);
  private readonly _treeLimit: number = 0.6;
  
  constructor(width: number,
              depth: number,
              private readonly _ceiling: number,
              private readonly _terraces: number,
              private readonly _water: number,
              private readonly _wetLimit: number,
              private readonly _dryLimit: number,
              spriteWidth: number,
              spriteHeight: number,
              spriteHeightRatio: number,
              sys: CoordSystem) {
    let dims = sys == CoordSystem.Isometric ?
      new IsometricDimensionsFromSprite(spriteWidth, spriteHeight, spriteHeightRatio) :
      new CartisanDimensionsFromSprite(spriteWidth, spriteHeight, spriteHeightRatio);
    Terrain.init(dims, sys);
    this._surface = new Surface(width, depth);
    this._worldTerrain = new SquareGrid(width, depth);
    this._terraceSpacing = this._landRange / this._terraces;
    console.log("Terrain builder with", this._terraces, "terraces, and",
                this._terraceSpacing, "terrace spacing");
  }

  get terrain(): SquareGrid {
    return this._worldTerrain;
  }
  
  calcRelativeHeight(x: number, y: number): number {
    let neighbours = this._surface.getNeighbours(x, y);
    let relativeHeight: number = 0;
    let centre = this._surface.at(x, y);
   
    for (let neighbour of neighbours) { 
      console.assert(neighbour.terrace >= 0,
                     "Found neighbour with negative terrace!", neighbour.terrace);
      if (neighbour.terrace < centre.terrace) {
        if (centre.terrace - neighbour.terrace > relativeHeight) {
          relativeHeight = centre.terrace - neighbour.terrace;
        }
      }
    }
    console.assert(relativeHeight <= this._terraces,
                   "impossible relative height:", relativeHeight,
                   "\ncentre:", centre);
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
      case Biome.Marshland:
        return TerrainType.WetGrass;
      case Biome.Woodland:
        return TerrainType.Mud;
      case Biome.Grassland:
        return TerrainType.DryGrass;
      case Biome.Tundra:
        return TerrainType.Rock;
    }
    console.log("default biome:", getBiomeName(surface.biome));
    console.assert(surface.biome == Biome.Water);
    return TerrainType.Water;
  }

  calcShapes() {
    console.log("adding ramps");
    const filterDepth: number = 3;
    const coordOffsets: Array<Point> = [ new Point(0, -1),
                                         new Point(1, 0),
                                         new Point(0, 1),
                                         new Point(-1, 0) ];
    const ramps: Array<TerrainShape> = [ TerrainShape.RampUpNorth,
                                         TerrainShape.RampUpEast,
                                         TerrainShape.RampUpSouth,
                                         TerrainShape.RampUpWest ];
    const direction = [ "north", "east", "south", "west" ];
    const filterCoeffs: Array<number> = [ 0.15, 0.1 ];

    for (let y = filterDepth; y < this._surface.depth - filterDepth; y++) {
      for (let x = filterDepth; x < this._surface.width - filterDepth; x++) {
        let centre: TerrainAttributes = this._surface.at(x, y);
        if (!isFlat(centre.shape) || centre.biome == Biome.Water) {
          continue;
        }

        // First pass to filter out tiles with too many neighbours on different
        // terraces.
        // TODO: Maybe use a low-pass filter to average out the terraces first.
        let numDiffTerraces = 0;
        for (let i in coordOffsets) {
          let offset: Point = coordOffsets[i];
          let neighbour: TerrainAttributes =
            this._surface.at(x + offset.x, y + offset.y);
          if (neighbour.terrace != centre.terrace ||
              !isFlat(neighbour.shape)) {
            ++numDiffTerraces;
          }
        }
        if (numDiffTerraces > 2) {
          continue;
        }

        for (let i in coordOffsets) {
          let offset: Point = coordOffsets[i];
          let neighbour: TerrainAttributes =
            this._surface.at(x + offset.x, y + offset.y);

          if (!isFlat(neighbour.shape)) {
            break;
          }

          if (centre.terrace == neighbour.terrace) {
            continue;
          }

          let result: number = centre.terrace * 0.45 + neighbour.terrace * 0.3;
          let next: TerrainAttributes = neighbour;
          for (let d = 0; d < filterDepth - 1; d++) {
            next = this._surface.at(next.x + offset.x, next.y + offset.y);
            result += next.terrace * filterCoeffs[d];
          }

          result = Math.round(result);
          if (result > centre.terrace) {
            centre.shape = ramps[i];
            centre.terrace = result;
            //console.log("adding ramp at (x,y):", x, y);
            //console.log("direction:", direction[i]);
            //console.log("ramp shape:", getShapeName(centre.shape));
            break;
          }
        }
      }
    }
  }

  calcEdge(x: number, y: number): TerrainShape {
    let centre = this._surface.at(x, y);
    let neighbours = this._surface.getNeighbours(x, y);
    let shapeType = centre.shape;

    if (centre.type == TerrainType.Water) {
      return shapeType;
    }

    let northEdge: boolean = false;
    let eastEdge: boolean = false;
    for (let neighbour of neighbours) {
      // Only look at lower neighbours
      if (neighbour.terrace > centre.terrace) {
        continue;
      }
      // Don't look at diagonal neighbours.
      if ((neighbour.x != centre.x) && (neighbour.y != centre.y)) {
        continue;
      }
      // we may have an edge against a ramp, though it is in the same terrace.
      if (neighbour.terrace == centre.terrace &&
         (isFlat(centre.shape) == isFlat(neighbour.shape))) {
        continue;
      }

      northEdge = northEdge || neighbour.y < centre.y;
      eastEdge = eastEdge || neighbour.x > centre.x;
      if (northEdge && eastEdge)
        break;
    }

    if (shapeType == TerrainShape.Flat) {
      if (northEdge && eastEdge) {
        shapeType = TerrainShape.FlatNorthEastEdge;
      } else if (northEdge) {
        shapeType = TerrainShape.FlatNorthEdge;
      } else if (eastEdge) {
        shapeType = TerrainShape.FlatEastEdge;
      }
    } else if (shapeType == TerrainShape.RampUpNorth && eastEdge) {
      shapeType = TerrainShape.RampUpNorthEdge;
    } else if (shapeType == TerrainShape.RampUpEast && northEdge) {
      shapeType = TerrainShape.RampUpEastEdge;
    } else if (shapeType == TerrainShape.RampUpSouth && eastEdge) {
      shapeType = TerrainShape.RampUpSouthEdge;
    } else if (shapeType == TerrainShape.RampUpWest && northEdge) {
      shapeType = TerrainShape.RampUpWestEdge;
    }
    return shapeType;
  }

  build(heightMap: Array<Array<number>>): void {
    console.log("build terrain from height map");
    this._surface.init(heightMap);

    console.log("calculating terraces");
    // Calculate the terraces.
    for (let y = 0; y < this._surface.depth; y++) {
      for (let x = 0; x < this._surface.width; x++) {
        let surface = this._surface.at(x, y);
        let terrace = surface.height <= this._waterLevel ? 0 :
          Math.floor((surface.height - this._waterLevel) / this._terraceSpacing);
        console.assert(terrace <= this._terraces && terrace >= 0,
                       "terrace out of range:", terrace);
        surface.terrace = terrace;
      }
    }


    console.log("adding rain");
    // Add moisture:
    // - clouds are added at the 'bottom' of the map and move northwards.
    Rain.init(this._waterLevel, this._surface);
    for (let x = 0; x < this._surface.width; x++) {
      Rain.add(x, this._surface.depth - 1, this._water, Direction.North);
    }

    for (let i = 0; i < Rain.clouds.length; i++) {
      let cloud = Rain.clouds[i];
      while (!cloud.update()) { }
    }

    console.log("total clouds added:", Rain.totalClouds);
    let blurredMoisture = gaussianBlur(Rain.moistureGrid, this._surface.width,
                                       this._surface.depth);
   
    console.log("calculating terrain biomes"); 
    // Calculate biome, type and shape.
    for (let y = 0; y < this._surface.depth; y++) {
      for (let x = 0; x < this._surface.width; x++) {
        let surface = this._surface.at(x, y);
        surface.moisture = blurredMoisture[y][x];
        let biome: Biome = Biome.Water;
        if (surface.height <= this._waterLevel) {
          biome = Biome.Water;
        } else if (surface.height <= this._beachLimit) {
          biome = Biome.Beach;
        } else {
          if (surface.height > this._treeLimit) {
            biome = Biome.Tundra;
          } else {
            biome = surface.moisture > this._wetLimit ?
              Biome.Marshland : surface.moisture > this._dryLimit ?
              Biome.Grassland : Biome.Desert;
          }
        }
        surface.biome = biome;
      }
    }

    this.calcShapes();

    console.log("adding surface terrain entities"); 
    // Add terrain objects that will be visible.
    for (let y = 0; y < this._surface.depth; y++) {
      for (let x = 0; x < this._surface.width; x++) {
        let surface = this._surface.at(x, y);
        //surface.biome = blurred[y][x];
        surface.type = this.calcType(x, y);
        surface.shape = this.calcEdge(x, y);
        console.assert(surface.terrace <= this._terraces && surface.terrace >= 0,
                       "terrace out-of-range", surface.terrace);
        this._worldTerrain.addRaisedTerrain(x, y, surface.terrace,
                                            surface.type, surface.shape);
      }
    }

    console.log("adding subterranean entities");
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
