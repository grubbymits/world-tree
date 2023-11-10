import {
  Terrain,
  TerrainGridDescriptorImpl,
  TerrainGrid,
  TerrainShape,
  TerrainType,
} from "./terrain.ts";
import { Rain, addRain } from "./weather.ts";
import { Dimensions } from "./physics.ts";
import { Direction, Navigation } from "./navigation.ts";
import { Point2D } from "./geometry.ts";
import { ContextImpl } from "./context.ts";
import { Biome, BiomeConfig, generateBiomeGrid } from "./biomes.ts";


export class TerrainBuilderConfig {
  private _waterLine = 0;
  private _wetLimit = 0;
  private _dryLimit = 0;
  private _uplandThreshold = 0;
  private _hasWater = false;
  private _hasRamps = false;
  private _hasBiomes = false;
  private _rainfall = 0;
  private _rainDirection: Direction = Direction.North;

  constructor(
    private readonly _numTerraces: number,
    private readonly _defaultFloor: TerrainType,
    private readonly _defaultWall: TerrainType
  ) {
    console.assert(_numTerraces > 0);
  }

  get waterLine(): number {
    return this._waterLine;
  }
  set waterLine(level: number) {
    this._waterLine = level;
  }
  get wetLimit(): number {
    return this._wetLimit;
  }
  set wetLimit(level: number) {
    this._wetLimit = level;
  }
  get rainfall(): number {
    return this._rainfall;
  }
  set rainfall(level: number) {
    this._rainfall = level;
  }
  get uplandThreshold(): number {
    return this._uplandThreshold;
  }
  set uplandThreshold(level: number) {
    this._uplandThreshold = level;
  }
  get rainDirection(): Direction {
    return this._rainDirection;
  }
  set rainDirection(direction: Direction) {
    this._rainDirection = direction;
  }
  get dryLimit(): number {
    return this._dryLimit;
  }
  set dryLimit(level: number) {
    this._dryLimit = level;
  }
  get hasWater(): boolean {
    return this._hasWater;
  }
  set hasWater(enable: boolean) {
    this._hasWater = enable;
  }
  set hasRamps(enable: boolean) {
    this._hasRamps = enable;
  }
  set hasBiomes(enable: boolean) {
    this._hasBiomes = enable;
  }

  get numTerraces(): number {
    return this._numTerraces;
  }
  get floor(): TerrainType {
    return this._defaultFloor;
  }
  get wall(): TerrainType {
    return this._defaultWall;
  }
  get ramps(): boolean {
    return this._hasRamps;
  }
  get biomes(): boolean {
    return this._hasBiomes;
  }
}

