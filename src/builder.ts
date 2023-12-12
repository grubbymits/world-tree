import {
  Terrain,
  TerrainGridDescriptorImpl,
  TerrainGrid,
  TerrainShape,
  TerrainType,
} from "./terrain.ts";
import { Dimensions } from "./physics.ts";
import { Direction, Navigation } from "./navigation.ts";
import { Point2D } from "./geometry.ts";
import { ContextImpl } from "./context.ts";
import { Biome, BiomeConfig, generateBiomeGrid, getBiomeName, addRain } from "./biomes.ts";

function buildBiomes(biomeConfig: BiomeConfig,
                     moistureGrid: Array<Array<number>>,
                     heightGrid: Array<Array<number>>,
                     terraceGrid: Array<Array<number>>): Array<Array<Biome>> {
  if (biomeConfig.rainfall > 0) {
    moistureGrid = addRain(
      heightGrid,
      terraceGrid,
      biomeConfig.rainDirection,
      biomeConfig.rainfall,
      biomeConfig.waterLine
    );
  }
  return generateBiomeGrid(biomeConfig, heightGrid, moistureGrid);
}

export function normaliseHeightGrid(heightGrid: Array<Array<number>>,
                                    numTerraces: number): number {
  // Normalise heights, minimum = 0;
  let minHeight = 0;
  let maxHeight = 0;
  for (let y = 0; y < heightGrid.length; y++) {
    const row: Array<number> = heightGrid[y];
    const max = row.reduce(function (a, b) {
      return Math.max(a, b);
    });
    const min = row.reduce(function (a, b) {
      return Math.min(a, b);
    });
    minHeight = Math.min(minHeight, min);
    maxHeight = Math.max(maxHeight, max);
  }
  if (minHeight < 0) {
    minHeight = Math.abs(minHeight);
    const cellsY = heightGrid.length;
    const cellsX = heightGrid[0].length;
    for (let y = 0; y < cellsY; y++) {
      for (let x = 0; x < cellsX; x++) {
        heightGrid[y][x] += minHeight;
      }
    }
    maxHeight += minHeight;
  }
  const terraceSpacing = maxHeight / numTerraces;
  return terraceSpacing;
}

export function setTerraces(heightGrid: Array<Array<number>>,
                            terraceSpacing: number): Array<Array<number>> {
  const cellsY = heightGrid.length;
  const cellsX = heightGrid[0].length;
  const terraceGrid = new Array<Array<number>>();
  for (let y = 0; y < cellsY; y++) {
    terraceGrid[y] = new Array<number>();
    for (let x = 0; x < cellsX; x++) {
      const surfaceHeight = heightGrid[y][x];
      terraceGrid[y][x] =
        Math.floor(surfaceHeight / terraceSpacing);
    }
  }
  return terraceGrid;
}

export class TerrainBuilder {
  private readonly _terraceSpacing: number;
  private readonly _depth: number;
  private readonly _width: number;

  private _biomeGrid = new Array<Array<Biome>>();
  private _terraceGrid: Array<Array<number>> =
    new Array<Array<number>>();
  private _moistureGrid: Array<Array<number>> =
    new Array<Array<number>>();
  private _typeGrid: Array<Array<TerrainType>> =
    new Array<Array<TerrainType>>();
  private _shapeGrid: Array<Array<TerrainShape>> =
    new Array<Array<TerrainShape>>();

  constructor(
    private _heightGrid: Array<Array<number>>,
    private readonly _numTerraces: number,
    private readonly _floor: TerrainType,
    private readonly _wall: TerrainType,
    private readonly _tileDimensions: Dimensions
  ) {
    this._depth = this.heightGrid.length;
    this._width = this.heightGrid[0].length;
    this._terraceSpacing =
      normaliseHeightGrid(this.heightGrid, this.numTerraces);
    this._terraceGrid = setTerraces(this.heightGrid, this.terraceSpacing);

    for (let y = 0; y < this.depth; y++) {
      this._moistureGrid[y] = new Array<number>();
      this._shapeGrid[y] = new Array<TerrainShape>();
      this._typeGrid[y] = new Array<TerrainType>();
      for (let x = 0; x < this.width; x++) {
        this.shapeGrid[y][x] = TerrainShape.Flat;
        this.typeGrid[y][x] = this.floor;
      }
    }
  }

