
import { SquareGrid } from "./map.js"
import { Terrain,
         TerrainShape,
         TerrainType,
         TerrainFeature,
         isFlat,
         getTypeName,
         getShapeName } from "./terrain.js"
import { Rain } from "./weather.js"
import { Dimensions,
         Direction,
         getDirection,
         getDirectionName } from "./physics.js"
import { Point } from "./graphics.js"
import { Context } from "./context.js"

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


export class TerrainAttributes {
  private _moisture: number;
  private _terrace: number;
  private _biome: Biome;
  private _type: TerrainType;
  private _shape: TerrainShape;
  private _features: number;
  
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
  get pos(): Point { return new Point(this._x, this._y); }
  get height(): number { return this._height; }
  get terrace(): number { return this._terrace; }
  get type(): TerrainType { return this._type; }
  get shape(): TerrainShape { return this._shape; }
  get features(): number { return this._features; }
  get moisture(): number { return this._moisture; }
  get biome(): Biome { return this._biome; }

  set moisture(m: number) { this._moisture = m; }
  set terrace(t: number) { this._terrace = t; }
  set type(t: TerrainType) { this._type = t; }
  set shape(s: TerrainShape) { this._shape = s; }
  set features(f: number) { this._features |= f; }
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
        if (x == centreX && y == centreY) {
          continue;
        }
        neighbours.push(this._surface[y][x]);
      }
    }
    return neighbours;
  }
}

export class TerrainBuilder {
  protected _surface: Surface;
  protected readonly _terraceSpacing: number;
  protected readonly _waterLine: number;

  constructor(width: number,
              depth: number,
              heightMap: Array<Array<number>>,
              protected readonly _numTerraces: number,
              protected readonly _hasWater: boolean,
              defaultType: TerrainType,
              physicalDims: Dimensions) {
    Terrain.init(physicalDims);

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
    console.log("min height:", minHeight);
    console.log("max height:", maxHeight);
    if (minHeight < 0) {
      minHeight = Math.abs(minHeight);
      console.log("adjusting to make all heights non-negative");
      for (let y = 0; y < depth; y++) {
        for (let x = 0; x < width; x++) {
          heightMap[y][x] += minHeight;
        }
      }
      maxHeight += minHeight;
    }
    this._terraceSpacing = maxHeight / _numTerraces;
    this._waterLine = 4 * this._terraceSpacing / 5;
    console.log("Terrain builder",
                "- with a ceiling of:", maxHeight, "\n",
                "- ", _numTerraces, "terraces\n",
                "- ", this._terraceSpacing, "terrace spacing");

    this._surface = new Surface(width, depth);
    this._surface.init(heightMap);

    console.log("calculating terraces");
    // Calculate the terraces.
    for (let y = 0; y < this._surface.depth; y++) {
      for (let x = 0; x < this._surface.width; x++) {
        let surface = this._surface.at(x, y);
        surface.terrace = Math.floor(surface.height / this._terraceSpacing);
        surface.shape = TerrainShape.Flat;
        surface.type = defaultType;
        console.assert(surface.terrace <= this._numTerraces && surface.terrace >= 0,
                       "terrace out of range:", surface.terrace);
      }
    }
  }

  generateMap(context: Context): SquareGrid {
    this.setEdges();

    let worldTerrain =
      new SquareGrid(context, this._surface.width, this._surface.depth);

    console.log("adding surface terrain entities"); 
    for (let y = 0; y < this._surface.depth; y++) {
      for (let x = 0; x < this._surface.width; x++) {
        let surface = this._surface.at(x, y);
        // Add terrain objects that will be visible.
        console.assert(surface.terrace <= this._numTerraces && surface.terrace >= 0,
                       "terrace out-of-range", surface.terrace);
        worldTerrain.addRaisedTerrain(x, y, surface.terrace,
                                      surface.type, surface.shape,
                                      surface.features);
      }
    }

    console.log("adding subterranean entities");
    // Create a column of visible terrain below the surface tile.
    for (let y = 0; y < this._surface.depth; y++) {
      for (let x = 0; x < this._surface.width; x++) {
        let z = this._surface.at(x, y).terrace;
        let zStop = z - this.calcRelativeHeight(x, y);
        let terrain = worldTerrain.getTerrain(x, y, z)!;
        if (terrain == null) {
          console.error("didn't find terrain in map at", x, y, z);
        }
        while (z > zStop) {
          z--;
          worldTerrain.addRaisedTerrain(x, y, z, terrain.type,
                                        TerrainShape.Flat,
                                        TerrainFeature.None);
        }
      }
    }
    return worldTerrain;
  }

  setFeatures(): void { }

  setBiomes(wetLimit: number, dryLimit: number, treeLimit: number): void {
    console.log("setBiomes with\n",
                "- wetLimit:", wetLimit, "\n",
                "- dryLimit:", dryLimit, "\n",
                "- treeLimit:", treeLimit, "\n");
    if (this._hasWater) {
      for (let y = 0; y < this._surface.depth; y++) {
        for (let x = 0; x < this._surface.width; x++) {
          let surface = this._surface.at(x, y);
          if (surface.terrace == 0) {
            surface.biome = Biome.Water;
            surface.type = TerrainType.Water;
          }
        }
      }
    }
  }

