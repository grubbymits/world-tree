import { ContextImpl } from "./context.ts";
import { Biome } from "./biomes.ts";
import { TerrainGraphics, TerrainShape, TerrainType } from "./terraform.ts";
import { Direction, Navigation } from "./navigation.ts";
import { MinPriorityQueue } from "./queue.ts";
import { Dimensions } from "./physics.ts";
import { Point2D, Point3D, Vector3D, Geometry } from "./geometry.ts";
import {
  PhysicalEntity,
  CuboidEntity,
  RampNorthEntity,
  RampEastEntity,
  RampSouthEntity,
  RampWestEntity,
} from "./entity.ts";

export class Tiles {
  private static MAX_TILES = 1024;
  private static readonly NUM_ELEMENTS = 3;
  private static readonly INITIAL_SIZE = this.NUM_ELEMENTS * this.MAX_TILES;
  private static data: Uint8Array = new Uint8Array(this.INITIAL_SIZE);
  private static readonly ARRAY_ELEMENT_SIZE =
    this.data.BYTES_PER_ELEMENT << (8 - 1);
  private static total = 0;
  private static _width = 0;
  private static _height = 0;

  static reset() {
    this.total = 0;
    this._width = 0;
    this._height = 0;
    this.data = new Uint8Array(this.INITIAL_SIZE);
  }

  static add(id: number, x: number, y: number, z: number) {
    console.assert(id == this.total);
    console.assert(x <= this.ARRAY_ELEMENT_SIZE);
    console.assert(y <= this.ARRAY_ELEMENT_SIZE);
    console.assert(z <= this.ARRAY_ELEMENT_SIZE);
    this.data[id * this.NUM_ELEMENTS] = x;
    this.data[id * this.NUM_ELEMENTS + 1] = y;
    this.data[id * this.NUM_ELEMENTS + 2] = z;
    this.total++;
  }
  static setWidth(width: number) {
    console.assert(this._width == 0);
    this._width = width;
  }
  static setHeight(height: number) {
    console.assert(this._height == 0);
    this._height = height;
  }
  static contains(id: number): boolean {
    return id < this.total;
  }
  static x(id: number): number {
    return this.data[id * this.NUM_ELEMENTS];
  }
  static y(id: number): number {
    return this.data[id * this.NUM_ELEMENTS + 1];
  }
  static z(id: number): number {
    return this.data[id * this.NUM_ELEMENTS + 2];
  }
  static width(): number {
    return this._width;
  }
  static height(): number {
    return this._height;
  }
}

export interface TerrainGridDescriptor {
  cellHeightGrid: Array<Uint8Array>;
  typeGrid: Array<Uint8Array>;
  shapeGrid: Array<Uint8Array>;
  biomeGrid: Array<Uint8Array>;
  tileDimensions: Dimensions;
  cellsX: number;
  cellsY: number;
  cellsZ: number;
  spriteWidth: number;
  spriteHeight: number;
}

export class TerrainGridDescriptorImpl implements TerrainGridDescriptor {
  constructor(
    private readonly _cellHeightGrid: Array<Uint8Array>,
    private readonly _typeGrid: Array<Uint8Array>,
    private readonly _shapeGrid: Array<Uint8Array>,
    private readonly _biomeGrid: Array<Uint8Array>,
    private readonly _tileDimensions: Dimensions,
    private readonly _cellsX: number,
    private readonly _cellsY: number,
    private readonly _cellsZ: number,
    private readonly _spriteWidth: number,
    private readonly _spriteHeight: number
  ) {}
  get cellHeightGrid(): Array<Uint8Array> {
    return this._cellHeightGrid;
  }
  get typeGrid(): Array<Uint8Array> {
    return this._typeGrid;
  }
  get shapeGrid(): Array<Uint8Array> {
    return this._shapeGrid;
  }
  get biomeGrid(): Array<Uint8Array> {
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
  get spriteWidth(): number {
    return this._spriteWidth;
  }
  get spriteHeight(): number {
    return this._spriteHeight;
  }
}

export class TerrainGrid {
  private _surfaceGeometry: Array<Array<Geometry>> = new Array<
    Array<Geometry>
  >();
  private readonly _cellsX: number;
  private readonly _cellsY: number;
  private readonly _dimensions: Dimensions;
  private _totalSurface = 0;
  private _totalSubSurface = 0;
  private static readonly _gap = 0.0001;

  static gap(): number {
    return this._gap;
  }

  constructor(
    private readonly _context: ContextImpl,
    private readonly _descriptor: TerrainGridDescriptor
  ) {
    this._context.grid = this;
    this._dimensions = this.descriptor.tileDimensions;
    Tiles.setWidth(this.descriptor.spriteWidth);
    Tiles.setHeight(this.descriptor.spriteHeight);
    for (let y = 0; y < this.cellsY; ++y) {
      this.surfaceGeometry.push(new Array<Geometry>(this.cellsX));
      for (let x = 0; x < this.cellsX; ++x) {
        let z = this.descriptor.cellHeightGrid[y][x];
        const terrainShape = this.terrainShapeAt(x, y);
        const terrainType = this.terrainTypeAt(x, y);

        const terrain = this.context.createTerrain(
          x,
          y,
          z,
          terrainType,
          terrainShape,
          this.descriptor.tileDimensions
        );

        this.surfaceGeometry[y][x] = terrain.geometry;
        this._totalSurface++;

        const zStop =
          z - this.calcRelativeHeight(x, y, this.descriptor.cellHeightGrid);
        while (z > zStop) {
          z--;
          const subSurface = this.context.createTerrain(
            x,
            y,
            z,
            terrainType,
            TerrainShape.Flat,
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

  scaleWorldToGrid(loc: Point3D): Point3D {
    // round down
    const width = this.dimensions.width;
    const depth = this.dimensions.depth;
    const height = this.dimensions.height;
    // then scale to grid
    return new Point3D(
      Math.floor(loc.x / width),
      Math.floor(loc.y / depth),
      Math.floor(loc.z / height)
    );
  }

  calcRelativeHeight(
    x: number,
    y: number,
    cellHeightGrid: Array<Uint8Array>
  ): number {
    let relativeHeight = 0;
    const centreTerrace = cellHeightGrid[y][x];

    for (let offset of Navigation.neighbourOffsets.values()) {
      const neighbourX = x + offset.x;
      const neighbourY = y + offset.y;
      if (!this.inbounds(neighbourX, neighbourY)) {
        continue;
      }
      const neighbourTerrace = cellHeightGrid[neighbourY][neighbourX];
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
    return x >= 0 && x < this.cellsX && y >= 0 && y < this.cellsY;
  }

  getCentreSurfaceLocationAt(x: number, y: number): Point3D | null {
    if (!this.inbounds(x, y)) {
      return null;
    }
    const gapX = x * TerrainGrid.gap();
    const gapY = y * TerrainGrid.gap();
    const rayX = this.dimensions.width / 2 + x * this.dimensions.width + gapX;
    const rayY = this.dimensions.depth / 2 + y * this.dimensions.depth + gapY;
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
