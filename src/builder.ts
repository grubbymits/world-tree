
import { SquareGrid } from "./map.js"
import { Terrain,
         TerrainShape,
         TerrainType,
         TerrainFeature,
         isFlat,
         isEdge,
         getTypeName,
         getShapeName } from "./terrain.js"
import { Rain } from "./weather.js"
import { Dimensions,
         Direction,
         getDirectionFromPoints,
         getDirectionName } from "./physics.js"
import { Point2D } from "./geometry.js"
import { ContextImpl } from "./context.js"

export enum Biome {
  Water,
  Beach,
  Rock,
  Marshland,
  Desert,
  Grassland,
  Shrubland,
  MoistForest,
  WetForest,
  RainForest,
  Tundra,
  AlpineGrassland,
  AlpineMeadow,
  AlpineForest,
  Taiga,
}

export function getBiomeName(biome: Biome): string {
  switch (biome) {
  default:
    console.error("unhandled biome type:", biome);
  case Biome.Water:
    return "water";
  case Biome.Beach:
    return "beach";
  case Biome.Marshland:
    return "marshland";
  case Biome.Desert:
    return "desert";
  case Biome.Grassland:
    return "grassland";
  case Biome.Shrubland:
    return "shrubland";
  case Biome.MoistForest:
    return "moist forest";
  case Biome.WetForest:
    return "wet forest";
  case Biome.RainForest:
    return "rain forest";
  case Biome.Tundra:
    return "tundra";
  case Biome.AlpineGrassland:
    return "alpine grassland";
  case Biome.AlpineMeadow:
    return "alpine meadow";
  case Biome.AlpineForest:
    return "alpine forest";
  case Biome.Taiga:
    return "taiga";
  }
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

  const filterSize = 5;
  const halfSize = Math.floor(filterSize / 2);
  const offsets: Array<number> = [ -2, -1, 0, 1, 2 ];
  const distancesSquared: Array<number> = [ 4, 1, 0, 1, 4 ];

  let result = new Array<Float32Array>();
  // Just copy the two left columns
  for (let y = 0; y < halfSize; y++) {
    result[y] = grid[y];
  }
  // Just copy the two right columns.
  for (let y = depth - halfSize; y < depth; y++) {
    result[y] = grid[y];
  }

  let filter = new Float32Array(filterSize);
  for (let y = halfSize; y < depth - halfSize; y++) {
    result[y] = new Float32Array(width);

    // Just copy the edge values.
    for (let x = 0; x < halfSize; x++) {
      result[y][x] = grid[y][x];
    }
    for (let x = width - halfSize; x < width; x++) {
      result[y][x] = grid[y][x];
    }

    for (let x = halfSize; x < width - halfSize; x++) {
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


class TerrainAttributes {
  private _moisture: number;
  private _terrace: number;
  private _biome: Biome;
  private _type: TerrainType;
  private _shape: TerrainShape;
  private _features: number;
  private _fixed: boolean = false;
  
  constructor(private readonly _x: number,
              private readonly _y: number,
              private readonly _height: number) {
    this._moisture = 0.0;
    this._biome = Biome.Water;
    this._terrace = 0;
    this._type = TerrainType.Water;
    this._shape = TerrainShape.Flat;
    this._features = <number>TerrainFeature.None;
  }
  
  get x(): number { return this._x; }
  get y(): number { return this._y; }
  get pos(): Point2D { return new Point2D(this._x, this._y); }
  get height(): number { return this._height; }
  get terrace(): number { return this._terrace; }
  get type(): TerrainType { return this._type; }
  get shape(): TerrainShape { return this._shape; }
  get features(): number { return this._features; }
  get moisture(): number { return this._moisture; }
  get biome(): Biome { return this._biome; }
  get fixed(): boolean { return this._fixed; }

  set moisture(m: number) { this._moisture = m; }
  set terrace(t: number) { this._terrace = t; }
  set type(t: TerrainType) { this._type = t; }
  set shape(s: TerrainShape) { this._shape = s; }
  set features(f: number) { this._features |= f; }
  set biome(b: Biome) { this._biome = b; }
  set fixed(f: boolean) { this._fixed = f; }
}

/** @internal */
export class Surface {
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
      }
    }
  }

  inbounds(coord: Point2D): boolean {
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
        if (x == centreX && y == centreY) {
          continue;
        }
        neighbours.push(this._surface[y][x]);
      }
    }
    return neighbours;
  }
}

