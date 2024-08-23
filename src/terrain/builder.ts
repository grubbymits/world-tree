import {
  Terrain,
  TerrainShape,
  TerrainType,
} from "../terrain.ts";
import {
  PhysicalEntity,
  CuboidEntity,
  RampNorthEntity,
  RampEastEntity,
  RampSouthEntity,
  RampWestEntity,
} from '../entity.ts';
import { Dimensions } from "../physics.ts";
import { Compass, Direction } from "../utils/navigation.ts";
import { Point2D } from "../utils/geometry2d.ts";
import { Point3D } from "../utils/geometry3d.ts";
import { ContextImpl } from "../context.ts";
import { Biome, BiomeConfig, generateBiomeGrid, getBiomeName, addRain } from "./biomes.ts";

export interface TerrainGridDescriptor {
  cellHeightGrid: Array<Array<number>>;
  typeGrid: Array<Array<TerrainType>>;
  shapeGrid: Array<Array<TerrainShape>>;
  biomeGrid: Array<Array<Biome>>;
  tileDimensions: Dimensions;
  cellsX: number;
  cellsY: number;
  cellsZ: number;
}

export class TerrainGridDescriptorImpl implements TerrainGridDescriptor {
  constructor (private readonly _cellHeightGrid: Array<Array<number>>,
               private readonly _typeGrid: Array<Array<TerrainType>>,
               private readonly _shapeGrid: Array<Array<TerrainShape>>,
               private readonly _biomeGrid: Array<Array<Biome>>,
               private readonly _tileDimensions: Dimensions,
               private readonly _cellsX: number,
               private readonly _cellsY: number,
               private readonly _cellsZ: number) { }
  get cellHeightGrid(): Array<Array<number>> {
    return this._cellHeightGrid;
  }
  get typeGrid(): Array<Array<TerrainType>> {
    return this._typeGrid;
  }
  get shapeGrid(): Array<Array<TerrainShape>> {
    return this._shapeGrid;
  }
  get biomeGrid(): Array<Array<Biome>> {
    return this._biomeGrid;
  }
  get tileDimensions(): Dimensions {
    return this._tileDimensions;
  }
  get cellsX(): number {
    return this._cellsX;
  }
  get cellsY(): number {
    return this._cellsY;
  }
  get cellsZ(): number {
    return this._cellsZ;
  }
}


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
    console.log('generated biomes');
    setTerrainTypes(this.biomeGrid, this.typeGrid);
  }

  generateMap(context: ContextImpl): void {
    //setRamps(this._heightGrid, this._terraceGrid, this._shapeGrid,
    //         this._terraceSpacing, 0);
    //setEdges(this._terraceGrid, this._shapeGrid, this._typeGrid, this.floor,
    //         this.wall, this.wall != this.floor);

    const descriptor = new TerrainGridDescriptorImpl(
      this.terraceGrid,
      this.typeGrid,
      this.shapeGrid,
      this.biomeGrid,
      this.tileDimensions,
      this.width,
      this.depth,
      this.numTerraces
    );

    for (let y = 0; y < this.depth; ++y) {
      for (let x = 0; x < this.width; ++x) {
        let z = this.terraceAt(x, y);
        const terrainShape = this.terrainShapeAt(x, y);
        const terrainType = this.terrainTypeAt(x, y);
        const position = context.scaleGridToWorld(x, y, z);

        if (!context.bounds.contains(position)) {
          console.error('terrain out-of-bounds:', position);
        }

        let physical: new (...args: any[]) => PhysicalEntity;
        switch (terrainShape) {
        default:
          physical = CuboidEntity;
          break;
        case TerrainShape.RampUpNorth:
          physical = RampNorthEntity;
          break;
        case TerrainShape.RampUpEast:
          physical = RampEastEntity;
          break;
        case TerrainShape.RampUpSouth:
          physical = RampSouthEntity;
          break;
        case TerrainShape.RampUpWest:
          physical = RampWestEntity;
          break;
        }
        const entity = new physical(
          context,
          position,
          this.tileDimensions
        );
        const terrain = new Terrain(
          entity,
          terrainType,
          terrainShape
        );

        const zStop = z - this.calcRelativeHeight(x, y, descriptor);
        const shape = Terrain.isFlat(terrainShape)
          ? terrainShape
          : TerrainShape.Flat;
        while (z > zStop) {
          z--;
          const subSurfacePosition = context.scaleGridToWorld(x, y, z);
          const subSurfaceEntity = new CuboidEntity(
            context,
            subSurfacePosition,
            this.tileDimensions
          );
          new Terrain(subSurfaceEntity, terrainType, shape);
        }
      }
    }
  }

  inbounds(x: number, y: number): boolean {
    return x >= 0 && x < this.width &&
           y >= 0 && y < this.depth;
  }

  calcRelativeHeight(x: number, y: number, descriptor: TerrainGridDescriptorImpl): number {
    let relativeHeight = 0;
    const centreTerrace = descriptor.cellHeightGrid[y][x];

    for (let offset of Compass.neighbourOffsets.values()) {
      const neighbourX = x + offset.x;
      const neighbourY = y + offset.y;
      if (!this.inbounds(neighbourX, neighbourY)) {
        continue;
      }
      const neighbourTerrace = descriptor.cellHeightGrid[neighbourY][neighbourX];
      console.assert(
        neighbourTerrace >= 0,
        "Found neighbour with negative terrace!",
        neighbourTerrace
      );
      const height = centreTerrace - neighbourTerrace;
      relativeHeight = Math.max(height, relativeHeight);
    }
    return relativeHeight;
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
