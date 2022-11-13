import { Point2D,
         Vector2D } from "./geometry.ts"
import { Terrain,
         TerrainGrid } from "./terrain.ts"

export enum Direction {
  North,
  NorthEast,
  East,
  SouthEast,
  South,
  SouthWest,
  West,
  NorthWest,
  Max,
}

export class Navigation {

  static getDirectionName(direction: Direction): string {
    switch (direction) {
    default:
      break;
    case Direction.North:
      return "north";
    case Direction.NorthEast:
      return "north east";
    case Direction.East:
      return "east";
    case Direction.SouthEast:
      return "south east";
    case Direction.South:
      return "south";
    case Direction.SouthWest:
      return "south west";
    case Direction.West:
      return "west";
    case Direction.NorthWest:
      return "north west";
    }
    console.error("unhandled direction when getting name:", direction);
    return "error";
  }

  static getVector2D(direction: Direction): Vector2D {
    let xDiff: number = 0;
    let yDiff: number = 0;
    switch(direction) {
    default:
      console.error("unhandled direction");
      break;
    case Direction.North:
      yDiff = -1;
      break;
    case Direction.NorthEast:
      xDiff = 1;
      yDiff = -1;
      break;
    case Direction.East:
      xDiff = 1;
      break;
    case Direction.SouthEast:
      xDiff = 1;
      yDiff = 1;
      break;
    case Direction.South:
      yDiff = 1;
      break;
    case Direction.SouthWest:
      xDiff = -1;
      yDiff = 1;
      break;
    case Direction.West:
      xDiff = -1;
      break;
    case Direction.NorthWest:
      xDiff = -1;
      yDiff = -1;
      break;
    }
    return new Vector2D(xDiff, yDiff);
  }

  static getAdjacentCoord(p: Point2D,
                          direction: Direction): Point2D {
    let v = this.getVector2D(direction);
    return p.add(v);
  }

  static getDirectionFromPoints(from: Point2D, to: Point2D): Direction {
    return this.getDirectionFromVector(to.diff(from));
  }

  static getDirectionFromVector(w: Vector2D): Direction {
    let mag = w.mag();
    let u = new Vector2D(0, -mag);  // 'north'
    let theta = 180 * u.angle(w) / Math.PI;
    if (theta < 0) {
      let rotate = 180 + theta;
      theta = 180 + rotate;
    }
    const direction = Math.round(theta / 45);
    return <Direction>direction;
  }
  
  static getOppositeDirection(direction: Direction): Direction {
    return (direction + (Direction.Max / 2)) % Direction.Max;
  }
}

class PathNode {
  private _edgeCosts: Map<PathNode, number> = new Map<PathNode, number>();
  private readonly _x: number;
  private readonly _y: number;

  constructor(terrain: Terrain) {
    this._x = terrain.x;
    this._y = terrain.y;
  }

  addSuccessor(succ: PathNode, cost: number): void {
    this._edgeCosts.set(succ, cost);
  }

  hasSuccessor(succ: PathNode): boolean {
    return this._edgeCosts.has(succ);
  }

  get x(): number { return this._x; }
  get y(): number { return this._y; }
}

export class PathFinder {

  private _graph: Array<Array<PathNode>> = new Array<Array<PathNode>>();

  constructor(grid: TerrainGrid) {
    // Create path nodes for all surface locations.
    for (let y = 0; y < grid.depth; y++) {
      this.graph[y] = new Array<PathNode>();
      for (let x = 0; x < grid.width; x++) {
        let centre = grid.getSurfaceTerrainAt(x, y)!;
        this.addNode(x, y, centre);
      }
    }

    for (let y = 0; y < grid.depth; y++) {
      for (let x = 0; x < grid.width; x++) {
        let centre = grid.getSurfaceTerrainAt(x, y)!;
        this.addNeighbours(centre, grid);
      }
    }
  }

  get graph(): Array<Array<PathNode>> { return this._graph; }

  addNode(x: number, y: number, terrain: Terrain): void {
    this._graph[y][x] = new PathNode(terrain);
  }

  getNode(x: number, y: number): PathNode {
    return this._graph[y][x];
  }

  addNeighbours(centre: Terrain, grid: TerrainGrid): void {
    let neighbours = this.getAccessibleNeighbours(centre, grid);
    let centreNode = this.getNode(centre.x, centre.y);
    for (let neighbour of neighbours) {
      let cost = this.getNeighbourCost(centre, neighbour);
      let succ = this.getNode(neighbour.x, neighbour.y);
      centreNode.addSuccessor(succ, cost);
    }
  }

  getAccessibleNeighbours(centre: Terrain, grid: TerrainGrid): Array<Terrain> {
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

    let neighbours = grid.getNeighbours(centre);
    let centrePoint: Point2D = new Point2D(centre.x, centre.y);
    return neighbours.filter(function(to: Terrain) {
      console.assert(Math.abs(centre.z - to.z) <= 1,
                     "can only handle neighbours separated by 1 terrace max");

      let toPoint: Point2D = new Point2D(to.x, to.y);
      let direction: Direction = Navigation.getDirectionFromPoints(centrePoint, toPoint);
      console.assert(direction == Direction.North ||
                     direction == Direction.East ||
                     direction == Direction.South ||
                     direction == Direction.West);
      let oppositeDir: Direction = Navigation.getOppositeDirection(direction);
      if (to.z == centre.z) {
        return true;
      } else if (to.z > centre.z) {
        return Terrain.isRampUp(to.shape, direction);
      } else if (to.z < centre.z) {
        return Terrain.isRampUp(to.shape, oppositeDir);
      }
      return false;
    });
  }

  getNeighbourCost(centre: Terrain, to: Terrain): number {
    // If a horizontal, or vertical, move cost 1 then a diagonal move would be
    // 1.444... So scale by 2 and round. Double the cost of changing height.
    let cost: number = centre.x == to.x || centre.y == to.y ? 2 : 3;
    if (Terrain.isFlat(centre.shape) && Terrain.isFlat(to.shape)) {
      return cost;
    }
    return centre.z == to.z ? cost : cost * 2;
  }
  
  isAccessible(centre: PathNode, dx: number, dy: number): boolean {
    let succ: PathNode = this.getNode(centre.x + dx, centre.y + dy);
    return centre.hasSuccessor(succ);
  }

  findPath() {
    //let frontier = new MaxPriorityQueue<PathNode, number>();
    //frontier.insert(startNode, 0);
    //came_from = new Map<PathNode, PathNode>();
    //cost_so_far = new Map<PathNode, number>();

    ////came_from.set(start, null);
    //cost_so_far.set(start, 0);
    //
    //while (!frontier.empty()) {
    //   let current: PathNode = frontier.pop();
    //
    //   if current == goal:
    //      break
    //   
    //   for next in graph.neighbors(current):
    //      new_cost = cost_so_far[current] + graph.cost(current, next)
    //      if next not in cost_so_far or new_cost < cost_so_far[next]:
    //         cost_so_far[next] = new_cost
    //         priority = new_cost + heuristic(goal, next)
    //         frontier.put(next, priority)
    //         came_from[next] = current
    //}
  }
}