export class TerrainBuilder {
  protected readonly _terraceSpacing: number;

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
    private readonly _width: number,
    private readonly _depth: number,
    private _heightGrid: Array<Array<number>>,
    private readonly _config: TerrainBuilderConfig,
    private readonly _tileDimensions: Dimensions
  ) {

    // Normalise heights, minimum = 0;
    let minHeight = 0;
    let maxHeight = 0;
    for (let y = 0; y < this.depth; y++) {
      const row: Array<number> = this.heightGrid[y];
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
      for (let y = 0; y < this.depth; y++) {
        for (let x = 0; x < this.width; x++) {
          this.heightGrid[y][x] += minHeight;
        }
      }
      maxHeight += minHeight;
    }
    this._terraceSpacing = maxHeight / this.config.numTerraces;

    // Calculate the terraces.
    for (let y = 0; y < this.depth; y++) {
      this._terraceGrid[y] = new Array<number>();
      this._moistureGrid[y] = new Array<number>();
      this._shapeGrid[y] = new Array<TerrainShape>();
      this._typeGrid[y] = new Array<TerrainType>();
      for (let x = 0; x < this.width; x++) {
        const surfaceHeight = this.heightAt(x, y);
        this.terraceGrid[y][x] =
          Math.floor(surfaceHeight / this._terraceSpacing);
        this.shapeGrid[y][x] = TerrainShape.Flat;
        this.typeGrid[y][x] = this.config.floor;
      }
    }
  }

  get config(): TerrainBuilderConfig {
    return this._config;
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

  generateMap(context: ContextImpl): TerrainGrid {
    setRamps(this._heightGrid, this._terraceGrid, this._shapeGrid,
             this._terraceSpacing, 0);

    if (this.config.rainfall > 0) {
      this._moistureGrid = addRain(
        this.width,
        this.depth,
        this._heightGrid,
        this._terraceGrid,
        this.config.rainDirection,
        this.config.rainfall,
        this.config.waterLine
      );
    }
    if (this.config.biomes || this.config.hasWater) {
      const biomeConfig = new BiomeConfig(
        this.config.waterLine,
        this.config.wetLimit,
        this.config.dryLimit,
        this.config.uplandThreshold,
        this.heightGrid,
        this.moistureGrid
      );
      this._biomeGrid = generateBiomeGrid(biomeConfig, this.width, this.depth);
      this.setTerrainTypes(this.biomeGrid);
    }
    this.setEdges();
    const descriptor = new TerrainGridDescriptorImpl(
      this.terraceGrid,
      this.typeGrid,
      this.shapeGrid,
      this.tileDimensions,
      this.width,
      this.depth,
      this.config.numTerraces
    );

    const grid = new TerrainGrid(
      context,
      descriptor
    );
    return grid;
  }


  inbounds(x: number, y: number): boolean {
    return x >= 0 && x < this.width &&
           y >= 0 && y < this.depth;
  }

  setEdges(): void {
    for (let y = 0; y < this.depth; y++) {
      for (let x = 0; x < this.width; x++) {
        if (this.terrainTypeAt(x, y) == TerrainType.Water) {
          continue;
        }
        const centrePos = new Point2D(x, y);
        const centreTerrace = this.terraceAt(x, y);
        let centreShape = this.terrainShapeAt(x, y);
        let centreType = this.terrainTypeAt(x, y);
        let shapeType = this.terrainShapeAt(x, y);
        let northEdge = false;
        let eastEdge = false;
        let southEdge = false;
        let westEdge = false;
        const isPerimeter = x == 0 || x == this.width -1 ||
                            y == 0 || y == this.depth - 1; 

        for (const offset of Navigation.neighbourOffsets) {
          const neighbourX = x + offset.x;
          const neighbourY = y + offset.y;
          if (!this.inbounds(neighbourX, neighbourY)) {
            continue;
          }
          const neighbourPos = new Point2D(neighbourX, neighbourY);
          const neighbourTerrace = this.terraceAt(neighbourX, neighbourY);
          const neighbourShape = this.terrainShapeAt(neighbourX, neighbourY);

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
          } else if (x == 0 &&  y == this.depth - 1) {
            shapeType = TerrainShape.FlatSouthWest;
          } else if (x == this.width - 1 && y == 0) {
            shapeType = TerrainShape.FlatNorthEast;
          } else if (x == 0) {
            shapeType = TerrainShape.FlatWest;
          } else if (y == 0) {
            shapeType = TerrainShape.FlatNorth;
          } else if (x == this.width - 1 && y == this.depth - 1) {
            shapeType = TerrainShape.FlatSouthEast;
          } else if (x == this.width - 1) {
            shapeType = TerrainShape.FlatEast;
          } else if (y == this.depth - 1) {
            shapeType = TerrainShape.FlatSouth;
          }
        }

        // If we don't support edge, try the basic wall tile and use the
        // default wall type.
        if (Terrain.isFlat(shapeType) && Terrain.isEdge(shapeType)) {
          // if we not having biomes, use the default wall type.
          if (!this.config.biomes) {
            centreType = this.config.wall;
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
          if (Terrain.isSupportedShape(this.config.floor, shapeType)) {
            centreType = this.config.floor;
          } else if (Terrain.isSupportedShape(this.config.wall, shapeType)) {
            centreType = this.config.wall;
          }
        }

        // And if that fails, fallback to the base flat tile.
        if (!Terrain.isSupportedShape(centreType, shapeType)) {
          shapeType = TerrainShape.Flat;
        }
        this.typeGrid[y][x] = centreType;
        this.shapeGrid[y][x] = shapeType;
      }
    }
  }

  setTerrainTypes(biomeGrid: Array<Array<Biome>>): void {
    for (let y = 0; y < this.depth; y++) {
      for (let x = 0; x < this.width; x++) {
        const biome = biomeGrid[y][x];
        let terrain = TerrainType.Water;
        switch (biome) {
          default:
            console.error("unhandled moisture scale");
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
          this.typeGrid[y][x] = terrain;
        } else {
          console.log(
            "unsupported biome terrain type:",
            Terrain.getTypeName(terrain)
          );
        }
      }
    }
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