  get numTerraces(): number {
    return this._numTerraces;
  }
  get wall(): TerrainType {
    return this._wall;
  }
  get floor(): TerrainType {
    return this._floor;
  }
  get tileDimensions(): Dimensions {
    return this._tileDimensions;
  }
  get terraceSpacing(): number {
    return this._terraceSpacing;
  }
  get width(): number {
    return this._width;
  }
  get depth(): number {
    return this._depth;
  }
  get heightGrid(): Array<Array<number>> {
    return this._heightGrid;
  }
  get moistureGrid(): Array<Array<number>> {
    return this._moistureGrid;
  }
  get terraceGrid(): Array<Array<number>> {
    return this._terraceGrid;
  }
  get shapeGrid(): Array<Array<TerrainShape>> {
    return this._shapeGrid;
  }
  get typeGrid(): Array<Array<TerrainType>> {
    return this._typeGrid;
  }
  get biomeGrid(): Array<Array<Biome>> {
    return this._biomeGrid;
  }

  terraceAt(x: number, y: number): number {
    console.assert(
      x >= 0 && x < this.width && y >= 0 && y < this.depth
    );
    return this._terraceGrid[y][x];
  }

  terrainTypeAt(x: number, y: number): TerrainType {
    console.assert(
      x >= 0 && x < this.width && y >= 0 && y < this.depth
    );
    return this._typeGrid[y][x];
  }

  terrainShapeAt(x: number, y: number): TerrainShape {
    console.assert(
      x >= 0 && x < this.width && y >= 0 && y < this.depth
    );
    return this._shapeGrid[y][x];
  }

  moistureAt(x: number, y: number): number {
    console.assert(
      x >= 0 && x < this.width && y >= 0 && y < this.depth
    );
    return this._moistureGrid[y][x];
  }

  isFlatAt(x: number, y: number): boolean {
    console.assert(
      x >= 0 && x < this.width && y >= 0 && y < this.depth
    );
    return Terrain.isFlat(this._shapeGrid[y][x]);
  }

  biomeAt(x: number, y: number): Biome {
    console.assert(
      x >= 0 && x < this.width && y >= 0 && y < this.depth
    );
    return this._biomeGrid[y][x];
  }

  heightAt(x: number, y: number): number {
    console.assert(
      x >= 0 && x < this.width && y >= 0 && y < this.depth
    );
    return this._heightGrid[y][x];
  }

  generateBiomes(config: BiomeConfig): void {
    this._biomeGrid = buildBiomes(
      config,
      this.moistureGrid,
      this.heightGrid,
      this.terraceGrid
    );
    setTerrainTypes(this.biomeGrid, this.typeGrid);
  }

  generateMap(context: ContextImpl): void {
    setRamps(this._heightGrid, this._terraceGrid, this._shapeGrid,
             this._terraceSpacing, 0);
    setEdges(this._terraceGrid, this._shapeGrid, this._typeGrid, this.floor,
             this.wall, this.wall != this.floor);

    const descriptor = new TerrainGridDescriptorImpl(
      this.terraceGrid,
      this.typeGrid,
      this.shapeGrid,
      this.tileDimensions,
      this.width,
      this.depth,
      this.numTerraces
    );

    new TerrainGrid(
      context,
      descriptor
    );
  }
}

