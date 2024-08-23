import {
  Edge,
  EdgeShape,
  Ramp,
  RampShape
} from '../terrain/shapes.ts';
import { MinPriorityQueue } from './queue.ts';
import {
  Point2D,
  Vector2D,
} from './geometry2d.ts';
import { Vector3D, } from './geometry3d.ts';


export class Coord {
  constructor(
    private readonly _x: number,
    private readonly _y: number
  ) { }
  get x(): number { return this._x; }
  get y(): number { return this._y; }
}

export const enum Direction {
  North     = 1 << 0,
  NorthEast = 1 << 1,
  East      = 1 << 2,
  SouthEast = 1 << 3,
  South     = 1 << 4,
  SouthWest = 1 << 5,
  West      = 1 << 6,
  NorthWest = 1 << 7,
  Max       = 1 << 8,
}

export class Compass {
  static isDiagonal(direction: Direction) {
    const diagonal =
      Direction.NorthEast |
      Direction.SouthEast |
      Direction.SouthWest |
      Direction.NorthWest;
    return (direction & diagonal) != 0;
  }

  static getName(direction: Direction): string {
    switch (direction) {
    default: console.error('unhandled direction');
    case Direction.North:     return 'North';
    case Direction.NorthEast: return 'NorthEast';
    case Direction.East:      return 'East';
    case Direction.SouthEast: return 'SouthEast';
    case Direction.South:     return 'South';
    case Direction.SouthWest: return 'SouthWest';
    case Direction.West:      return 'West';
    case Direction.NorthWest: return 'NorthWest';
    case Direction.Max:       return 'Max';
    }
  }

  static getVector3D(direction: Direction): Vector3D {
    switch (direction) {
    default:
      break;
    case Direction.North:
      return new Vector3D(0, -1, 0);
    case Direction.NorthEast:
      return new Vector3D(1, -1, 0); 
    case Direction.East:
      return new Vector3D(1, 0, 0);
    case Direction.SouthEast:
      return new Vector3D(1, 1, 0);
    case Direction.South:
      return new Vector3D(0, 1, 0);
    case Direction.SouthWest:
      return new Vector3D(-1, 1, 0);
    case Direction.West:
      return new Vector3D(-1, 0, 0);
    case Direction.NorthWest:
      return new Vector3D(-1, -1, 0);
    }
    console.error("unhandled direction:", direction);
    return new Vector3D(0, 0, 0);
  }

  static getFromPoints(from: Point2D, to: Point2D): Direction {
    return this.getFromVector(to.diff(from));
  }

  static getFromVector(w: Vector2D): Direction {
    const mag = w.mag();
    const u = new Vector2D(0, -mag); // 'north'
    // Add 22.5 to allow north to cover -22.5 - 22.5 deg.
    let theta = ((180 * u.angle(w)) / Math.PI) + 22.5;
    if (theta < 0) {
      const rotate = 180 + theta;
      theta = 180 + rotate;
    }
    const direction = Math.floor(theta / 45);
    return <Direction>direction;
  }

  static anticlockwise(direction: Direction, n: number): Direction {
    return 0xFF & ((direction << n) | (direction >>> (8 - n)));
  }
  
  static clockwise(direction: Direction, n: number): Direction {
    return 0xFF & ((direction >>> n) | (direction << (8 - n)));
  }

  static getAdjacents(direction: Direction): Array<Direction> {
    return [ this.anticlockwise(direction, 1),
             this.clockwise(direction, 1) ];
  }
  
  static getOpposite(direction: Direction): Direction {
    const n = 4;
    return this.anticlockwise(direction, n);
  }

  static neighbourOffsets = new Map<Direction, Coord>([
    [ Direction.North, new Coord(0, -1) ],
    [ Direction.NorthEast, new Coord(1, -1) ],
    [ Direction.East, new Coord(1, 0) ],
    [ Direction.SouthEast, new Coord(1, 1) ],
    [ Direction.South, new Coord(0, 1) ],
    [ Direction.SouthWest, new Coord(-1, 1) ],
    [ Direction.West, new Coord(-1, 0) ],
    [ Direction.NorthWest, new Coord(-1, -1) ],
  ]);

  static getNeighbourCoord(x: number,
                           y: number,
                           direction: Direction): Coord {
    console.assert(this.neighbourOffsets.has(direction));
    const offset = this.neighbourOffsets.get(direction)!;
    return new Coord(x + offset.x, y + offset.y);
  }
}

function inrange(coord: Coord,
                 grid: Array<Uint8Array>): boolean {
  if (coord.y < 0 || coord.y >= grid.length) {
    return false;
  }
  if (coord.x < 0 || coord.x >= grid[0].length) {
    return false;
  }
  return true;
}

