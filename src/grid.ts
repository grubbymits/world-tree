/*
import { ContextImpl } from './context.ts';
import { Biome } from './terrain/biomes.ts';
import { Compass } from './terrain/navigation.ts';
import {
  Terrain,
  TerrainShape,
  TerrainType,
} from './terrain.ts';
import { Dimensions } from './physics.ts';
import {
  Point2D,
  Point3D,
  Vector3D,
} from './geometry.ts';

class PathNode {
  private _edgeCosts: Map<PathNode, number> = new Map<PathNode, number>();
  private readonly _waypoint: Point3D;
  
  constructor(terrain: Terrain) {
    this._waypoint = terrain.surfaceLocation;
  }
  
  addNeighbour(neighbour: PathNode, cost: number): void {
    this._edgeCosts.set(neighbour, cost);
  }
  
  hasNeighbour(neighbour: PathNode): boolean {
    return this._edgeCosts.has(neighbour);
  }
  
  get neighbours(): Map<PathNode, number> {
    return this._edgeCosts;
  }
  
  get waypoint(): Point3D {
    return this._waypoint;
  }
}

export class TerrainGrid {
  private _surfaceTerrain: Array<Array<Terrain>> = new Array<Array<Terrain>>();
  private readonly _cellsX: number;
  private readonly _cellsY: number;
  private readonly _dimensions: Dimensions;
  private _totalSurface = 0;
  private _totalSubSurface = 0;
  private _nodes = new Map<Terrain, PathNode>();

  constructor(
    private readonly _context: ContextImpl,
    private readonly _descriptor: TerrainGridDescriptor,
  ) {
    this._context.grid = this;
    this._dimensions = this.descriptor.tileDimensions;
    for (let y = 0; y < this.cellsY; ++y) {
      this.surfaceTerrain.push(new Array<Terrain>(this.cellsX));
      for (let x = 0; x < this.cellsX; ++x) {
        let z = this.descriptor.cellHeightGrid[y][x];
        const terrainShape = this.terrainShapeAt(x, y);
        const terrainType = this.terrainTypeAt(x, y);
        const position = this.scaleGridToWorld(x, y, z);

        if (!this._context.bounds.contains(position)) {
          console.error('terrain out-of-bounds:', position);
        }

        const terrain = new Terrain(
          this._context,
          position,
          this.dimensions,
          terrainType,
          terrainShape
        );
        this._nodes.set(terrain, new PathNode(terrain));
        this.surfaceTerrain[y][x] = terrain;
        this._totalSurface++;

        const zStop = z - this.calcRelativeHeight(x, y, this.descriptor);
        const shape = Terrain.isFlat(terrainShape)
          ? terrainShape
          : TerrainShape.Flat;
        while (z > zStop) {
          z--;
          const subSurfacePosition = this.scaleGridToWorld(x, y, z);
          new Terrain(this._context, subSurfacePosition, this.dimensions, terrainType, shape);
          this._totalSubSurface++;
        }
      }
    }
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
  get surfaceTerrain(): Array<Array<Terrain>> {
    return this._surfaceTerrain;
  }
  get nodes(): Map<Terrain, PathNode> {
    return this._nodes;
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
    const gap = 0.001;
    const gapX = x * gap;
    const gapY = y * gap;
    const gapZ = z * gap;
    return new Point3D(x * this.dimensions.width + gapX,
                       y * this.dimensions.depth + gapY,
                       z * this.dimensions.height + gapZ);
  }

  scaleWorldToGrid(loc: Point3D): Point3D {
    // round down
    const width = this.dimensions.width;
    const depth = this.dimensions.depth;
    const height = this.dimensions.height;
    const x = loc.x - (loc.x % width);
    const y = loc.y - (loc.y % depth);
    const z = loc.z - (loc.z % height);
    // then scale to grid
    return new Point3D(
      Math.floor(x / width),
      Math.floor(y / depth),
      Math.floor(z / height)
    );
  }

  calcRelativeHeight(x: number, y: number, descriptor: TerrainGridDescriptor): number {
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

  inbounds(x: number, y: number): boolean {
    return x >= 0 && x < this.cellsX &&
           y >= 0 && y < this.cellsY;
  }

  getSurfaceTerrainAt(x: number, y: number): Terrain | null {
    if (!this.inbounds(x, y)) {
      return null;
    }
    return this.surfaceTerrain[y][x];
  }

  getSurfaceLocationAt(x: number, y: number): Point3D | null {
    if (!this.inbounds(x, y)) {
      return null;
    }
    return this.surfaceTerrain[y][x]!.surfaceLocation.add(
      new Vector3D(0, 0, 0.1)
    );
  }

  getSurfaceTerrainAtPoint(loc: Point3D): Terrain | null {
    const scaled: Point3D = this.scaleWorldToGrid(loc);
    const terrain = this.getSurfaceTerrainAt(scaled.x, scaled.y);
    if (terrain != null) {
      //if (terrain.centre.z == scaled.z) {
        return terrain;
      //}
    }
    return null;
  }
}
*/