export function setRamps(heightGrid: Array<Array<number>>,
                         terraceGrid: Array<Array<number>>,
                         shapeGrid: Array<Array<TerrainShape>>,
                         terraceSpacing: number,
                         rampTolerance: number): number {
  const coordOffsets: Array<Point2D> = [
    new Point2D(0, 1),
    new Point2D(-1, 0),
    new Point2D(0, -1),
    new Point2D(1, 0),
  ];

  const ramps: Array<TerrainShape> = [
    TerrainShape.RampUpSouth,
    TerrainShape.RampUpWest,
    TerrainShape.RampUpNorth,
    TerrainShape.RampUpEast,
  ];
  const depth = heightGrid.length;
  const width = heightGrid[0].length;

  const isRampHeight = function(centreHeight: number, centreTerrace: number,
                                terraceSpacing: number) {
    const roundUpHeight = centreHeight + terraceSpacing / 2;
    const lower = roundUpHeight - rampTolerance;
    const upper = roundUpHeight + rampTolerance;
    const middle = (centreTerrace + 1) * terraceSpacing;
    return middle >= lower && middle <= upper;
  };

  // Find locations that have heights that sit exactly between two terraces
  // and then find their adjacent locations that are higher terraces. Set
  // those locations to be ramps.
  let totalRamps = 0;
  let fixed = new Map<number, Set<number>>();
  for (let y = depth - 3; y > 1; y--) {
    for (let x = 2; x < width - 2; x++) {
      const centreShape: TerrainShape = shapeGrid[y][x];
      if (!Terrain.isFlat(centreShape)) {
        continue;
      }

      const centreHeight = heightGrid[y][x];
      const centreTerrace = terraceGrid[y][x];

      if (!isRampHeight(centreHeight, centreTerrace, terraceSpacing)) {
        continue;
      }

      for (const i in coordOffsets) {
        const offset: Point2D = coordOffsets[i];
        const neighbourX = x + offset.x;
        const neighbourY = y + offset.y;

        if (fixed.has(neighbourX) &&
            fixed.get(neighbourX)!.has(neighbourY)) {
          continue;
        }
        const nextNeighbourX = neighbourX + offset.x;
        const nextNeighbourY = neighbourY + offset.y;
        if (fixed.has(nextNeighbourX) &&
            fixed.get(nextNeighbourX)!.has(nextNeighbourY)) {
          continue;
        }
        const neighbourTerrace = terraceGrid[neighbourY][neighbourX];
        const nextNeighbourTerrace = terraceGrid[nextNeighbourY][nextNeighbourX];
        if (
          neighbourTerrace == centreTerrace + 1 &&
          neighbourTerrace == nextNeighbourTerrace
        ) {
          shapeGrid[neighbourY][neighbourX] = ramps[i];
          if (fixed.has(neighbourX)) {
            fixed.get(neighbourX)!.add(neighbourY);
          } else {
            fixed.set(neighbourX, new Set<number>([neighbourY]));
          }
          if (fixed.has(nextNeighbourX)) {
            fixed.get(nextNeighbourX)!.add(nextNeighbourY);
          } else {
            fixed.set(nextNeighbourX, new Set<number>([nextNeighbourY]));
          }
          totalRamps++;
        }
      }
    }
  }
  return totalRamps;
}