const blockingCardinals = new Array<Uint8Array>(
  // None,
  new Uint8Array([ ]),
  // North,
  new Uint8Array([ Direction.North ]),
  // East,
  new Uint8Array([ Direction.East ]),
  // NorthEastCorner,
  new Uint8Array([ Direction.North, Direction.East ]),
  // South,
  new Uint8Array([ Direction.South ]),
  // NorthSouthCorridor,
  new Uint8Array([ Direction.North, Direction.South ]),
  // SouthEastCorner,
  new Uint8Array([ Direction.South, Direction.East ]),
  // EastPeninsula,
  new Uint8Array([ Direction.North, Direction.South, Direction.East ]),
  // West,
  new Uint8Array([ Direction.West ]),
  // NorthWestCorner,
  new Uint8Array([ Direction.North, Direction.West ]),
  // EastWestCorridor,
  new Uint8Array([ Direction.East, Direction.West ]),
  // NorthPeninsula,
  new Uint8Array([ Direction.North, Direction.East, Direction.West ]),
  // SouthWestCorner,
  new Uint8Array([ Direction.South, Direction.West ]),
  // WestPeninsula,
  new Uint8Array([ Direction.North, Direction.South, Direction.West ]),
  // SouthPeninsula,
  new Uint8Array([ Direction.South, Direction.East, Direction.West ]),
  // Spire,
  new Uint8Array([ Direction.North, Direction.South, Direction.East, Direction.West ]),
);

export type TerraceGrid = Array<Uint8Array>;
export type BlockingGrid = Array<Uint8Array>;

export function buildBlockingGrid(terraceGrid: TerraceGrid,
                                  edges: Array<Edge>,
                                  ramps: Array<Ramp>,
                                  blockingRamps = false,
                                  blockingUpHeight = 1,
                                  blockingDownHeight = 1): BlockingGrid {

  // Initialise new grid
  const blockingGrid = new Array<Uint8Array>();
  for (let i = 0; i < terraceGrid.length; ++i) {
    blockingGrid.push(new Uint8Array(terraceGrid[i].length));
  }

  // Top edge
  for (let x = 0; x < blockingGrid[0].length; ++x) {
    blockingGrid[0][x] |=
      Direction.North |
      Direction.NorthWest |
      Direction.NorthEast;
  }
  // Bottom edge
  for (let x = 0; x < blockingGrid[blockingGrid.length - 1].length; ++x) {
    const y = blockingGrid.length - 1;
    blockingGrid[y][x] |=
      Direction.South |
      Direction.SouthWest |
      Direction.SouthEast;
  }
  // Left edge
  for (let y = 0; y < blockingGrid.length; ++y) {
    blockingGrid[y][0] |=
      Direction.West |
      Direction.NorthWest |
      Direction.SouthWest;
  }
  // Right edge
  for (let y = 0; y < blockingGrid.length; ++y) {
    const x = blockingGrid[y].length - 1;
    blockingGrid[y][x] |=
      Direction.East |
      Direction.NorthEast |
      Direction.SouthEast;
  }

  // Nothing to do.
  if (blockingUpHeight < 1 && blockingDownHeight < 1) {
    return blockingGrid;
  }

  for (let edge of edges) {
    for (let cardinalDirection of blockingCardinals[edge.shape]) {
      const cardinalNeighbour: Coord = Compass.getNeighbourCoord(edge.x, edge.y, cardinalDirection);
      const edgeHeight = terraceGrid[edge.y][edge.x];
      const neighbourHeight = terraceGrid[cardinalNeighbour.y][cardinalNeighbour.x];
      const heightDiff = edgeHeight - neighbourHeight;

      const otherDirections = Compass.getAdjacents(cardinalDirection);
      const allDirections = otherDirections.concat([cardinalDirection]);

      if (heightDiff >= blockingUpHeight) {
        // Block the cardinal neighbour by all directions.
        for (let d of allDirections) {
          const fromDirection = Compass.getOpposite(d);
          // block the cardinal neighbour
          blockingGrid[cardinalNeighbour.y][cardinalNeighbour.x] |= fromDirection;

          // block the neighbours of the cardinal neighbour, including this edge.
          const neighbour = Compass.getNeighbourCoord(
            cardinalNeighbour.x,
            cardinalNeighbour.y,
            fromDirection,
          );
          if (inrange(neighbour, blockingGrid)) {
            blockingGrid[neighbour.y][neighbour.x] |= d;
          }
        }
        // Block the other, diagonal, neighbours too.
        for (let d of otherDirections) {
          const fromDirection = Compass.getOpposite(d);
          const neighbour: Coord = Compass.getNeighbourCoord(edge.x, edge.y, d);
          if (inrange(neighbour, terraceGrid)) {
            blockingGrid[neighbour.y][neighbour.x] |= fromDirection;
          }
        }
      }
    }
  }

  // Some edges will be ramps, so undo some of the blocking.
  const rampDirections = new Map<RampShape, Direction>([
    [ RampShape.North, Direction.North ],
    [ RampShape.East, Direction.East ],
    [ RampShape.South, Direction.South ],
    [ RampShape.West, Direction.West ],
  ]);

  for (let ramp of ramps) {
    const direction = rampDirections.get(ramp.shape)!;
    const oppositeDirection = Compass.getOpposite(direction);

    // The edge unblocks itself in one direction.
    blockingGrid[ramp.y][ramp.x] &= ~direction;

    // Two of its cardinal neighbours are then also unblocked.
    let neighbour = Compass.getNeighbourCoord(ramp.x, ramp.y, direction);
    blockingGrid[neighbour.y][neighbour.x] &= ~oppositeDirection;
    neighbour = Compass.getNeighbourCoord(ramp.x, ramp.y, oppositeDirection);
    blockingGrid[neighbour.y][neighbour.x] &= ~direction;
  }

  return blockingGrid;
}

