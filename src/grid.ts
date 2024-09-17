import { ContextImpl } from './context.ts';
import { Biome } from './biomes.ts';
import {
  Terrain,
  TerrainShape,
  TerrainType,
} from './terrain.ts';
import {
  Direction,
  Navigation
} from './navigation.ts';
import { MinPriorityQueue } from './queue.ts';
import { Dimensions } from './physics.ts';
import {
  Point2D,
  Point3D,
  Vector3D,
  Geometry,
} from './geometry.ts';
import {
  PhysicalEntity,
  CuboidEntity,
  RampNorthEntity,
  RampEastEntity,
  RampSouthEntity,
  RampWestEntity,
} from "./entity.ts";

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

export class TerrainGrid {
  private _surfaceGeometry: Array<Array<Geometry>> = new Array<Array<Geometry>>();
  private readonly _cellsX: number;
  private readonly _cellsY: number;
  private readonly _dimensions: Dimensions;
  private _totalSurface = 0;
  private _totalSubSurface = 0;
  private _gap = 0.001;

  constructor(
    private readonly _context: ContextImpl,
    private readonly _descriptor: TerrainGridDescriptor,
  ) {
    this._context.grid = this;
    this._dimensions = this.descriptor.tileDimensions;
    for (let y = 0; y < this.cellsY; ++y) {
      this.surfaceGeometry.push(new Array<Geometry>(this.cellsX));
      for (let x = 0; x < this.cellsX; ++x) {
        let z = this.descriptor.cellHeightGrid[y][x];
        const terrainShape = this.terrainShapeAt(x, y);
        const terrainType = this.terrainTypeAt(x, y);
        const position = this.scaleGridToWorld(x, y, z);

        if (!this._context.bounds.contains(position)) {
          console.error('terrain out-of-bounds:', position);
        }

        let physical: new (...args: any[]) => PhysicalEntity;
        switch (terrainShape) {
        default:
          physical = CuboidEntity;
          break;
        case TerrainShape.RampNorth:
          physical = RampNorthEntity;
          break;
        case TerrainShape.RampEast:
          physical = RampEastEntity;
          break;
        case TerrainShape.RampSouth:
          physical = RampSouthEntity;
          break;
        case TerrainShape.RampWest:
          physical = RampWestEntity;
          break;
        }
        const entity = new physical(
          this.context,
          position,
          this.descriptor.tileDimensions
        );
        entity.addGraphic(Terrain.graphics(terrainType, terrainShape));
        this.surfaceGeometry[y][x] = entity.geometry;
        this._totalSurface++;

        const zStop = z - this.calcRelativeHeight(x, y, this.descriptor);
        const shape = !Terrain.isRamp(terrainShape)
          ? terrainShape
          : TerrainShape.Flat;
        while (z > zStop) {
          z--;
          const subSurfacePosition = this.scaleGridToWorld(x, y, z);
          const subSurfaceEntity = new CuboidEntity(
            this.context,
            subSurfacePosition,
            this.descriptor.tileDimensions
          );
          this._totalSubSurface++;
        }
      }
    }
  }

  get context(): ContextImpl {
    return this._context;
  }
  get descriptor(): TerrainGridDescriptor {
    return this._descriptor;
  }
  get cellsX(): number {
    return this.descriptor.cellsX;
  }
  get cellsY(): number {
    return this.descriptor.cellsY;
  }
  get dimensions(): Dimensions {
    return this._dimensions;
  }
  get totalSurface(): number {
    return this._totalSurface;
  }
  get totalSubSurface(): number {
    return this._totalSubSurface;
  }
  get surfaceGeometry(): Array<Array<Geometry>> {
    return this._surfaceGeometry;
  }

  terrainShapeAt(x: number, y: number): TerrainShape {
    return this.descriptor.shapeGrid[y][x];
  }
  terrainTypeAt(x: number, y: number): TerrainType {
    return this.descriptor.typeGrid[y][x];
  }
  biomeAt(x: number, y: number): Biome {
    return this.descriptor.biomeGrid[y][x];
  }

  scaleGridToWorld(x: number, y: number, z: number): Point3D {
    const gapX = x * this._gap;
    const gapY = y * this._gap;
    const gapZ = z * this._gap;
    return new Point3D(x * this.dimensions.width + gapX,
                       y * this.dimensions.depth + gapY,
                       z * this.dimensions.height + gapZ);
  }

  scaleWorldToGrid(loc: Point3D): Point3D {
    // round down
    const width = this.dimensions.width;
    const depth = this.dimensions.depth;
    const height = this.dimensions.height;
    //const x = loc.x - (loc.x % width);
    //const y = loc.y - (loc.y % depth);
    //const z = loc.z - (loc.z % height);
    // then scale to grid
    return new Point3D(
      Math.floor(loc.x / width),
      Math.floor(loc.y / depth),
      Math.floor(loc.z / height)
    );
  }

  calcRelativeHeight(x: number, y: number, descriptor: TerrainGridDescriptor): number {
    let relativeHeight = 0;
    const centreTerrace = descriptor.cellHeightGrid[y][x];

    for (let offset of Navigation.neighbourOffsets.values()) {
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

  inbounds(x: number, y: number): boolean {
    return x >= 0 && x < this.cellsX &&
           y >= 0 && y < this.cellsY;
  }

  getCentreSurfaceLocationAt(x: number, y: number): Point3D | null {
    if (!this.inbounds(x, y)) {
      return null;
    }
    const gapX = x * this._gap;
    const gapY = y * this._gap;
    const rayX = (this.dimensions.width / 2) + x * this.dimensions.width + gapX;
    const rayY = (this.dimensions.depth / 2) + y * this.dimensions.depth + gapY;
    const begin = new Point3D(rayX, rayY, this.context.bounds.height);
    const end = new Point3D(rayX, rayY, 0);

    const surfaceGeometry = this.surfaceGeometry[y][x]!;
    const obstructInfo = surfaceGeometry.obstructsRay(begin, end);
    // Adjust it slightly above the contact point.
    return new Point3D(
      obstructInfo!.i.x, 
      obstructInfo!.i.y, 
      obstructInfo!.i.z + 0.1
    );
  }
}
