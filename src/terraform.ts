import { Coord } from "./utils.ts";
import { MinPriorityQueue } from './queue.ts';

export type TerraceGrid = Array<Uint8Array>;
export type BlockingGrid = Array<Uint8Array>;

export const enum DirectionBit {
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

function isDiagonal(direction: DirectionBit) {
  const diagonal =
    DirectionBit.NorthEast |
    DirectionBit.SouthEast |
    DirectionBit.SouthWest |
    DirectionBit.NorthWest;
  return (direction & diagonal) != 0;
}

function directionName(direction: DirectionBit): string {
  switch (direction) {
  default: console.error('unhandled direction');
  case DirectionBit.North: return 'North';
  case DirectionBit.NorthEast: return 'NorthEast';
  case DirectionBit.East: return 'East';
  case DirectionBit.SouthEast: return 'SouthEast';
  case DirectionBit.South: return 'South';
  case DirectionBit.SouthWest: return 'SouthWest';
  case DirectionBit.West: return 'West';
  case DirectionBit.NorthWest: return 'NorthWest';
  case DirectionBit.Max: return 'Max';
  }
}

function rotateLeft(direction: DirectionBit, n: number): DirectionBit {
  return 0xFF & ((direction << n) | (direction >>> (8 - n)));
}

function rotateRight(direction: DirectionBit, n: number): DirectionBit {
  return 0xFF & ((direction >>> n) | (direction << (8 - n)));
}

export function getOpposite(direction: DirectionBit): DirectionBit {
  const n = 4;
  return rotateLeft(direction, n);
}

// This order is dependent on the loop in findEdges.
export const enum EdgeShape {
  None,               // 0
  North,              // 1
  East,               // 2
  NorthEastCorner,    // 3
  South,              // 4
  NorthSouthCorridor, // 5
  SouthEastCorner,    // 6
  EastPeninsula,      // 7
  West,               // 8
  NorthWestCorner,    // 9
  EastWestCorridor,   // 10
  NorthPeninsula,     // 11
  SouthWestCorner,    // 12
  WestPeninsula,      // 13
  SouthPeninsula,     // 14
  Spire,              // 15
  Max,
}

const blockingCardinals = new Array<Uint8Array>(
  // None,
  new Uint8Array([ ]),
  // North,
  new Uint8Array([ DirectionBit.North ]),
  // East,
  new Uint8Array([ DirectionBit.East ]),
  // NorthEastCorner,
  new Uint8Array([ DirectionBit.North, DirectionBit.East ]),
  // South,
  new Uint8Array([ DirectionBit.South ]),
  // NorthSouthCorridor,
  new Uint8Array([ DirectionBit.North, DirectionBit.South ]),
  // SouthEastCorner,
  new Uint8Array([ DirectionBit.South, DirectionBit.East ]),
  // EastPeninsula,
  new Uint8Array([ DirectionBit.North, DirectionBit.South, DirectionBit.East ]),
  // West,
  new Uint8Array([ DirectionBit.West ]),
  // NorthWestCorner,
  new Uint8Array([ DirectionBit.North, DirectionBit.West ]),
  // EastWestCorridor,
  new Uint8Array([ DirectionBit.East, DirectionBit.West ]),
  // NorthPeninsula,
  new Uint8Array([ DirectionBit.North, DirectionBit.East, DirectionBit.West ]),
  // SouthWestCorner,
  new Uint8Array([ DirectionBit.South, DirectionBit.West ]),
  // WestPeninsula,
  new Uint8Array([ DirectionBit.North, DirectionBit.South, DirectionBit.West ]),
  // SouthPeninsula,
  new Uint8Array([ DirectionBit.South, DirectionBit.East, DirectionBit.West ]),
  // Spire,
  new Uint8Array([ DirectionBit.North, DirectionBit.South, DirectionBit.East, DirectionBit.West ]),
);

export class Edge {
  constructor(private readonly _shape: EdgeShape,
              private readonly _x: number,
              private readonly _y: number) {
    Object.freeze(this);
  }
  get shape(): EdgeShape {
    return this._shape;
  }
  get x(): number {
    return this._x;
  }
  get y(): number {
    return this._y;
  }
}

export const enum RampShape {
  North,
  East,
  South,
  West,
  Max,
}

export class Ramp {
  constructor(private readonly _shape: RampShape,
              private readonly _x: number,
              private readonly _y: number) {
    Object.freeze(this);
  }
  get shape(): RampShape { return this._shape; }
  get x(): number { return this._x; }
  get y(): number { return this._y; }
}

export function findEdges(terraceGrid: TerraceGrid): Array<Edge> {
  const neighbourOffsets: Array<Coord> = [
    new Coord(0, -1), // N
    new Coord(1, 0),  // E
    new Coord(0, 1),  // S
    new Coord(-1, 0), // W
  ];

  const edges = new Array<Edge>();

  const maxX = terraceGrid[0].length;
  const maxY = terraceGrid.length;
  for (let centreY = 0; centreY < maxY; ++centreY) {
    for (let centreX = 0; centreX < maxX; ++centreX) {
      const centreTerrace = terraceGrid[centreY][centreX];
      let centreEdges = <number> EdgeShape.None;
      for (let i = 0; i < 4; ++i) {
        const offset = neighbourOffsets[i];
        const neighbourX = centreX + offset.x;
        const neighbourY = centreY + offset.y;

        if (neighbourX < 0 || neighbourX >= maxX ||
            neighbourY < 0 || neighbourY >= maxY) {
          continue;
        }

        // This assignment defines the values of EdgeShape.
        if (terraceGrid[neighbourY][neighbourX] < centreTerrace) {
          // north = 1;
          // east = 2;
          // south = 4;
          // west = 8;
          centreEdges |= 1 << i;
        }
      }
      const shape = <EdgeShape>centreEdges;
      if (shape == EdgeShape.None) {
        continue;
      }
      console.assert(shape < EdgeShape.Max);
      edges.push(new Edge(shape, centreX, centreY));
    }
  }
  return edges;
}

export function findRamps(terraceGrid: TerraceGrid,
                          edges: Array<Edge>,
                          extraDistance = 0): Array<Ramp> {

  const NORTH = 0;
  const EAST = 1;
  const SOUTH = 2;
  const WEST = 3;
  const neighbourOffsets: Array<Coord> = [
    new Coord(0, -1), // N
    new Coord(1, 0),  // E
    new Coord(0, 1),  // S
    new Coord(-1, 0), // W
  ];
  // Minimum distance to consider, past the centre position, is two blocks:
  //
  //  ----->
  //    _ _ _
  // _ | | | |
  //     _ _
  //    /   \
  const minDistance = 1;
  const distance = minDistance + extraDistance;

  const areNeighbourTerracesEqual = (x: number, y: number, direction: number) => {
    const offset = neighbourOffsets[direction];
    const centreTerrace = terraceGrid[y][x];
    for (let i = 1; i < distance; ++i) {
      const neighbourY = y + (i * offset.y);
      const neighbourX = x + (i * offset.x);
      const neighbourTerrace = terraceGrid[neighbourY][neighbourX];
      if (neighbourTerrace != centreTerrace) {
        return false;
      }
    }
    return true;
  }
  const areNeighbourTerracesLower = (x: number, y: number, direction: number) => {
    const offset = neighbourOffsets[direction];
    const centreTerrace = terraceGrid[y][x];
    for (let i = 1; i < distance; ++i) {
      const neighbourY = y + (i * offset.y);
      const neighbourX = x + (i * offset.x);
      const neighbourTerrace = terraceGrid[neighbourY][neighbourX];
      if (neighbourTerrace != centreTerrace - 1) {
        return false;
      }
    }
    return true;
  }

  const minX = distance;
  const minY = distance;
  const maxX = terraceGrid[0].length - distance;
  const maxY = terraceGrid.length - distance;
  const ramps = new Array<Ramp>();
  for (let edge of edges) {
    const x = edge.x;
    const y = edge.y;
    if (x < minX || x >= maxX || y < minY || y >= maxY) {
      continue;
    }
    switch (edge.shape) {
    default: break;
    case EdgeShape.North:
    case EdgeShape.NorthPeninsula:
      if (areNeighbourTerracesLower(x, y, NORTH) &&
          areNeighbourTerracesEqual(x, y, SOUTH)) {
        ramps.push(new Ramp(RampShape.North, x, y));
      }
      break;
    case EdgeShape.South:
    case EdgeShape.SouthPeninsula:
      if (areNeighbourTerracesLower(x, y, SOUTH) &&
          areNeighbourTerracesEqual(x, y, NORTH)) {
        ramps.push(new Ramp(RampShape.South, x, y));
      }
      break;
    case EdgeShape.East:
    case EdgeShape.EastPeninsula:
      if (areNeighbourTerracesLower(x, y, EAST) &&
          areNeighbourTerracesEqual(x, y, WEST)) {
        ramps.push(new Ramp(RampShape.East, x, y));
      }
      break;
    case EdgeShape.West:
    case EdgeShape.WestPeninsula:
      if (areNeighbourTerracesLower(x, y, WEST) &&
          areNeighbourTerracesEqual(x, y, EAST)) {
        ramps.push(new Ramp(RampShape.West, x, y));
      }
      break;
    }
  }
  return ramps;
}

const neighbourOffsets = new Map<DirectionBit, Coord>([
  [ DirectionBit.North, new Coord(0, -1) ],
  [ DirectionBit.NorthEast, new Coord(1, -1) ],
  [ DirectionBit.East, new Coord(1, 0) ],
  [ DirectionBit.SouthEast, new Coord(1, 1) ],
  [ DirectionBit.South, new Coord(0, 1) ],
  [ DirectionBit.SouthWest, new Coord(-1, 1) ],
  [ DirectionBit.West, new Coord(-1, 0) ],
  [ DirectionBit.NorthWest, new Coord(-1, -1) ],
]);

function getNeighbourCoord(x: number,
                           y: number,
                           direction: DirectionBit): Coord {
  console.assert(neighbourOffsets.has(direction));
  const offset = neighbourOffsets.get(direction)!;
  return new Coord(x + offset.x, y + offset.y);
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
      DirectionBit.North |
      DirectionBit.NorthWest |
      DirectionBit.NorthEast;
  }
  // Bottom edge
  for (let x = 0; x < blockingGrid[blockingGrid.length - 1].length; ++x) {
    const y = blockingGrid.length - 1;
    blockingGrid[y][x] |=
      DirectionBit.South |
      DirectionBit.SouthWest |
      DirectionBit.SouthEast;
  }
  // Left edge
  for (let y = 0; y < blockingGrid.length; ++y) {
    blockingGrid[y][0] |=
      DirectionBit.West |
      DirectionBit.NorthWest |
      DirectionBit.SouthWest;
  }
  // Right edge
  for (let y = 0; y < blockingGrid.length; ++y) {
    const x = blockingGrid[y].length - 1;
    blockingGrid[y][x] |=
      DirectionBit.East |
      DirectionBit.NorthEast |
      DirectionBit.SouthEast;
  }

  // Nothing to do.
  if (blockingUpHeight < 1 && blockingDownHeight < 1) {
    return blockingGrid;
  }

  for (let edge of edges) {
    for (let cardinalDirection of blockingCardinals[edge.shape]) {
      const cardinalNeighbour: Coord = getNeighbourCoord(edge.x, edge.y, cardinalDirection);
      const edgeHeight = terraceGrid[edge.y][edge.x];
      const neighbourHeight = terraceGrid[cardinalNeighbour.y][cardinalNeighbour.x];
      const heightDiff = edgeHeight - neighbourHeight;

      const otherDirections = [
        rotateRight(cardinalDirection, 1),
        rotateLeft(cardinalDirection, 1),
      ];
      const allDirections = [
        rotateRight(cardinalDirection, 1),
        cardinalDirection,
        rotateLeft(cardinalDirection, 1),
      ];

      if (heightDiff >= blockingUpHeight) {
        // Block the cardinal neighbour by all directions.
        for (let d of allDirections) {
          const fromDirectionBit = getOpposite(d);
          // block the cardinal neighbour
          blockingGrid[cardinalNeighbour.y][cardinalNeighbour.x] |= fromDirectionBit;

          // block the neighbours of the cardinal neighbour, including this edge.
          const neighbour = getNeighbourCoord(
            cardinalNeighbour.x,
            cardinalNeighbour.y,
            fromDirectionBit,
          );
          if (inrange(neighbour, blockingGrid)) {
            blockingGrid[neighbour.y][neighbour.x] |= d;
          }
        }
        // Block the other, diagonal, neighbours too.
        for (let d of otherDirections) {
          const fromDirectionBit = getOpposite(d);
          const neighbour: Coord = getNeighbourCoord(edge.x, edge.y, d);
          if (inrange(neighbour, terraceGrid)) {
            blockingGrid[neighbour.y][neighbour.x] |= fromDirectionBit;
          }
        }
      }
    }
  }

  // Some edges will be ramps, so undo some of the blocking.
  const rampDirections = new Map<RampShape, DirectionBit>([
    [ RampShape.North, DirectionBit.North ],
    [ RampShape.East, DirectionBit.East ],
    [ RampShape.South, DirectionBit.South ],
    [ RampShape.West, DirectionBit.West ],
  ]);

  for (let ramp of ramps) {
    const direction = rampDirections.get(ramp.shape)!;
    const oppositeDirection = getOpposite(direction);

    // The edge unblocks itself in one direction.
    blockingGrid[ramp.y][ramp.x] &= ~direction;

    // Two of its cardinal neighbours are then also unblocked.
    let neighbour = getNeighbourCoord(ramp.x, ramp.y, direction);
    blockingGrid[neighbour.y][neighbour.x] &= ~oppositeDirection;
    neighbour = getNeighbourCoord(ramp.x, ramp.y, oppositeDirection);
    blockingGrid[neighbour.y][neighbour.x] &= ~direction;
  }

  return blockingGrid;
}

export function isNeighbourAccessible(x: number,
                                      y: number,
                                      direction: DirectionBit,
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

const allDirections = new Array<DirectionBit>(
  DirectionBit.North,
  DirectionBit.NorthEast,
  DirectionBit.East,
  DirectionBit.SouthEast,
  DirectionBit.South,
  DirectionBit.SouthWest,
  DirectionBit.West,
  DirectionBit.NorthWest
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
        const nextCoord = getNeighbourCoord(current.x, current.y, direction);
        const nextId = id(nextCoord);
        // TODO: ramps should cost more.
        const cost = isDiagonal(direction) ? 3 : 2;
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