export class TerrainBuilderConfig {
  private _waterLine: number = 0;
  private _wetLimit: number = 0;
  private _dryLimit: number = 0;
  private _uplandThreshold: number = 0;
  private _hasWater: boolean = false;
  private _hasRamps: boolean = false;
  private _hasBiomes: boolean = false;
  private _rainfall: number = 0;
  private _rainDirection: Direction = Direction.North;

  constructor(private readonly _numTerraces: number,
              private readonly _defaultFloor: TerrainType,
              private readonly _defaultWall: TerrainType) {
    console.assert(_numTerraces > 0);
  }

  set waterLine(level: number) { this._waterLine = level; }
  set wetLimit(level: number) { this._wetLimit = level; }
  set rainfall(level: number) { this._rainfall = level; }
  set rainDirection(direction: Direction) { this._rainDirection = direction; }
  set dryLimit(level: number) { this._dryLimit = level; }
  set hasWater(enable: boolean) { this._hasWater = enable; }
  set hasRamps(enable: boolean) { this._hasRamps = enable; }
  set hasBiomes(enable: boolean) { this._hasBiomes = enable; }

  get numTerraces(): number { return this._numTerraces; }
  get uplandThreshold(): number { return this._uplandThreshold; }
  get hasWater(): boolean { return this._hasWater; }
  get floor(): TerrainType { return this._defaultFloor; }
  get wall(): TerrainType { return this._defaultWall; }
  get waterLine(): number { return this._waterLine; }
  get wetLimit(): number { return this._wetLimit; }
  get dryLimit(): number { return this._dryLimit; }
  get ramps(): boolean { return this._hasRamps; }
  get biomes(): boolean { return this._hasBiomes; }
  get rainfall(): number { return this._rainfall; }
  get rainDirection(): Direction { return this._rainDirection; }
}

export class TerrainBuilder {
  protected _surface: Surface;
  protected readonly _terraceSpacing: number;

  constructor(width: number,
              depth: number,
              heightMap: Array<Array<number>>,
              private readonly _config: TerrainBuilderConfig,
              physicalDims: Dimensions) {
    Terrain.init(physicalDims);

    // Normalise heights, minimum = 0;
    let minHeight: number = 0;
    let maxHeight: number = 0;
    for (let y = 0; y < depth; y++) {
      let row: Array<number> = heightMap[y];
      let max = row.reduce(function(a, b) {
        return Math.max(a, b);
      });
      let min = row.reduce(function(a, b) {
        return Math.min(a, b);
      });
      minHeight = Math.min(minHeight, min);
      maxHeight = Math.max(maxHeight, max);
    }
    if (minHeight < 0) {
      minHeight = Math.abs(minHeight);
      for (let y = 0; y < depth; y++) {
        for (let x = 0; x < width; x++) {
          heightMap[y][x] += minHeight;
        }
      }
      maxHeight += minHeight;
    }
    this._terraceSpacing = maxHeight / this.config.numTerraces;
    this._surface = new Surface(width, depth);
    this.surface.init(heightMap);

    // Calculate the terraces.
    for (let y = 0; y < this.surface.depth; y++) {
      for (let x = 0; x < this.surface.width; x++) {
        let surface = this.surface.at(x, y);
        surface.terrace = Math.floor(surface.height / this._terraceSpacing);
        surface.shape = TerrainShape.Flat;
        surface.type = this.config.floor;
        console.assert(surface.terrace <= this.config.numTerraces && surface.terrace >= 0,
                       "terrace out of range:", surface.terrace);
      }
    }
  }

  get config(): TerrainBuilderConfig { return this._config; }
  get surface(): Surface { return this._surface; }
  get terraceSpacing(): number { return this._terraceSpacing; }

  hasFeature(x: number, y: number, feature: TerrainFeature): boolean {
    console.assert(x >= 0 && x < this.surface.width &&
                   y >= 0 && y < this.surface.depth);
    return (this.surface.at(x, y).features & feature) != 0;
  }

  terrainTypeAt(x: number, y: number): TerrainType {
    console.assert(x >= 0 && x < this.surface.width &&
                   y >= 0 && y < this.surface.depth);
    return this.surface.at(x, y).type;
  }

  terrainShapeAt(x: number, y: number): TerrainShape {
    console.assert(x >= 0 && x < this.surface.width &&
                   y >= 0 && y < this.surface.depth);
    return this.surface.at(x, y).shape;
  }

  moistureAt(x: number, y: number): number {
    console.assert(x >= 0 && x < this.surface.width &&
                   y >= 0 && y < this.surface.depth);
    return this.surface.at(x, y).moisture;
  }

