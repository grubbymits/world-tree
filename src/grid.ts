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
          this.context,
          position,
          this.descriptor.tileDimensions
        );
        const terrain = new Terrain(
          entity,
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
          const subSurfaceEntity = new CuboidEntity(
            this.context,
            subSurfacePosition,
            this.descriptor.tileDimensions
          );
          new Terrain(subSurfaceEntity, terrainType, shape);
          this._totalSubSurface++;
        }
      }
    }
    for (let y = 0; y < this.cellsY; y++) {
      for (let x = 0; x < this.cellsX; x++) {
        const terrain = this.getSurfaceTerrainAt(x, y)!;
        this.addNeighbours(terrain);
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

  addNeighbours(centre: Terrain): void {
    console.assert(
      this.nodes.has(centre),
      "object not in node map: %o",
      centre
    );
    const neighbours: Array<Terrain> = this.getAccessibleNeighbours(centre);
    if (neighbours.length == 0) {
      return;
    }
    const centreNode: PathNode = this.nodes.get(centre)!;
    for (const neighbour of neighbours) {
      console.assert(
        this.nodes.has(neighbour),
        "object not in node map: %o",
        neighbour
      );
      const cost = this.getNeighbourCost(centre, neighbour);
      centreNode.addNeighbour(this.nodes.get(neighbour)!, cost);
    }
  }

  getNeighbourCost(centre: Terrain, to: Terrain): number {
    // If a horizontal, or vertical, move cost 1 then a diagonal move would be
    // 1.444... So scale by 2 and round. Double the cost of changing height.
    const cost = centre.x == to.x || centre.y == to.y ? 2 : 3;
    if (Terrain.isFlat(centre.shape) && Terrain.isFlat(to.shape)) {
      return cost;
    }
    return centre.z == to.z ? cost : cost * 2;
  }

  getAccessibleNeighbours(centre: Terrain): Array<Terrain> {
    const neighbours = new Map<Direction, Terrain>();

    // Blocked by different Z values, other than when:
    // direction, entering non-blocking tile
    // north,     RampUpNorth
    // east,      RampUEast
    // south,     RampUpSouth
    // west,      RampUpWest

    // Blocked by different Z values, other than when:
    // direction, leaving non-blocking tile
    // north,     RampUpSouth
    // east,      RampUpWest
    // south,     RampUpNorth
    // west,      RampUpEast

    for (const neighbourOffset of Navigation.neighbourOffsets) {
      const direction = neighbourOffset[0];
      const vector = neighbourOffset[1];

      const scaled: Point3D = this.scaleWorldToGrid(centre.surfaceLocation);
      const neighbour = this.getSurfaceTerrainAt(
        scaled.x + vector.x,
        scaled.y + vector.y
      );
      if (!neighbour) {
        continue;
      }
      if (Math.abs(centre.z - neighbour.z) > 1) {
        continue;
      }

      let diagonal = true;
      switch (direction) {
      default:
        diagonal = false;
        break;
      case Direction.NorthWest:
        if (!neighbours.has(Direction.North) ||
            !neighbours.has(Direction.West)) {
          continue;
        }
        break;
      case Direction.NorthEast:
        if (!neighbours.has(Direction.North) ||
            !neighbours.has(Direction.East)) {
          continue;
        }
        break;
      case Direction.SouthEast:
        if (!neighbours.has(Direction.South) ||
            !neighbours.has(Direction.East)) {
          continue;
        }
        break;
      case Direction.SouthWest:
        if (!neighbours.has(Direction.South) ||
            !neighbours.has(Direction.West)) {
          continue;
        }
        break;
      }

      const oppositeDir: Direction = Navigation.getOppositeDirection(direction);
      if (neighbour.z == centre.z) {
        //return true;
      } else if (neighbour.z > centre.z && !diagonal) {
        if (!Terrain.isRampUp(neighbour.shape, direction)) {
          continue;
        }
      } else if (neighbour.z < centre.z && !diagonal) {
        if (!Terrain.isRampUp(neighbour.shape, oppositeDir)) {
          continue;
        }
      } else {
        continue;
      }
      neighbours.set(direction, neighbour);
    }
    return Array.from(neighbours.values());
  }

  findPath(startPoint: Point3D, endPoint: Point3D): Array<Point3D> {
    const startTerrain: Terrain | null =
      this.getSurfaceTerrainAtPoint(startPoint);
    const endTerrain: Terrain | null =
      this.getSurfaceTerrainAtPoint(endPoint);
    if (startTerrain == null || endTerrain == null) {
      return new Array<Point3D>();
    }

    const start: PathNode = this.nodes.get(startTerrain)!;
    if (start.neighbours.size == 0) {
      return new Array<Point3D>();
    }
    const end: PathNode = this.nodes.get(endTerrain)!;
    if (end.neighbours.size == 0) {
      return new Array<Point3D>();
    }

    // https://www.redblobgames.com/pathfinding/a-star/introduction.html
    const frontier = new MinPriorityQueue<PathNode>();
    const cameFrom = new Map<PathNode, PathNode | null>();
    const costs = new Map<PathNode, number>();
    frontier.insert(start, 0);
    cameFrom.set(start, null);
    costs.set(start, 0);
    let current: PathNode = start;
    while (!frontier.empty()) {
      current = frontier.pop();
      if (current == end) {
        break;
      }
      current.neighbours.forEach((cost: number, next: PathNode) => {
        const new_cost = costs.get(current)! + cost;
        if (!costs.has(next) || new_cost < costs.get(next)!) {
          costs.set(next, new_cost);
          const priority = new_cost; // + heuristic(goal, next)
          frontier.insert(next, priority);
          cameFrom.set(next, current);
        }
      });
    }

    // Failed to find path.
    if (current != end) {
      return Array<Point3D>();
    }
    const path = new Array<Point3D>(current.waypoint);
    while (current != start) {
      current = cameFrom.get(current!)!;
      path.push(current.waypoint);
    }
    path.reverse();
    return path.splice(1);
  }
}