  setEdges(): void {
    for (let y = 0; y < this._surface.depth; y++) {
      for (let x = 0; x < this._surface.width; x++) {
        let centre = this._surface.at(x, y);
        if (centre.type == TerrainType.Water) {
          continue;
        }

        let neighbours = this._surface.getNeighbours(x, y);
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
            if (Terrain.isSupportedShape(centre.type, TerrainShape.FlatSouthWest)) {
              shapeType = TerrainShape.FlatSouthWest;
            } else {
              shapeType = TerrainShape.Wall;
            }
          } else if (southEdge) {
            if (Terrain.isSupportedShape(centre.type, TerrainShape.FlatSouth)) {
              shapeType = TerrainShape.FlatSouth;
            } else {
              shapeType = TerrainShape.Wall;
            }
          } else if (eastEdge) {
            shapeType = TerrainShape.FlatEast;
          } else if (westEdge) {
            if (Terrain.isSupportedShape(centre.type, TerrainShape.FlatWest)) {
              shapeType = TerrainShape.FlatWest;
            } else {
              shapeType = TerrainShape.Wall;
            }
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

        if (!Terrain.isSupportedShape(centre.type, shapeType)) {
          console.log("unsupported shape for",
                      getTypeName(centre.type), getShapeName(shapeType));
          shapeType = TerrainShape.Flat;
        }
        centre.shape = shapeType;
      }
    }
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
    console.assert(relativeHeight <= this._numTerraces,
                   "impossible relative height:", relativeHeight,
                   "\ncentre:", centre);
    return relativeHeight;
  }
}

export class OpenTerrainBuilder extends TerrainBuilder {
  constructor(width: number,
              depth: number,
              heightMap: Array<Array<number>>,
              numTerraces: number,
              hasWater: boolean,
              defaultType: TerrainType,
              physicalDims: Dimensions) {
    super(width, depth, heightMap, numTerraces, hasWater, defaultType, physicalDims);
  }
  
  setShapes(): void {
    console.log("adding ramps");
    const filterDepth: number = 3;
    const coordOffsets: Array<Point> = [ new Point(0, -1),
                                         new Point(1, 0),
                                         new Point(0, 1),
                                         new Point(-1, 0) ];

    const diagOffsets: Array<Array<Point>> =
      [ [ new Point(-1, -1), new Point (1, -1) ],
      [ new Point(1, -1), new Point(1, 1) ],
      [ new Point(-1, 1), new Point(1, 1) ],
      [ new Point(-1, -1), new Point(-1, 1) ]];

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

        for (let i in coordOffsets) {
          let offset: Point = coordOffsets[i];
          let neighbour: TerrainAttributes =
            this._surface.at(x + offset.x, y + offset.y);

          // Don't ramp to ramp!
          if (!isFlat(neighbour.shape)) {
            continue;
          }

          if (centre.terrace == neighbour.terrace) {
            continue;
          }

          // Check that the tile we're ramping to is flanked by two
          // other tiles that are flat and of the same terrace.
          let skip: boolean = false;
          for (let diagNeighbourOffsets of diagOffsets[i]) {
            let diagNeighbour: TerrainAttributes = 
              this._surface.at(x + diagNeighbourOffsets.x,
                               y + diagNeighbourOffsets.y);
            skip = skip || !isFlat(diagNeighbour.shape) ||
                   diagNeighbour.terrace != neighbour.terrace;
          }
          if (skip)
            continue;

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
            if (centre.biome == Biome.Beach) {
              centre.biome = neighbour.biome;
            }
            break;
          }
        }
      }
    }
  }

  addRain(towards: Direction, water: number): void {
    console.log("adding rain towards", getDirectionName(towards));
    // Add moisture:
    // - clouds are added at the 'bottom' of the map and move northwards.
    Rain.init(this._waterLine, this._surface);
    for (let x = 0; x < this._surface.width; x++) {
      Rain.add(x, this._surface.depth - 1, water, towards);
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
      }
    }
  }

  setBiomes(wetLimit: number, dryLimit: number, treeLimit: number): void {
    console.log("setBiomes with\n",
                "- wetLimit:", wetLimit, "\n",
                "- dryLimit:", dryLimit, "\n",
                "- treeLimit:", treeLimit, "\n");

    for (let y = 0; y < this._surface.depth; y++) {
      for (let x = 0; x < this._surface.width; x++) {
        let surface = this._surface.at(x, y);
        let biome: Biome = Biome.Water;
        let terrain: TerrainType = TerrainType.Water;

        if (surface.height <= this._waterLine) {
          biome = Biome.Water;
          terrain = TerrainType.Water;
        } else if (surface.terrace < 1) {
          biome = Biome.Beach;
          terrain = TerrainType.Sand;
        } else if (surface.height > treeLimit) {
          biome = surface.moisture > dryLimit ?
            Biome.Grassland : Biome.Tundra
          terrain = surface.moisture > dryLimit ?
            TerrainType.DryGrass : TerrainType.Rock;
        } else if (surface.moisture < dryLimit) {
          biome = Biome.Desert;
          terrain = TerrainType.Rock;
        } else if (surface.moisture > wetLimit) {
          biome = Biome.Marshland;
          terrain = TerrainType.WetGrass;
        } else {
          biome = Biome.Woodland;
          terrain = TerrainType.Mud;
        }
        if (Terrain.isSupportedType(terrain)) {
          surface.type = terrain;
        }
        surface.biome = biome;
      }
    }
  }

  setFeatures(): void {
    for (let y = 0; y < this._surface.depth; y++) {
      for (let x = 0; x < this._surface.width; x++) {

        let surface = this._surface.at(x, y);
        // Add shoreline features on beach tiles.
        if (isFlat(surface.shape)) {
          if (surface.biome == Biome.Beach) {
            let neighbours = this._surface.getNeighbours(surface.x, surface.y);
            for (let neighbour of neighbours) {
              if (neighbour.biome != Biome.Water) {
                continue;
              }
              switch (getDirection(neighbour.pos, surface.pos)) {
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
          } else if (surface.biome == Biome.Woodland) {
          }
        }
      }
    }
  }
}
