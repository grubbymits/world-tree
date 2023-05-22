import { Point2D, Point3D, Vector2D } from "./geometry.ts";
import { Terrain, TerrainGrid } from "./terrain.ts";
import { MinPriorityQueue } from "./queue.ts";

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
    let xDiff = 0;
    let yDiff = 0;
    switch (direction) {
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

  static getAdjacentCoord(p: Point2D, direction: Direction): Point2D {
    const v = this.getVector2D(direction);
    return p.add(v);
  }

  static getDirectionFromPoints(from: Point2D, to: Point2D): Direction {
    return this.getDirectionFromVector(to.diff(from));
  }

  static getDirectionFromVector(w: Vector2D): Direction {
    const mag = w.mag();
    const u = new Vector2D(0, -mag); // 'north'
    let theta = (180 * u.angle(w)) / Math.PI;
    if (theta < 0) {
      const rotate = 180 + theta;
      theta = 180 + rotate;
    }
    const direction = Math.round(theta / 45);
    return <Direction> direction;
  }

  static getOppositeDirection(direction: Direction): Direction {
    return (direction + Direction.Max / 2) % Direction.Max;
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

export class PathFinder {
  private _nodes = new Map<Terrain, PathNode>();

  constructor(private readonly _grid: TerrainGrid) {
    // Create path nodes for all surface locations.
    for (let y = 0; y < this.grid.depth; y++) {
      for (let x = 0; x < this.grid.width; x++) {
        const centre = this.grid.getSurfaceTerrainAt(x, y)!;
        this._nodes.set(centre, new PathNode(centre));
      }
    }

    for (let y = 0; y < this.grid.depth; y++) {
      for (let x = 0; x < this.grid.width; x++) {
        const centre = this.grid.getSurfaceTerrainAt(x, y)!;
        this.addNeighbours(centre);
      }
    }
  }

  get grid(): TerrainGrid {
    return this._grid;
  }
  get nodes(): Map<Terrain, PathNode> {
    return this._nodes;
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

  addNeighbours(centre: Terrain): void {
    console.assert(
      this.nodes.has(centre),
      "object not in node map: %o",
      centre,
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
        neighbour,
      );
      const cost = this.getNeighbourCost(centre, neighbour);
      centreNode.addNeighbour(this.nodes.get(neighbour)!, cost);
    }
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

    const neighbours = this.grid.getNeighbours(centre);
    const centrePoint: Point2D = new Point2D(centre.x, centre.y);
    return neighbours.filter(function (to: Terrain) {
      console.assert(
        Math.abs(centre.z - to.z) <= 1,
        "can only handle neighbours separated by 1 terrace max",
      );

      const toPoint: Point2D = new Point2D(to.x, to.y);
      const direction: Direction = Navigation.getDirectionFromPoints(
        centrePoint,
        toPoint,
      );
      const diagonal = direction != Direction.North &&
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

  findPath(startPoint: Point3D, endPoint: Point3D): Array<Point3D> {
    const startTerrain: Terrain | null = this.grid.getSurfaceTerrainAtPoint(
      startPoint,
    );
    const endTerrain: Terrain | null = this.grid.getSurfaceTerrainAtPoint(
      endPoint,
    );
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