export function isNeighbourAccessible(x: number,
                                      y: number,
                                      direction: Direction,
                                      grid: BlockingGrid): boolean {
  console.assert(y >= 0 && y < grid.length);
  console.assert(x >= 0 && x < grid[y].length);
  return (grid[y][x] & direction) == 0;
}

export function isCompletelyBlocked(x: number,
                                    y: number,
                                    grid: BlockingGrid): boolean {
  console.assert(y >= 0 && y < grid.length);
  console.assert(x >= 0 && x < grid[y].length);
  return grid[y][x] == 255;
}

const allDirections = new Array<Direction>(
  Direction.North,
  Direction.NorthEast,
  Direction.East,
  Direction.SouthEast,
  Direction.South,
  Direction.SouthWest,
  Direction.West,
  Direction.NorthWest
);

export function findPath(start: Coord,
                         end: Coord,
                         blockingGrid: BlockingGrid): Array<Coord> {
  if (start.x == end.x && start.y == end.y) {
    return new Array<Coord>();
  }

  if (isCompletelyBlocked(start.x, start.y, blockingGrid) ||
      isCompletelyBlocked(end.x, end.y, blockingGrid)) {
    return new Array<Coord>();
  }

  const coord  = (id: number): Coord => {
    const depth = blockingGrid.length;
    const width = blockingGrid[0].length;
    const x = Math.floor(id % width);
    const y = Math.floor((id - x) / depth);
    return new Coord(x, y);
  };

  const id = (coord: Coord): number => {
    const width = blockingGrid[0].length;
    return (width * coord.y) + coord.x;
  };

  // https://www.redblobgames.com/pathfinding/a-star/introduction.html
  const frontier = new MinPriorityQueue<number>();
  const cameFrom = new Map<number, number | null>();
  const costs = new Map<number, number>();
  const startId = id(start);
  const endId = id(end);
  frontier.insert(startId, 0);
  cameFrom.set(startId, null);
  costs.set(startId, 0);

  let currentId = startId;
  while (!frontier.empty()) {
    currentId = frontier.pop();
    if (currentId == endId) {
      break;
    }
    const current = coord(currentId);
    for (let direction of allDirections) {
      if (isNeighbourAccessible(current.x, current.y, direction, blockingGrid)) {
        const nextCoord = Compass.getNeighbourCoord(current.x, current.y, direction);
        const nextId = id(nextCoord);
        // TODO: ramps should cost more.
        const cost = Compass.isDiagonal(direction) ? 3 : 2;
        const new_cost = costs.get(currentId)! + cost;
        if (!costs.has(nextId) || new_cost < costs.get(nextId)!) {
          debugger;
          costs.set(nextId, new_cost);
          const priority = new_cost; // + heuristic(goal, next)
          frontier.insert(nextId, priority);
          cameFrom.set(nextId, currentId);
        }
      }
    }
  }

  // Failed to find path.
  if (currentId != endId) {
    return Array<Coord>();
  }
  const path = new Array<Coord>(coord(currentId));
  while (currentId != startId) {
    currentId = cameFrom.get(currentId!)!;
    path.push(coord(currentId));
  }
  path.reverse();
  return path.splice(1);
}