  isFlatAt(x: number, y: number): boolean {
    console.assert(x >= 0 && x < this.surface.width &&
                   y >= 0 && y < this.surface.depth);
    return isFlat(this.surface.at(x, y).shape);
  }

  biomeAt(x: number, y: number): Biome {
    console.assert(x >= 0 && x < this.surface.width &&
                   y >= 0 && y < this.surface.depth);
    return this.surface.at(x, y).biome;
  }

  relativeHeightAt(x: number, y: number): number {
    console.assert(x >= 0 && x < this.surface.width &&
                   y >= 0 && y < this.surface.depth);
    return this.surface.at(x, y).terrace;
  }

  generateMap(context: ContextImpl): void {
    if (this.config.ramps) {
      this.setShapes();
    }
    if (this.config.rainfall > 0) {
      this.addRain(this.config.rainDirection, this.config.rainfall, this.config.waterLine);
    }
    if (this.config.biomes || this.config.hasWater) {
      this.setBiomes();
    }
    this.setEdges();
    this.setFeatures();

    let map =
      new SquareGrid(context, this.surface.width, this.surface.depth);

    for (let y = 0; y < this.surface.depth; y++) {
      for (let x = 0; x < this.surface.width; x++) {
        let surface = this.surface.at(x, y);
        // Add terrain objects that will be visible.
        console.assert(surface.terrace <= this.config.numTerraces && surface.terrace >= 0,
                       "terrace out-of-range", surface.terrace);
        map.addSurfaceTerrain(x, y, surface.terrace,
                              surface.type, surface.shape,
                              surface.features);
      }
    }

    // Create a column of visible terrain below the surface tile.
    for (let y = 0; y < this.surface.depth; y++) {
      for (let x = 0; x < this.surface.width; x++) {
        let z = this.surface.at(x, y).terrace;
        let zStop = z - this.calcRelativeHeight(x, y);
        let terrain = map.getSurfaceTerrainAt(x, y)!;
        if (terrain == null) {
          console.error("didn't find terrain in map at", x, y, z);
        }
        const shape = isFlat(terrain.shape) ? terrain.shape : TerrainShape.Flat;
        while (z > zStop) {
          z--;
          map.addSubSurfaceTerrain(x, y, z, terrain.type, shape);
        }
      }
    }
  }

  setShapes(): void {
    const coordOffsets: Array<Point2D> = [
      new Point2D(0, 1),
      new Point2D(-1, 0),
      new Point2D(0, -1),
      new Point2D(1, 0)
    ];

    const ramps: Array<TerrainShape> = [ 
      TerrainShape.RampUpSouth,
      TerrainShape.RampUpWest,
      TerrainShape.RampUpNorth,
      TerrainShape.RampUpEast
    ];

    // Find locations that have heights that sit exactly between two terraces
    // and then find their adjacent locations that are higher terraces. Set
    // those locations to be ramps.
    let totalRamps = 0;
    for (let y = this.surface.depth - 3; y > 1 ;y--) {
      for (let x = 2; x < this.surface.width - 2; x++) {
        let centre: TerrainAttributes = this.surface.at(x, y);
        if (!isFlat(centre.shape)) {
          continue;
        }

        let roundUpHeight = centre.height + (this.terraceSpacing / 2);
        if (roundUpHeight != (centre.terrace + 1) * this.terraceSpacing) {
          continue;
        }

        for (let i in coordOffsets) {
          let offset: Point2D = coordOffsets[i];
          let neighbour: TerrainAttributes =
            this.surface.at(centre.x + offset.x, centre.y + offset.y);
          let nextNeighbour: TerrainAttributes =
            this.surface.at(neighbour.x + offset.x, neighbour.y + offset.y);
          if (!neighbour.fixed && !nextNeighbour.fixed &&
              neighbour.terrace == centre.terrace + 1 &&
              neighbour.terrace == nextNeighbour.terrace) {
            neighbour.shape = ramps[i];
            neighbour.fixed = true;
            nextNeighbour.fixed = true;
            totalRamps++;
          }
        }
      }
    }
  }