export function setEdges(terraceGrid: Array<Array<number>>,
                         shapeGrid: Array<Array<TerrainShape>>,
                         typeGrid: Array<Array<TerrainType>>,
                         floor: TerrainType,
                         wall: TerrainType,
                         indoors: boolean): void {
  const depth = terraceGrid.length;
  const width = terraceGrid[0].length;
  const inbounds = function(x: number, y: number): boolean {
    return x >= 0 && x < width &&
           y >= 0 && y < depth;
  };

  for (let y = 0; y < depth; y++) {
    for (let x = 0; x < width; x++) {
      if (typeGrid[y][x] == TerrainType.Water) {
        continue;
      }
      const centrePos = new Point2D(x, y);
      const centreTerrace = terraceGrid[y][x];
      let centreShape = shapeGrid[y][x];
      let centreType = typeGrid[y][x];
      let shapeType = shapeGrid[y][x];
      let northEdge = false;
      let eastEdge = false;
      let southEdge = false;
      let westEdge = false;
      const isPerimeter = x == 0 || x == width -1 ||
                          y == 0 || y == depth - 1; 

      for (const offset of Navigation.neighbourOffsets) {
        const neighbourX = x + offset.x;
        const neighbourY = y + offset.y;
        if (!inbounds(neighbourX, neighbourY)) {
          continue;
        }
        const neighbourPos = new Point2D(neighbourX, neighbourY);
        const neighbourTerrace = terraceGrid[neighbourY][neighbourX];
        const neighbourShape = shapeGrid[neighbourY][neighbourX];

        // Only look at lower neighbours
        if (neighbourTerrace > centreTerrace) {
          continue;
        }
        // Don't look at diagonal neighbours.
        if (neighbourPos.x != x && neighbourPos.y != y) {
          continue;
        }

        if (
          neighbourTerrace == centreTerrace &&
          Terrain.isFlat(centreShape) == Terrain.isFlat(neighbourShape)
        ) {
          continue;
        }

        // We want to enable edges, just not at the point where the ramp
        // joins the upper terrace.
        if (!Terrain.isFlat(neighbourShape)) {
          const direction = Navigation.getDirectionFromPoints(neighbourPos, centrePos);
          switch (direction) {
          default:
            break;
          case Direction.North:
            if (neighbourShape == TerrainShape.RampUpNorth) continue;
            break;
          case Direction.East:
            if (neighbourShape == TerrainShape.RampUpEast) continue;
            break;
          case Direction.South:
            if (neighbourShape == TerrainShape.RampUpSouth) continue;
            break;
          case Direction.West:
            if (neighbourShape == TerrainShape.RampUpWest) continue;
            break;
          }
        }

        northEdge = northEdge || neighbourY < y;
        southEdge = southEdge || neighbourY > y;
        eastEdge = eastEdge || neighbourX > x;
        westEdge = westEdge || neighbourX < x;
        if (northEdge && eastEdge && southEdge && westEdge) {
          break;
        }
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
        } else if (southEdge && eastEdge) {
          shapeType = TerrainShape.FlatSouthEast;
        } else if (southEdge && westEdge) {
          shapeType = TerrainShape.FlatSouthWest;
        } else if (southEdge && northEdge) {
          shapeType = TerrainShape.FlatNorthSouth;
        } else if (eastEdge && westEdge) {
          shapeType = TerrainShape.FlatEastWest;
        } else if (northEdge) {
          shapeType = TerrainShape.FlatNorth;
        } else if (southEdge) {
          shapeType = TerrainShape.FlatSouth;
        } else if (eastEdge) {
          shapeType = TerrainShape.FlatEast;
        } else if (westEdge) {
          shapeType = TerrainShape.FlatWest;
        }
      } else if (shapeType == TerrainShape.RampUpNorth && eastEdge) {
        if (
          Terrain.isSupportedShape(centreType, TerrainShape.RampUpNorthEdge)
        ) {
          shapeType = TerrainShape.RampUpNorthEdge;
        }
      } else if (shapeType == TerrainShape.RampUpEast && northEdge) {
        if (
          Terrain.isSupportedShape(centreType, TerrainShape.RampUpEastEdge)
        ) {
          shapeType = TerrainShape.RampUpEastEdge;
        }
      } else if (shapeType == TerrainShape.RampUpSouth && eastEdge) {
        if (
          Terrain.isSupportedShape(centreType, TerrainShape.RampUpSouthEdge)
        ) {
          shapeType = TerrainShape.RampUpSouthEdge;
        }
      } else if (shapeType == TerrainShape.RampUpWest && northEdge) {
        if (
          Terrain.isSupportedShape(centreType, TerrainShape.RampUpWestEdge)
        ) {
          shapeType = TerrainShape.RampUpWestEdge;
        }
      }

      // Fixup the sides of the map.
      if (
        shapeType == TerrainShape.Flat && isPerimeter
      ) {
        if (x == 0 &&  y == 0) {
          shapeType = TerrainShape.FlatNorthWest;
        } else if (x == 0 &&  y == depth - 1) {
          shapeType = TerrainShape.FlatSouthWest;
        } else if (x == width - 1 && y == 0) {
          shapeType = TerrainShape.FlatNorthEast;
        } else if (x == 0) {
          shapeType = TerrainShape.FlatWest;
        } else if (y == 0) {
          shapeType = TerrainShape.FlatNorth;
        } else if (x == width - 1 && y == depth - 1) {
          shapeType = TerrainShape.FlatSouthEast;
        } else if (x == width - 1) {
          shapeType = TerrainShape.FlatEast;
        } else if (y == depth - 1) {
          shapeType = TerrainShape.FlatSouth;
        }
      }

      // If we don't support edge, try the basic wall tile and use the
      // default wall type.
      if (Terrain.isFlat(shapeType) && Terrain.isEdge(shapeType)) {
        if (indoors) {
          centreType = wall;
        }
        if (!Terrain.isSupportedShape(centreType, shapeType)) {
          switch (shapeType) {
            default:
              shapeType = TerrainShape.Wall;
              break;
            case TerrainShape.FlatNorthOut:
              if (
                Terrain.isSupportedShape(centreType, TerrainShape.FlatNorth)
              ) {
                shapeType = TerrainShape.FlatNorth;
              } else {
                shapeType = TerrainShape.Wall;
              }
              break;
            case TerrainShape.FlatNorthEast:
            case TerrainShape.FlatSouthEast:
              if (
                Terrain.isSupportedShape(centreType, TerrainShape.FlatEast)
              ) {
                shapeType = TerrainShape.FlatEast;
              } else {
                shapeType = TerrainShape.Wall;
              }
              break;
            case TerrainShape.FlatNorthWest:
              if (
                Terrain.isSupportedShape(
                  centreType,
                  TerrainShape.FlatWestOut
                )
              ) {
                shapeType = TerrainShape.FlatWestOut;
              } else {
                shapeType = TerrainShape.Wall;
              }
              break;
            case TerrainShape.FlatSouthWest:
              if (
                Terrain.isSupportedShape(centreType, TerrainShape.FlatWest)
              ) {
                shapeType = TerrainShape.FlatWest;
              } else {
                shapeType = TerrainShape.Wall;
              }
              break;
          }
        }
      }

      // Avoid introducing Wall tiles for the floor around the edge of the
      // map.
      if (centreTerrace == 0 && shapeType == TerrainShape.Wall) {
        shapeType = TerrainShape.Flat;
      }

      // If we have a unsupported shape, such as a ramp, check whether we have
      // the ramp shape for a default terrain type.
      if (
        !Terrain.isFlat(shapeType) &&
        !Terrain.isSupportedShape(centreType, shapeType)
      ) {
        if (Terrain.isSupportedShape(floor, shapeType)) {
          centreType = floor;
        } else if (Terrain.isSupportedShape(wall, shapeType)) {
          centreType = wall;
        }
      }

      // And if that fails, fallback to the base flat tile.
      if (!Terrain.isSupportedShape(centreType, shapeType)) {
        shapeType = TerrainShape.Flat;
      }
      typeGrid[y][x] = centreType;
      shapeGrid[y][x] = shapeType;
    }
  }
}

