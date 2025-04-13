import {
  Biome,
  getBiomeName
} from './biomes.ts';
import { ContextImpl } from './context.ts';
import {
  Sprite,
  SpriteSheet,
  GraphicComponent,
  StaticGraphicComponent,
} from './graphics.ts';
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
  constructor(private _shape: EdgeShape,
              private readonly _x: number,
              private readonly _y: number) {
  }
  get shape(): EdgeShape {
    return this._shape;
  }
  set shape(s: EdgeShape) {
    this._shape = s;
  }
  get x(): number {
    return this._x;
  }
  get y(): number {
    return this._y;
  }
  addCardinalEdge(direction: EdgeShape): void {
    this.shape |= direction;
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
  const minX = distance;
  const minY = distance;
  const maxX = terraceGrid[0].length - distance;
  const maxY = terraceGrid.length - distance;
  const ramps = new Array<Ramp>();

  const edgesToAvoid = [
    EdgeShape.North,
    EdgeShape.East,
    EdgeShape.South,
    EdgeShape.West,
    EdgeShape.NorthPeninsula,
    EdgeShape.EastPeninsula,
    EdgeShape.SouthPeninsula,
    EdgeShape.WestPeninsula,
  ];

  const avoidEdgeAt = (x: number, y: number): boolean => {
    const edge = edges.find((edge) => edge.x == x && edge.y == y);
    if (edge != undefined) {
      return edgesToAvoid.some((avoid) => avoid == edge.shape);
    };
    return false;
  };

  const areNeighbourTerracesEqual = (x: number, y: number, direction: number) => {
    const offset = neighbourOffsets[direction];
    const closestNeighbourX = x + offset.x;
    const closestNeighbourY = y + offset.y;
    if (avoidEdgeAt(closestNeighbourX, closestNeighbourY)) {
      return false;
    }
    const centreTerrace = terraceGrid[y][x];
    for (let i = 1; i <= distance; ++i) {
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
    const closestNeighbourX = x + offset.x;
    const closestNeighbourY = y + offset.y;
    if (avoidEdgeAt(closestNeighbourX, closestNeighbourY)) {
      return false;
    }
    const centreTerrace = terraceGrid[y][x];
    for (let i = 1; i <= distance; ++i) {
      const neighbourY = y + (i * offset.y);
      const neighbourX = x + (i * offset.x);
      const neighbourTerrace = terraceGrid[neighbourY][neighbourX];
      if (neighbourTerrace != centreTerrace - 1) {
        return false;
      }
    }
    return true;
  }

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
        ramps.push(new Ramp(RampShape.South, x, y));
      }
      break;
    case EdgeShape.South:
    case EdgeShape.SouthPeninsula:
      if (areNeighbourTerracesLower(x, y, SOUTH) &&
          areNeighbourTerracesEqual(x, y, NORTH)) {
        ramps.push(new Ramp(RampShape.North, x, y));
      }
      break;
    case EdgeShape.East:
    case EdgeShape.EastPeninsula:
      if (areNeighbourTerracesLower(x, y, EAST) &&
          areNeighbourTerracesEqual(x, y, WEST)) {
        ramps.push(new Ramp(RampShape.West, x, y));
      }
      break;
    case EdgeShape.West:
    case EdgeShape.WestPeninsula:
      if (areNeighbourTerracesLower(x, y, WEST) &&
          areNeighbourTerracesEqual(x, y, EAST)) {
        ramps.push(new Ramp(RampShape.East, x, y));
      }
      break;
    }
  }

  const isRampAt = (x: number, y: number): boolean => {
    return ramps.some((ramp) => ramp.x == x && ramp.y == y);
  };

  // Adding ramps will create more edges...
  const addEdge = (x: number, y: number, offset: Coord,
                   edgeShape: EdgeShape) => {
    const neighbourX = x + offset.x;
    const neighbourY = y + offset.y;
    if (isRampAt(neighbourX, neighbourY)) {
      return;
    }
    const edge = edges.find((edge) => edge.x == neighbourX && edge.y == neighbourY);
    if (edge != undefined) {
      edge.addCardinalEdge(edgeShape);
    } else {
      edges.push(new Edge(edgeShape, neighbourX, neighbourY));
    }
  }
  for (const ramp of ramps) {
    const x = ramp.x;
    const y = ramp.y;
    switch (ramp.shape) {
    case RampShape.North:
    case RampShape.South:
      addEdge(x, y, neighbourOffsets[EAST], EdgeShape.West);
      addEdge(x, y, neighbourOffsets[WEST], EdgeShape.East);
      break;
    case RampShape.East:
    case RampShape.West:
      addEdge(x, y, neighbourOffsets[NORTH], EdgeShape.South);
      addEdge(x, y, neighbourOffsets[SOUTH], EdgeShape.North);
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
    blockingGrid[ramp.y][ramp.x] &= ~oppositeDirection;

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

export function normaliseHeightGrid(heightGrid: Array<Array<number>>,
                                    numTerraces: number): number {
  // Normalise heights, minimum = 0;
  const cellsY = heightGrid.length;
  const cellsX = heightGrid[0].length;
  let minHeight = 0;
  let maxHeight = 0;
  for (let y = 0; y < cellsY; y++) {
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
    for (let y = 0; y < cellsY; y++) {
      for (let x = 0; x < cellsX; x++) {
        heightGrid[y][x] += minHeight;
      }
    }
    maxHeight += minHeight;
  }
  return maxHeight / numTerraces;
}

export function buildTerraceGrid(heightGrid: Array<Array<number>>,
                                 terraceSpacing: number): Array<Uint8Array> {
  const cellsY = heightGrid.length;
  const cellsX = heightGrid[0].length;
  const terraceGrid = new Array<Uint8Array>();
  for (let y = 0; y < cellsY; y++) {
    terraceGrid[y] = new Uint8Array(cellsX);
    for (let x = 0; x < cellsX; x++) {
      const surfaceHeight = heightGrid[y][x];
      terraceGrid[y][x] =
        Math.floor(surfaceHeight / terraceSpacing);
    }
  }
  return terraceGrid;
}

export const enum TerrainShape {
  Flat,                 // 0
  Wall,                 // 1
  NorthEdge,            // 2
  EastEdge,             // 3
  NorthEastCorner,      // 4
  SouthEdge,            // 5
  NorthSouthCorridor,   // 6
  SouthEastCorner,      // 7
  EastPeninsula,        // 8
  WestEdge,             // 9
  NorthWestCorner,      // 10
  EastWestCorridor,     // 11
  NorthPeninsula,       // 12
  SouthWestCorner,      // 13
  WestPeninsula,        // 14
  SouthPeninsula,       // 15
  Spire,                // 16
  RampNorth,            // 17
  RampEast,             // 18
  RampSouth,            // 19
  RampWest,             // 20
  Max,                  // 21
}

export const enum TerrainType {
  Water,
  Snow,
  Sand,
  Rock,
  Mud,
  DryGrass,
  WetGrass
}

export function getTerrainShapeName(terrain: TerrainShape): string {
  switch (terrain) {
    default:
      console.error("unhandled terrain shape:", terrain);
      return "invalid shape";
    case TerrainShape.Flat:
      return "TerrainShape.Flat";
    case TerrainShape.Wall:
      return "TerrainShape.Wall";
    case TerrainShape.NorthEdge:
      return "TerrainShape.NorthEdge";
    case TerrainShape.EastEdge:
      return "TerrainShape.EastEdge";
    case TerrainShape.NorthEastCorner:
      return "TerrainShape.NorthEastCorner";
    case TerrainShape.SouthEdge:
      return "TerrainShape.SouthEdge";
    case TerrainShape.NorthSouthCorridor:
      return "TerrainShape.NorthSouthCorridor";
    case TerrainShape.SouthEastCorner:
      return "TerrainShape.SouthEastCorner";
    case TerrainShape.EastPeninsula:
      return "TerrainShape.EastPeninsula";
    case TerrainShape.WestEdge:
      return "TerrainShape.WestEdge";
    case TerrainShape.NorthWestCorner:
      return "TerrainShape.NorthWestCorner";
    case TerrainShape.EastWestCorridor:
      return "TerrainShape.EastWestCorridor";
    case TerrainShape.NorthPeninsula:
      return "TerrainShape.NorthPeninsula";
    case TerrainShape.SouthWestCorner:
      return "TerrainShape.SouthWestCorner";
    case TerrainShape.WestPeninsula:
      return "TerrainShape.WestPeninsula";
    case TerrainShape.SouthPeninsula:
      return "TerrainShape.SouthPeninsula";
    case TerrainShape.Spire:
      return "TerrainShape.Spire";
    case TerrainShape.RampNorth:
      return "TerrainShape.RampNorth";
    case TerrainShape.RampEast:
      return "TerrainShape.RampEast";
    case TerrainShape.RampSouth:
      return "TerrainShape.RampSouth";
    case TerrainShape.RampWest:
      return "TerrainShape.RampWest";
  }
}

export function getTerrainTypeName(terrain: TerrainType): string {
  switch (terrain) {
  default:
    console.error("unhandled terrain type:", terrain);
    return "invalid terrain";
  case TerrainType.Water:
    return "TerrainType.Water";
  case TerrainType.Snow:
    return "TerrainType.Snow";
  case TerrainType.Sand:
    return "TerrainType.Sand";
  case TerrainType.Rock:
    return "TerrainType.Rock";
  case TerrainType.Mud:
    return "TerrainType.Mud";
  case TerrainType.DryGrass:
    return "TerrainType.DryGrass";
  case TerrainType.WetGrass:
    return "TerrainType.WetGrass";
  }
}

export interface TerrainSpriteDescriptor {
  spriteWidth: number;
  spriteHeight: number;
  spriteSheetName: string;
  tileRowTypes: Array<TerrainType>;
  tileColumnShapes: Array<TerrainShape>;
  waterColour: string;
  snowColour: string;
  sandColour: string;
  rockColour: string;
  mudColour: string;
  dryGrassColour: string;
  wetGrassColour: string;
  lightUndergroundColour: string;
  darkUndergroundColour: string;
  lightUnderwaterColour: string;
  darkUnderwaterColour: string;
};

export class TerrainGraphics {
  private static readonly defaultSupportedShapes_ = new Map<TerrainShape, boolean>([
    [ TerrainShape.Flat,               true ],
    [ TerrainShape.Wall,               false ],
    [ TerrainShape.NorthEdge,          false ],
    [ TerrainShape.EastEdge,           false ],
    [ TerrainShape.NorthEastCorner,    false ],
    [ TerrainShape.SouthEdge,          false ],
    [ TerrainShape.NorthSouthCorridor, false ],
    [ TerrainShape.SouthEastCorner,    false ],
    [ TerrainShape.EastPeninsula,      false ],
    [ TerrainShape.WestEdge,           false ],
    [ TerrainShape.NorthWestCorner,    false ],
    [ TerrainShape.EastWestCorridor,   false ],
    [ TerrainShape.NorthPeninsula,     false ],
    [ TerrainShape.SouthWestCorner,    false ],
    [ TerrainShape.WestPeninsula,      false ],
    [ TerrainShape.SouthPeninsula,     false ],
    [ TerrainShape.Spire,              false ],
    [ TerrainShape.RampNorth,          false ],
    [ TerrainShape.RampEast,           false ],
    [ TerrainShape.RampSouth,          false ],
    [ TerrainShape.RampWest,           false ],
  ]);
  private static supportedShapes_ = new Map<TerrainShape, boolean>(this.defaultSupportedShapes_);
    
  private static graphics_ = new Map<
    TerrainType,
    Map<TerrainShape, GraphicComponent>
  >();

  static reset(): void {
    this.graphics_ = new Map<
      TerrainType,
      Map<TerrainShape, GraphicComponent>
    >();
    this.supportedShapes_ = new Map<TerrainShape, boolean>(this.defaultSupportedShapes_);
  }

  static isSupportedShape(shape: TerrainShape): boolean {
    return this.supportedShapes_.get(shape)!;
  }

  static setSupportedShape(shape: TerrainShape): void {
    this.supportedShapes_.set(shape, true);
  }

  static isSupportedType(ty: TerrainType): boolean {
    return this.graphics_.has(ty);
  }

  static graphics(
    terrainType: TerrainType,
    shape: TerrainShape
  ): GraphicComponent {
    if (!this.graphics_.has(terrainType)) {
      console.error(
        "missing graphics for TerrainType:",
        getTerrainTypeName(terrainType)
      );
    } else if (!this.graphics_.get(terrainType)!.has(shape)) {
      console.error(
        "missing graphics for TerrainShape:",
        getTerrainShapeName(shape)
      );
    }
    return this.graphics_.get(terrainType)!.get(shape)!;
  }

  private static addGraphic(
    terrainType: TerrainType,
    terrainShape: TerrainShape,
    sheet: SpriteSheet,
    x: number,
    y: number,
    width: number,
    height: number
  ) {
    const spriteId = Sprite.create(sheet, x, y, width, height);
    const component = new StaticGraphicComponent(spriteId);
    if (!this.graphics_.has(terrainType)) {
      this.graphics_.set(
        terrainType,
        new Map<TerrainShape, GraphicComponent>()
      );
    }
    this.graphics_.get(terrainType)!.set(terrainShape, component);
    this.setSupportedShape(terrainShape);
  }

  static async generateSprites(desc: TerrainSpriteDescriptor,
                               context: ContextImpl): Promise<void> {
    console.log('generateSprites');
    if (Object.hasOwn(desc, 'spriteSheetName')) {
      await SpriteSheet.create(desc.spriteSheetName, context).then((sheet) => {
        const width = desc.spriteWidth;
        const height = desc.spriteHeight;
        const columns = desc.tileColumnShapes.length;
        const rows = desc.tileRowTypes.length;
        for (let row = 0; row < rows; ++row) {
          const terrainType = desc.tileRowTypes[row];
          for (let column = 0; column < columns; ++column) {
            const terrainShape = desc.tileColumnShapes[column];
            this.addGraphic(
              terrainType,
              terrainShape,
              sheet,
              width * column,
              height * row,
              width,
              height
            );
          }
        }
      });
    } else {
      const generator = new SpriteGenerator(desc);
      const canvas = generator.generateCanvas();
      await SpriteSheet.createFromCanvas(canvas, context).then((sheet) => {
        const width = desc.spriteWidth;
        const height = desc.spriteHeight;
        const columns = desc.tileColumnShapes.length;
        const rows = desc.tileRowTypes.length;
        for (let row = 0; row < rows; ++row) {
          const terrainType = desc.tileRowTypes[row];
          for (let column = 0; column < columns; ++column) {
            const terrainShape = desc.tileColumnShapes[column];
            this.addGraphic(
              terrainType,
              terrainShape,
              sheet,
              width * column,
              height * row,
              width,
              height
            );
          }
        }
      });
    }
  }
}

export function isRamp(terrain: TerrainShape): boolean {
  switch (terrain) {
  default:
     break;
  case TerrainShape.RampNorth:
  case TerrainShape.RampEast:
  case TerrainShape.RampSouth:
  case TerrainShape.RampWest:
    return true;
  }
  return false;
}

export function isEdge(terrain: TerrainShape): boolean {
  return !isRamp(terrain) && terrain != TerrainShape.Flat;
}

export function buildTerrainShapeGrid(terraceGrid: Array<Uint8Array>,
                                      edges: Array<Edge>,
                                      ramps: Array<Ramp>): Array<Uint8Array> {

  const cellsY = terraceGrid.length;
  const cellsX = terraceGrid[0].length;
  const terrainShapes = new Array<Uint8Array>();
  for (let y = 0; y < cellsY; ++y) {
    terrainShapes[y] = new Uint8Array(cellsX).fill(TerrainShape.Flat);
  }

  const edgeToShape = new Map<EdgeShape, Uint8Array>([
    [ EdgeShape.None,
      new Uint8Array([ TerrainShape.Flat ])
    ],
    [ EdgeShape.North,
      new Uint8Array([ TerrainShape.NorthEdge ])
    ],
    [ EdgeShape.East,
      new Uint8Array([ TerrainShape.EastEdge ])
    ],
    [ EdgeShape.NorthEastCorner,
      new Uint8Array([ TerrainShape.NorthEastCorner,
                       TerrainShape.EastEdge,
                       TerrainShape.NorthEdge ])
    ],
    [ EdgeShape.South,
      new Uint8Array([ TerrainShape.SouthEdge ])
    ],
    [ EdgeShape.NorthSouthCorridor,
      new Uint8Array([ TerrainShape.NorthSouthCorridor,
                       TerrainShape.EastEdge ])
    ],
    [ EdgeShape.SouthEastCorner,
      new Uint8Array([ TerrainShape.SouthEastCorner,
                       TerrainShape.EastEdge,
                       TerrainShape.SouthEdge ])
    ],
    [ EdgeShape.EastPeninsula,
      new Uint8Array([ TerrainShape.EastPeninsula,
                       TerrainShape.NorthEastCorner,
                       TerrainShape.SouthEastCorner,
                       TerrainShape.EastEdge,
                       TerrainShape.NorthEdge,
                       TerrainShape.SouthEdge ])
    ],
    [ EdgeShape.West,
      new Uint8Array([ TerrainShape.WestEdge ])
    ],
    [ EdgeShape.NorthWestCorner,
      new Uint8Array([ TerrainShape.NorthWestCorner,
                       TerrainShape.NorthEdge,
                       TerrainShape.WestEdge ])
    ],
    [ EdgeShape.EastWestCorridor,
      new Uint8Array([ TerrainShape.EastWestCorridor,
                       TerrainShape.NorthEdge,
                       TerrainShape.SouthEdge ])
    ],
    [ EdgeShape.NorthPeninsula,
      new Uint8Array([ TerrainShape.NorthPeninsula,
                       TerrainShape.NorthEastCorner,
                       TerrainShape.NorthWestCorner,
                       TerrainShape.EastEdge,
                       TerrainShape.NorthEdge,
                       TerrainShape.WestEdge ])
    ],
    [ EdgeShape.SouthWestCorner,
      new Uint8Array([ TerrainShape.SouthWestCorner,
                       TerrainShape.SouthEdge,
                       TerrainShape.WestEdge ])
    ],
    [ EdgeShape.WestPeninsula,
      new Uint8Array([ TerrainShape.WestPeninsula,
                       TerrainShape.NorthWestCorner,
                       TerrainShape.NorthEdge,
                       TerrainShape.SouthEdge,
                       TerrainShape.WestEdge ])
    ],
    [ EdgeShape.SouthPeninsula,
      new Uint8Array([ TerrainShape.SouthPeninsula,
                       TerrainShape.SouthEastCorner,
                       TerrainShape.SouthWestCorner,
                       TerrainShape.EastEdge,
                       TerrainShape.NorthEdge,
                       TerrainShape.WestEdge ])
    ],
    [ EdgeShape.Spire,
      new Uint8Array([ TerrainShape.Spire,
                       TerrainShape.EastPeninsula,
                       TerrainShape.NorthPeninsula,
                       TerrainShape.NorthEastCorner,
                       TerrainShape.EastEdge,
                       TerrainShape.NorthEdge,
                       TerrainShape.SouthEdge,
                       TerrainShape.WestEdge ])
    ],
  ]);

  const foundSupported = (edge: Edge) => {
    console.assert(edgeToShape.has(edge.shape));
    const shapes = edgeToShape.get(edge.shape)!;
    for (const shape of shapes) {
      if (TerrainGraphics.isSupportedShape(shape)) {
        terrainShapes[edge.y][edge.x] = shape;
        return true;
      }
    }
    return false;
  };

  const defaultWall = TerrainGraphics.isSupportedShape(TerrainShape.Wall)
                    ? TerrainShape.Wall
                    : TerrainShape.Flat;
  for (let edge of edges) {
    if (!foundSupported(edge)) {
      terrainShapes[edge.y][edge.x] = defaultWall;
    }
  }

  // If ramps are requested, all ramps are supported.
  const rampToShape = new Map<RampShape, TerrainShape>([
    [ RampShape.North,  TerrainShape.RampNorth ],
    [ RampShape.East,   TerrainShape.RampEast ],
    [ RampShape.South,  TerrainShape.RampSouth ],
    [ RampShape.West,   TerrainShape.RampWest ],
  ]);
  for (let ramp of ramps) {
    terrainShapes[ramp.y][ramp.x] = rampToShape.get(ramp.shape)!;
  }

  return terrainShapes;
}

export function buildTerrainTypeGrid(biomeGrid: Array<Uint8Array>,
                                     defaultTerrainType: TerrainType): Array<Uint8Array> {
  const cellsY = biomeGrid.length;
  const cellsX = biomeGrid[0].length;
  const typeGrid = new Array<Uint8Array>();
  for (let y = 0; y < cellsY; y++) {
    typeGrid[y] = new Uint8Array(cellsX).fill(defaultTerrainType);
    for (let x = 0; x < cellsX; x++) {
      const biome = biomeGrid[y][x];
      let terrain = defaultTerrainType;
      switch (biome) {
        default:
          console.error("unhandled biome:", getBiomeName(biome));
          break;
        case Biome.Water:
          terrain = TerrainType.Water;
          break;
        case Biome.Desert:
          terrain = TerrainType.Sand;
          break;
        case Biome.Savanna:
        case Biome.Steppe:
          terrain = TerrainType.DryGrass;
          break;
        case Biome.Woodland:
          terrain = TerrainType.WetGrass;
          break;
        case Biome.Rainforest:
          terrain = TerrainType.Mud;
          break;
        case Biome.AlpineDesert:
          terrain = TerrainType.Snow;
          break;
        case Biome.AlpineTundra:
        case Biome.SubalpineForest:
          terrain = TerrainType.Rock;
          break;
      }
      // Only change the type if it's supported.
      if (TerrainGraphics.isSupportedType(terrain)) {
        typeGrid[y][x] = terrain;
      } else {
        console.log(
          "unsupported biome terrain type:",
          getTerrainTypeName(terrain)
        );
      }
    }
  }
  return typeGrid;
}

class SpriteGenerator {
  private _canvas: OffscreenCanvas;
  private _ctx: OffscreenCanvasRenderingContext2D;
  private _width: number;
  private _height: number;
  private _colours: Array<string>;
  private _top: Coord;
  private _rightOfTop: Coord;
  private _topRight: Coord;
  private _bottomRight: Coord;
  private _rightOfBottom: Coord;
  private _bottom: Coord;
  private _leftOfBottom: Coord;
  private _bottomLeft: Coord;
  private _topLeft: Coord;
  private _leftOfTop: Coord;
  private _mid: Coord;
  private _leftOfMid: Coord;
  private _rightOfMid: Coord;
  private _backCorner: Coord;

  constructor(private readonly _descriptor: TerrainSpriteDescriptor) {
    // The incoming width should be divisible by four, so that we can calculate
    // the y delta, between top and topLeft/Right, without rounding. We also want
    // a mid point which also doesn't require rounding.

    // So, firstly round the width and calculate yDelta.
    this.width = this.descriptor.spriteWidth;
    this.height = this.descriptor.spriteHeight;
    const widthRem = Math.floor(this.width % 4);
    if (widthRem < 2) {
      this.width +- widthRem;
    } else {
      this.width += widthRem;
    }
    const yDelta = this.width >> 2;
    const midX = Math.floor(0.5 * this.width) - 1;
    const bottomY = this.height - 1 - yDelta;

    // Say we've rounded the width to 20, yDelta would be 5. From the 'top' point
    // we will move 10 units in the x axis and 5 in the y.
    // 0 ... 19
    //
    // Splitting into two sides gives us two sets of points:
    // 0,   1,  2,  3,  4,  5,  6,  7,  8,  9
    // 10, 11, 12, 13, 14, 15, 16, 17, 18, 19
    //
    // In the y-axis we have: 0, 1, 2, 3, 4.
    // If we map the points using the y-axis we get two sets:
    //
    // (0, 4),  (2, 3),   (4, 2), (6, 1),  (8, 0)
    // (10, 0), (12, 1), (14, 2), (16, 3), (18, 4)
    //
    // Which means we have a single point (9, 0), that is in the middle, but not
    // a member of either set.
    //
    //
    //                  * 'top'
    //                /   \
    //               /     \
    //    'topLeft' *       * 'topRight'
    //              |\     /|
    //              | \   / |
    //              |   *   |
    //'bottomLeft'  *   |   * 'bottomRight'
    //               \  |  /
    //                \ | /
    //                  *
    //              'bottom'

    // Clockwise from top
    this.top = new Coord(midX, 0);
    this.rightOfTop = new Coord(midX + 1, 0);
    this.topRight = new Coord(this.width - 1, yDelta);
    this.bottomRight = new Coord(this.width - 1, bottomY);
    this.rightOfBottom = new Coord(midX + 1, this.height - 1);
    this.bottom = new Coord(midX, this.height - 1);
    this.leftOfBottom = new Coord(midX - 1, this.height - 1);
    this.bottomLeft = new Coord(0, bottomY);
    this.topLeft = new Coord(0, yDelta); 
    this.leftOfTop = new Coord(midX - 1, 0);
    
    this.mid = new Coord(midX, yDelta * 2);
    this.leftOfMid = new Coord(midX - 1, yDelta * 2);
    this.rightOfMid = new Coord(midX + 1, yDelta * 2);

    // For ramps
    this.backCorner = new Coord(midX, yDelta);
    
    this.colours = new Array<string>(
      this.descriptor.waterColour,
      this.descriptor.snowColour,
      this.descriptor.sandColour,
      this.descriptor.rockColour,
      this.descriptor.mudColour,
      this.descriptor.dryGrassColour,
      this.descriptor.wetGrassColour,
    );

    const numTerrains = this.colours.length;
    this.canvas = new OffscreenCanvas(
      TerrainShape.Max * this.width,
      numTerrains * this.height 
    );
    console.log('generating sprite sheet', this.canvas.width, this.canvas.height);
    const ctx = this.canvas.getContext("2d", {
      willReadFrequently: true,
    });
    if (ctx) {
      this.ctx = ctx!;
    }
  }

  get width(): number { return this._width; }
  set width(w: number) { this._width = w; }
  get height(): number { return this._height; }
  set height(h: number) { this._height = h; }
  get canvas(): OffscreenCanvas { return this._canvas; }
  set canvas(c: OffscreenCanvas) { this._canvas = c; }
  get ctx(): OffscreenCanvasRenderingContext2D { return this._ctx; }
  set ctx(c: OffscreenCanvasRenderingContext2D) { this._ctx = c; }
  get descriptor(): TerrainSpriteDescriptor { return this._descriptor; }
  get colours(): Array<string> { return this._colours; }
  set colours(a: Array<string>) { this._colours = a; }

  get top(): Coord { return this._top; }
  set top(c: Coord) { this._top = c; }
  get rightOfTop(): Coord { return this._rightOfTop; }
  set rightOfTop(c: Coord) { this._rightOfTop = c; }
  get topRight(): Coord { return this._topRight; }
  set topRight(c: Coord) { this._topRight = c; }
  get bottomRight(): Coord { return this._bottomRight; }
  set bottomRight(c: Coord) { this._bottomRight = c; }
  get rightOfBottom(): Coord { return this._rightOfBottom; }
  set rightOfBottom(c: Coord) { this._rightOfBottom = c; }
  get bottom(): Coord { return this._bottom; }
  set bottom(c: Coord) { this._bottom = c; }
  get leftOfBottom(): Coord { return this._leftOfBottom; }
  set leftOfBottom(c: Coord) { this._leftOfBottom = c; }
  get bottomLeft(): Coord { return this._bottomLeft; }
  set bottomLeft(c: Coord) { this._bottomLeft = c; }
  get topLeft(): Coord { return this._topLeft; }
  set topLeft(c: Coord) { this._topLeft = c; }
  get leftOfTop(): Coord { return this._leftOfTop; }
  set leftOfTop(c: Coord) { this._leftOfTop = c; }
  get mid(): Coord { return this._mid; }
  set mid(c: Coord) { this._mid = c; }
  get leftOfMid(): Coord { return this._leftOfMid; }
  set leftOfMid(c: Coord) { this._leftOfMid = c; }
  get rightOfMid(): Coord { return this._rightOfMid; }
  set rightOfMid(c: Coord) { this._rightOfMid = c; }
  get backCorner(): Coord { return this._backCorner; }
  set backCorner(c: Coord) { this._backCorner = c; }

  generateCanvas(): OffscreenCanvas {
    // Populate the descriptor with the row and column information.
    this.descriptor.tileRowTypes = new Array<TerrainType>(
      TerrainType.Water,
      TerrainType.Snow,
      TerrainType.Sand,
      TerrainType.Rock,
      TerrainType.Mud,
      TerrainType.DryGrass,
      TerrainType.WetGrass,
    );
    this.descriptor.tileColumnShapes = new Array<TerrainShape>(
      TerrainShape.Flat,
      TerrainShape.Wall,
      TerrainShape.NorthEdge,
      TerrainShape.EastEdge,
      TerrainShape.NorthEastCorner,
      TerrainShape.SouthEdge,
      TerrainShape.NorthSouthCorridor,
      TerrainShape.SouthEastCorner,
      TerrainShape.EastPeninsula,
      TerrainShape.WestEdge,
      TerrainShape.NorthWestCorner,
      TerrainShape.EastWestCorridor,
      TerrainShape.NorthPeninsula,
      TerrainShape.SouthWestCorner,
      TerrainShape.WestPeninsula,
      TerrainShape.SouthPeninsula,
      TerrainShape.Spire,
      TerrainShape.RampNorth,
      TerrainShape.RampEast,
      TerrainShape.RampSouth,
      TerrainShape.RampWest,
    );

    if (this.ctx) {
      this.generateFlat(TerrainShape.Flat);
      this.generateFlat(TerrainShape.Wall);
      this.generateEdge(TerrainShape.NorthEdge);
      this.generateEdge(TerrainShape.EastEdge);
      this.generateCorner(TerrainShape.NorthEastCorner);
      this.generateEdge(TerrainShape.SouthEdge);
      this.generateCorridor(TerrainShape.NorthSouthCorridor);
      this.generateCorner(TerrainShape.SouthEastCorner);
      this.generatePeninsula(TerrainShape.EastPeninsula);
      this.generateEdge(TerrainShape.WestEdge);
      this.generateCorner(TerrainShape.NorthWestCorner);
      this.generateCorridor(TerrainShape.EastWestCorridor);
      this.generatePeninsula(TerrainShape.NorthPeninsula);
      this.generateCorner(TerrainShape.SouthWestCorner);
      this.generatePeninsula(TerrainShape.WestPeninsula);
      this.generatePeninsula(TerrainShape.SouthPeninsula);
      this.generateSpire();
      this.generateRampNorth();
      this.generateRampEast();
      this.generateRampSouth();
      this.generateRampWest();
      return this.canvas;
    } else {
      throw new Error('no offscreen rendering context');
    }
    return this.canvas;
  }

  drawShadow(coords: Array<Coord>, offset: Coord) {
    this.ctx.strokeStyle = "rgb(0 0 0 / 25%)";
    this.ctx.beginPath();
    this.ctx.moveTo(coords[0].x + offset.x, coords[0].y + offset.y);
    for (let i = 1; i < coords.length; ++i) {
      const coord = coords[i];
      this.ctx.lineTo(coord.x + offset.x, coord.y + offset.y);
      this.ctx.stroke();
    }
  }

  drawSide(coords: Array<Coord>, colour: string, offset: Coord) {
    this.ctx.fillStyle = colour;
    this.ctx.strokeStyle = colour;
    this.ctx.beginPath();
    this.ctx.moveTo(coords[0].x + offset.x, coords[0].y + offset.y);
    for (let i = 1; i < coords.length; ++i) {
      const coord = coords[i];
      this.ctx.lineTo(coord.x + offset.x, coord.y + offset.y);
      this.ctx.stroke();
    }
    this.ctx.fill();
  }

  drawThreeSides(rightShape: Array<Coord>,
                 leftShape: Array<Coord>,
                 topShape: Array<Coord>,
                 shape: TerrainShape) {
    for (let i = 0; i < this.colours.length; ++i) {
      const topColour = this.colours[i];
      const offset = new Coord(this.width * shape, this.height * i);
      if (topColour == this.descriptor.waterColour) {
        this.drawSide(rightShape, this.descriptor.lightUnderwaterColour, offset);
        this.drawSide(leftShape, this.descriptor.darkUnderwaterColour, offset);
      } else {
        this.drawSide(rightShape, this.descriptor.lightUndergroundColour, offset);
        this.drawSide(leftShape, this.descriptor.darkUndergroundColour, offset);
      }
      this.drawSide(topShape, topColour, offset);
    }
  }

  generateFlat(shape: TerrainShape) {
    const rightShape = new Array<Coord>(
      this.topRight,
      this.bottomRight,
      this.rightOfBottom,
      this.bottom,
      this.mid,
    );
    const leftShape = new Array<Coord>(
      this.topLeft,
      this.bottomLeft,
      this.leftOfBottom,
      this.bottom,
      this.mid,
    );
    const topShape = new Array<Coord>(
      this.leftOfTop,
      this.top,
      this.rightOfTop,
      this.topRight,
      this.rightOfMid,
      this.leftOfMid,
      this.topLeft,
    );
    for (let i = 0; i < this.colours.length; ++i) {
      const topColour = this.colours[i];
      const offset = new Coord(this.width * shape, this.height * i); 
      if (topColour == this.descriptor.waterColour) {
        this.drawSide(rightShape, this.descriptor.lightUnderwaterColour, offset);
        this.drawSide(leftShape, this.descriptor.darkUnderwaterColour, offset);
      } else {
        this.drawSide(rightShape, this.descriptor.lightUndergroundColour, offset);
        this.drawSide(leftShape, this.descriptor.darkUndergroundColour, offset);
      }
      this.drawSide(topShape, topColour, offset);
    }
  }

  generateRampSouth() {
    const rightShape = new Array<Coord> (
      this.bottomRight,
      this.bottom,
      this.mid,
      this.topRight,
    );
    const leftShape = new Array<Coord>(
      this.bottomLeft,
      this.bottom,
      this.mid,
    );
    const topShape = new Array<Coord>(
      this.bottomLeft,
      this.backCorner,
      this.topRight,
      this.mid,
    );
    this.drawThreeSides(rightShape, leftShape, topShape, TerrainShape.RampSouth);
  }

  generateRampWest() {
    const rightShape = new Array<Coord> (
      this.bottomRight,
      this.bottom,
      this.mid,
    );
    const leftShape = new Array<Coord>(
      this.topLeft,
      this.bottomLeft,
      this.bottom,
      this.mid,
    );
    const topShape = new Array<Coord>(
      this.topLeft,
      this.mid,
      this.bottomRight,
      this.backCorner,
    );
    this.drawThreeSides(rightShape, leftShape, topShape, TerrainShape.RampWest);
  }

  generateRampEast() {
    const rightShape = new Array<Coord>(
      this.topRight,
      this.bottomRight,
      this.bottom,
    );
    const topShape = new Array<Coord> (
      this.bottomLeft,
      this.top,
      this.topRight,
      this.bottom,
    );
    for (let i = 0; i < this.colours.length; ++i) {
      const topColour = this.colours[i];
      const offset = new Coord(this.width * TerrainShape.RampEast, this.height * i);
      if (topColour == this.descriptor.waterColour) {
        this.drawSide(rightShape, this.descriptor.lightUnderwaterColour, offset);
      } else {
        this.drawSide(rightShape, this.descriptor.lightUndergroundColour, offset);
      }
      this.drawSide(topShape, topColour, offset);
    }
  }

  generateRampNorth() {
    const leftShape = new Array<Coord>(
      this.bottomLeft,
      this.topLeft,
      this.bottom,
    );
    const topShape = new Array<Coord> (
      this.top,
      this.topLeft,
      this.bottom,
      this.bottomRight,
    );
    for (let i = 0; i < this.colours.length; ++i) {
      const topColour = this.colours[i];
      const offset = new Coord(this.width * TerrainShape.RampNorth, this.height * i); 
      if (topColour == this.descriptor.waterColour) {
        this.drawSide(leftShape, this.descriptor.darkUnderwaterColour, offset);
      } else {
        this.drawSide(leftShape, this.descriptor.darkUndergroundColour, offset);
      }
      this.drawSide(topShape, topColour, offset);
    }
  }

  generateEdge(shape: TerrainShape) {
    let shadows: Array<Coord>;
    switch (shape) {
    default:
      throw new Error('unhandled edge');
      break;
    case TerrainShape.WestEdge:
      shadows = new Array<Coord>(
        this.topLeft,
        this.leftOfMid,
      );
      break;
    case TerrainShape.NorthEdge:
      shadows = new Array<Coord>(
        this.topLeft,
        this.leftOfTop,
      );
      break;
    case TerrainShape.EastEdge:
      shadows = new Array<Coord>(
        this.topRight,
        this.rightOfTop,
      );
      break;
    case TerrainShape.SouthEdge:
      shadows = new Array<Coord>(
        this.topRight,
        this.rightOfMid,
      );
      break;
    }
    this.generateFlat(shape);
    for (let i = 0; i < this.colours.length; ++i) {
      const offset = new Coord(this.width * shape, this.height * i);
      this.drawShadow(shadows, offset);
    }
  }

  generateCorner(shape: TerrainShape) {
    let shadows: Array<Coord>;
    switch (shape) {
    default:
      throw new Error('unhandled corner');
      break;
    case TerrainShape.NorthWestCorner:
      shadows = new Array<Coord>(
        this.mid,
        this.topLeft,
        this.leftOfTop,
      );
      break;
    case TerrainShape.NorthEastCorner:
      shadows = new Array<Coord>(
        this.topLeft,
        this.leftOfTop,
        this.topRight,
      );
      break;
    case TerrainShape.SouthEastCorner:
      shadows = new Array<Coord>(
        this.rightOfTop,
        this.topRight,
        this.mid,
      );
      break;
    case TerrainShape.SouthWestCorner:
      shadows = new Array<Coord>(
        this.topRight,
        this.mid,
        this.topLeft,
      );
      break;
    }
    this.generateFlat(shape);
    for (let i = 0; i < this.colours.length; ++i) {
      const offset = new Coord(this.width * shape, this.height * i);
      this.drawShadow(shadows, offset);
    }
  }

  generateCorridor(shape: TerrainShape) {
    this.generateFlat(shape);
    let shadows: Array<Coord>;
    switch (shape) {
    default:
      throw new Error('unhandled corner');
      break;
    case TerrainShape.NorthSouthCorridor:
      shadows = new Array<Coord>(
        this.topLeft,
        this.leftOfMid,
      );
      this.top,
        this.topRight,
      );
      break;
    case TerrainShape.EastWestCorridor:
      shadows = new Array<Coord>(
        this.top,
        this.topLeft,
        this.topRight,
        this.mid,
      );
      break;
    }
    for (let i = 0; i < this.colours.length; ++i) {
      const offset = new Coord(this.width * shape, this.height * i);
      this.drawShadow(shadows, offset);
    }
  }

  generateSpire() {
    const shape = TerrainShape.Spire;
    this.generateFlat(shape);
    const shadows = new Array<Coord>(
      this.top,
      this.rightOfTop,
      this.topRight,
      this.rightOfMid,
      this.leftOfMid,
      this.topLeft,
      this.leftOfTop,
      this.top,
    );
    for (let i = 0; i < this.colours.length; ++i) {
      const offset = new Coord(this.width * shape, this.height * i);
      this.drawShadow(shadows, offset);
    }
  }

  generatePeninsula(shape: TerrainShape) {
    let shadows: Array<Coord>;
    switch (shape) {
    default:
      throw new Error('unhandled peninsula');
      break;
    case TerrainShape.NorthPeninsula:
      shadows = new Array<Coord>(
        this.leftOfMid,
        this.topLeft,
        this.leftOfTop,
        this.top,
        this.rightOfTop,
        this.topRight,
      );
      break;
    case TerrainShape.EastPeninsula:
      shadows = new Array<Coord>(
        this.topLeft,
        this.leftOfTop,
        this.top,
        this.rightOfTop,
        this.topRight,
        this.rightOfMid,
      );
      break;
    case TerrainShape.SouthPeninsula:
      shadows = new Array<Coord>(
        this.top,
        this.rightOfTop,
        this.topRight,
        this.rightOfMid,
        this.leftOfMid,
        this.topLeft,
      );
      break;
    case TerrainShape.WestPeninsula:
      shadows = new Array<Coord>(
        this.topRight,
        this.rightOfMid,
        this.leftOfMid,
        this.topLeft,
        this.leftOfTop,
        this.top,
      );
      break;
    }
    this.generateFlat(shape);
    for (let i = 0; i < this.colours.length; ++i) {
      const offset = new Coord(this.width * shape, this.height * i);
      this.drawShadow(shadows, offset);
    }
  }
}

