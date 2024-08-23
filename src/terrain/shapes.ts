import { Coord } from '../utils/navigation.ts';

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

type TerraceGrid = Array<Uint8Array>;

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