  setEdges(): void {
    for (let y = 0; y < this.surface.depth; y++) {
      for (let x = 0; x < this.surface.width; x++) {
        let centre = this.surface.at(x, y);
        if (centre.type == TerrainType.Water) {
          continue;
        }

        let neighbours = this.surface.getNeighbours(x, y);
        let shapeType = centre.shape;
        let northEdge: boolean = false;
        let eastEdge: boolean = false;
        let southEdge: boolean = false;
        let westEdge: boolean = false;

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
          southEdge = southEdge || neighbour.y > centre.y;
          eastEdge = eastEdge || neighbour.x > centre.x;
          westEdge = westEdge || neighbour.x < centre.x;
          if (northEdge && eastEdge && southEdge && westEdge)
            break;
        }

        if (shapeType == TerrainShape.Flat) {
          if (northEdge && eastEdge && southEdge && westEdge) {
            shapeType = TerrainShape.FlatAloneOut;
          } else if (northEdge && eastEdge && westEdge) {
            shapeType = TerrainShape.FlatNorthOut;
          } else if (northEdge && eastEdge && southEdge) {
            shapeType = TerrainShape.FlatEastOut;
          } else if (eastEdge && southEdge && westEdge) {
            shapeType = TerrainShape.FlatSouthOut;
          } else if (southEdge && westEdge && northEdge) {
            shapeType = TerrainShape.FlatWestOut;
          } else if (northEdge && eastEdge) {
            shapeType = TerrainShape.FlatNorthEast;
          } else if (northEdge && westEdge) {
            shapeType = TerrainShape.FlatNorthWest;
          } else if (northEdge) {
            shapeType = TerrainShape.FlatNorth;
          } else if (southEdge && eastEdge) {
            shapeType = TerrainShape.FlatSouthEast;
          } else if (southEdge && westEdge) {
            shapeType = TerrainShape.FlatSouthWest;
          } else if (southEdge) {
            shapeType = TerrainShape.FlatSouth;
          } else if (eastEdge) {
            shapeType = TerrainShape.FlatEast;
          } else if (westEdge) {
            shapeType = TerrainShape.FlatWest;
          }
        } else if (shapeType == TerrainShape.RampUpNorth && eastEdge) {
          if (Terrain.isSupportedShape(centre.type, TerrainShape.RampUpNorthEdge)) {
            shapeType = TerrainShape.RampUpNorthEdge;
          }
        } else if (shapeType == TerrainShape.RampUpEast && northEdge) {
          if (Terrain.isSupportedShape(centre.type, TerrainShape.RampUpEastEdge)) {
            shapeType = TerrainShape.RampUpEastEdge;
          }
        } else if (shapeType == TerrainShape.RampUpSouth && eastEdge) {
          if (Terrain.isSupportedShape(centre.type, TerrainShape.RampUpSouthEdge)) {
            shapeType = TerrainShape.RampUpSouthEdge;
          }
        } else if (shapeType == TerrainShape.RampUpWest && northEdge) {
          if (Terrain.isSupportedShape(centre.type, TerrainShape.RampUpWestEdge)) {
            shapeType = TerrainShape.RampUpWestEdge;
          }
        }

        // Fixup the sides of the map.
        if (centre.terrace > 0 && shapeType == TerrainShape.Flat &&
            neighbours.length != 8) {
          shapeType = TerrainShape.Wall;
        }

        // If we don't support edge, try the basic wall tile and use the
        // default wall type.
        if (isFlat(shapeType) && isEdge(shapeType)) {
          if (!Terrain.isSupportedShape(centre.type, shapeType)) {
            //centre.type = this.config.wall;
            shapeType = TerrainShape.Wall;
          }
        }

        // If we have a unsupported shape, such as a ramp, check whether we have
        // the ramp shape for a default terrain type.
        if (!isFlat(shapeType) && !Terrain.isSupportedShape(centre.type, shapeType)) {
          if (Terrain.isSupportedShape(this.config.floor, shapeType)) {
            centre.type = this.config.floor;
          } else if (Terrain.isSupportedShape(this.config.wall, shapeType)) {
            centre.type = this.config.wall;
          }
        }

        // And if that fails, fallback to the base flat tile.
        if (!Terrain.isSupportedShape(centre.type, shapeType)) {
          shapeType = TerrainShape.Flat;
        }
        centre.shape = shapeType;
      }
    }
  }

  calcRelativeHeight(x: number, y: number): number {
    let neighbours = this.surface.getNeighbours(x, y);
    let relativeHeight: number = 0;
    let centre = this.surface.at(x, y);
   
    for (let neighbour of neighbours) { 
      console.assert(neighbour.terrace >= 0,
                     "Found neighbour with negative terrace!", neighbour.terrace);
      const height = centre.terrace - neighbour.terrace;
      relativeHeight = Math.max(height, relativeHeight);
    }
    console.assert(relativeHeight <= this.config.numTerraces,
                   "impossible relative height:", relativeHeight,
                   "\ncentre:", centre);
    return relativeHeight;
  }

  addRain(towards: Direction, water: number, waterLine: number): void {
    let rain = new Rain(this.surface, waterLine, water, towards);
    rain.run();
    let blurred =
      gaussianBlur(rain.moistureGrid, this.surface.width, this.surface.depth);
    for (let y = 0; y < this.surface.depth; y++) {
      for (let x = 0; x < this.surface.width; x++) {
        let surface = this.surface.at(x, y);
        surface.moisture = blurred[y][x]; //rain.moistureAt(x, y);
      }
    }
  }

  setBiomes(): void {
    const moistureRange = 6
    for (let y = 0; y < this.surface.depth; y++) {
      for (let x = 0; x < this.surface.width; x++) {
        let surface = this.surface.at(x, y);
        let biome: Biome = Biome.Water;
        let terrain: TerrainType = TerrainType.Water;
        let moisturePercent =
          Math.min(1, surface.moisture / moistureRange);
        // Split into six biomes based on moisture.
        let moistureScaled = Math.floor(5 * moisturePercent);
        console.log('surface moisture scaled', surface.moisture, moistureScaled);

        if (surface.height <= this.config.waterLine) {
          biome = Biome.Water;
          terrain = TerrainType.Water;
        } else if (surface.height >= this.config.uplandThreshold) {
          switch(moistureScaled) {
            default:
              console.error('unhandled moisture scale');
              break;
            case 0:
              biome = Biome.Rock;
              terrain = TerrainType.Upland0;
              break;
            case 1:
              biome = Biome.Tundra;
              terrain = TerrainType.Upland1;
              break;
            case 2:
              biome = Biome.AlpineGrassland;
              terrain = TerrainType.Upland2;
              break;
            case 3:
              biome = Biome.AlpineMeadow;
              terrain = TerrainType.Upland3;
              break;
            case 4:
              biome = Biome.AlpineForest;
              terrain = TerrainType.Upland4;
              break;
            case 5:
              biome = Biome.Taiga;
              terrain = TerrainType.Upland5;
              break;
          }
        } else {
          switch(moistureScaled) {
            default:
              console.error('unhandled moisture scale');
              break;
            case 0:
              biome = Biome.Desert;
              terrain = TerrainType.Lowland0;
              break;
            case 1:
              biome = Biome.Grassland;
              terrain = TerrainType.Lowland1;
              break;
            case 2:
              biome = Biome.Shrubland;
              terrain = TerrainType.Lowland2;
              break;
            case 3:
              biome = Biome.MoistForest;
              terrain = TerrainType.Lowland3;
              break;
            case 4:
              biome = Biome.WetForest;
              terrain = TerrainType.Lowland4;
              break;
            case 5:
              biome = Biome.RainForest;
              terrain = TerrainType.Lowland5;
              break;
          }
        }
        // Only change the type if it's supported, otherwise we'll just
        // fallback to the default which is set in the constructor.
        // TODO: What about default wall tiles?
        if (Terrain.isSupportedType(terrain)) {
          surface.type = terrain;
        } else {
          console.log("unsupported biome terrain type:", getTypeName(terrain));
        }
        surface.biome = biome;
      }
    }
  }

  setFeatures(): void {
    for (let y = 0; y < this.surface.depth; y++) {
      for (let x = 0; x < this.surface.width; x++) {

        let surface = this.surface.at(x, y);
        // Add shoreline features on beach tiles.
        if (isFlat(surface.shape)) {
          if (surface.biome == Biome.Beach) {
            let neighbours = this.surface.getNeighbours(surface.x, surface.y);
            for (let neighbour of neighbours) {
              if (neighbour.biome != Biome.Water) {
                continue;
              }
              switch (getDirectionFromPoints(surface.pos, neighbour.pos)) {
              default:
                break;
              case Direction.North:
                surface.features |= TerrainFeature.ShorelineNorth;
                break;
              case Direction.East:
                surface.features |= TerrainFeature.ShorelineEast;
                break;
              case Direction.South:
                surface.features |= TerrainFeature.ShorelineSouth;
                break;
              case Direction.West:
                surface.features |= TerrainFeature.ShorelineWest;
                break;
              }
            }
          } else if (surface.biome == Biome.Marshland) {
            surface.features |= TerrainFeature.Mud;
            surface.features |= TerrainFeature.WetGrass;
          } else if (surface.biome == Biome.Grassland) {
            surface.features |= TerrainFeature.DryGrass;
          } else if (surface.biome == Biome.Tundra) {
            surface.features |= TerrainFeature.DryGrass;
          }
        }
      }
    }
  }
}