export function setTerrainTypes(biomeGrid: Array<Array<Biome>>,
                                typeGrid: Array<Array<TerrainType>>): void {
  const cellsY = biomeGrid.length;
  const cellsX = biomeGrid[0].length;
  for (let y = 0; y < cellsY; y++) {
    for (let x = 0; x < cellsX; x++) {
      const biome = biomeGrid[y][x];
      let terrain = TerrainType.Water;
      switch (biome) {
        default:
          console.error("unhandled biome:", getBiomeName(biome));
          break;
        case Biome.Water:
          break;
        case Biome.Rock:
          terrain = TerrainType.Upland0;
          break;
        case Biome.Tundra:
          terrain = TerrainType.Upland1;
          break;
        case Biome.AlpineGrassland:
          terrain = TerrainType.Upland2;
          break;
        case Biome.AlpineMeadow:
          terrain = TerrainType.Upland3;
          break;
        case Biome.AlpineForest:
          terrain = TerrainType.Upland4;
          break;
        case Biome.Taiga:
          terrain = TerrainType.Upland5;
          break;
        case Biome.Desert:
          terrain = TerrainType.Lowland0;
          break;
        case Biome.Grassland:
          terrain = TerrainType.Lowland1;
          break;
        case Biome.Shrubland:
          terrain = TerrainType.Lowland2;
          break;
        case Biome.MoistForest:
          terrain = TerrainType.Lowland3;
          break;
        case Biome.WetForest:
          terrain = TerrainType.Lowland4;
          break;
        case Biome.RainForest:
          terrain = TerrainType.Lowland5;
          break;
      }
      // Only change the type if it's supported, otherwise we'll just
      // fallback to the default which is set in the constructor.
      // TODO: What about default wall tiles?
      if (Terrain.isSupportedType(terrain)) {
        typeGrid[y][x] = terrain;
      } else {
        console.log(
          "unsupported biome terrain type:",
          Terrain.getTypeName(terrain)
        );
      }
    }
  }
}
