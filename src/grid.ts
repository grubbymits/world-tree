import { ContextImpl } from './context.ts';
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
} from './geometry.ts';

export interface TerrainGridDescriptor {
  cellHeightGrid: Array<Array<number>>;
  typeGrid: Array<Array<TerrainType>>;
  shapeGrid: Array<Array<TerrainShape>>;
  tileDimensions: Dimensions;
  cellsX: number;
  cellsY: number;
  cellsZ: number;
}

export class TerrainGridDescriptorImpl implements TerrainGridDescriptor {
  constructor (private readonly _cellHeightGrid: Array<Array<number>>,
               private readonly _typeGrid: Array<Array<TerrainType>>,
               private readonly _shapeGrid: Array<Array<TerrainShape>>,
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
    descriptor: TerrainGridDescriptor,
  ) {
    this._context.grid = this;
    this._cellsX = descriptor.cellsX;
    this._cellsY = descriptor.cellsY;
    this._dimensions  = descriptor.tileDimensions;
    for (let y = 0; y < this.cellsY; ++y) {
      this.surfaceTerrain.push(new Array<Terrain>(this.cellsX));
      for (let x = 0; x < this.cellsX; ++x) {
        let z = descriptor.cellHeightGrid[y][x];
        const terrainShape = descriptor.shapeGrid[y][x];
        const terrainType = descriptor.typeGrid[y][x];
        const position = this.scaleGridToWorld(x, y, z);
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

        const zStop = z - this.calcRelativeHeight(x, y, descriptor);
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
    for (let y = 0; y < this.cellsY; y++) {
      for (let x = 0; x < this.cellsX; x++) {
        const terrain = this.getSurfaceTerrainAt(x, y)!;
        this.addNeighbours(terrain);
      }
    }
  }

  get cellsX(): number {
    return this._cellsX;
  }
  get cellsY(): number {
    return this._cellsY;
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

  scaleGridToWorld(x: number, y: number, z: number): Point3D {
    return new Point3D(x * this.dimensions.width,
                       y * this.dimensions.depth,
                       z * this.dimensions.height);
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

    for (let offset of Navigation.neighbourOffsets) {
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
    return this.surfaceTerrain[y][x]!.surfaceLocation;
  }

  getSurfaceTerrainAtPoint(loc: Point3D): Terrain | null {
    const scaled: Point3D = this.scaleWorldToGrid(loc);
    const terrain = this.getSurfaceTerrainAt(scaled.x, scaled.y);
    if (terrain != null) {
      if (terrain.surfaceLocation.z == loc.z) {
        return terrain;
      }
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

    const neighbours = this.getNeighbours(centre);
    const centrePoint: Point2D = new Point2D(centre.x, centre.y);
    return neighbours.filter(function (to: Terrain) {
      if (Math.abs(centre.z - to.z) > 1) {
        return false;
      }

      const toPoint: Point2D = new Point2D(to.x, to.y);
      const direction: Direction = Navigation.getDirectionFromPoints(
        centrePoint,
        toPoint
      );
      const diagonal =
        direction != Direction.North &&
        direction != Direction.East &&
        direction != Direction.South &&
        direction != Direction.West;
      const oppositeDir: Direction = Navigation.getOppositeDirection(direction);
      if (to.z == centre.z) {
        return true;
      } else if (to.z > centre.z && !diagonal) {
        return Terrain.isRampUp(to.shape, direction);
      } else if (to.z < centre.z && !diagonal) {
        return Terrain.isRampUp(to.shape, oppositeDir);
      }
      return false;
    });
  }

  getNeighbours(centre: Terrain): Array<Terrain> {
    const neighbours = new Array<Terrain>();

    for (const offset of Navigation.neighbourOffsets) {
      const scaled: Point3D = this.scaleWorldToGrid(centre.surfaceLocation);
      const neighbour = this.getSurfaceTerrainAt(
        scaled.x + offset.x,
        scaled.y + offset.y
      );
      if (!neighbour) {
        continue;
      }
      neighbours.push(neighbour);
    }
    return neighbours;
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
