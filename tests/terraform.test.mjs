import * as WT from "../dist/world-tree.mjs";

test("surrounded", () => {
  const terraceGrid = [
    new Uint8Array([ 1, 1, 1, 1, 1, 1 ]),
    new Uint8Array([ 1, 0, 0, 0, 0, 1 ]),
    new Uint8Array([ 1, 0, 0, 0, 0, 1 ]),
    new Uint8Array([ 1, 0, 0, 0, 0, 1 ]),
    new Uint8Array([ 1, 0, 0, 0, 0, 1 ]),
    new Uint8Array([ 1, 1, 1, 1, 1, 1 ]),
  ];
  const edges = WT.findEdges(terraceGrid);
  expect(edges.length).toBe(16);

  for (let i = 0; i < 4; ++i) {
    expect(edges[i].shape).toBe(WT.EdgeShape.South);
  }
  for (let i = 4; i < 12; i+=2) {
    expect(edges[i].shape).toBe(WT.EdgeShape.East);
    expect(edges[i+1].shape).toBe(WT.EdgeShape.West);
  }
  for (let i = 12; i < 16; ++i) {
    expect(edges[i].shape).toBe(WT.EdgeShape.North);
  }
});

test("inside peninsulas", () => {
  const terraceGrid = [
    new Uint8Array([ 0, 0, 0, 0, 0 ]),
    new Uint8Array([ 0, 0, 1, 0, 0 ]),
    new Uint8Array([ 0, 1, 1, 1, 0 ]),
    new Uint8Array([ 0, 0, 1, 0, 0 ]),
    new Uint8Array([ 0, 0, 0, 0, 0 ]),
  ];
  const edges = WT.findEdges(terraceGrid);
  expect(edges.length).toBe(4);
  expect(edges[0].shape).toBe(WT.EdgeShape.NorthPeninsula);
  expect(edges[1].shape).toBe(WT.EdgeShape.WestPeninsula);
  expect(edges[2].shape).toBe(WT.EdgeShape.EastPeninsula);
  expect(edges[3].shape).toBe(WT.EdgeShape.SouthPeninsula);
});

test("outside peninsulas", () => {
  const terraceGrid = [
    new Uint8Array([ 0, 1, 0 ]),
    new Uint8Array([ 1, 0, 1 ]),
    new Uint8Array([ 0, 1, 0 ]),
  ];
  const edges = WT.findEdges(terraceGrid);
  expect(edges.length).toBe(4);
  expect(edges[0].shape).toBe(WT.EdgeShape.SouthPeninsula);
  expect(edges[1].shape).toBe(WT.EdgeShape.EastPeninsula);
  expect(edges[2].shape).toBe(WT.EdgeShape.WestPeninsula);
  expect(edges[3].shape).toBe(WT.EdgeShape.NorthPeninsula);
});

test("corners", () => {
  const terraceGrid = [
    new Uint8Array([ 0, 0, 0, 0, 0 ]),
    new Uint8Array([ 0, 1, 1, 1, 0 ]),
    new Uint8Array([ 0, 1, 1, 1, 0 ]),
    new Uint8Array([ 0, 1, 1, 1, 0 ]),
    new Uint8Array([ 0, 0, 0, 0, 0 ]),
  ];
  const edges = WT.findEdges(terraceGrid);
  expect(edges.length).toBe(8);
  expect(edges[0].shape).toBe(WT.EdgeShape.NorthWestCorner);
  expect(edges[1].shape).toBe(WT.EdgeShape.North);
  expect(edges[2].shape).toBe(WT.EdgeShape.NorthEastCorner);
  expect(edges[3].shape).toBe(WT.EdgeShape.West);
  expect(edges[4].shape).toBe(WT.EdgeShape.East);
  expect(edges[5].shape).toBe(WT.EdgeShape.SouthWestCorner);
  expect(edges[6].shape).toBe(WT.EdgeShape.South);
  expect(edges[7].shape).toBe(WT.EdgeShape.SouthEastCorner);
});

test("corridors", () => {
  const terraceGrid = [
    new Uint8Array([ 0, 0, 0, 0, 0 ]),
    new Uint8Array([ 0, 1, 1, 1, 0 ]),
    new Uint8Array([ 0, 1, 0, 0, 0 ]),
    new Uint8Array([ 0, 1, 0, 0, 0 ]),
    new Uint8Array([ 0, 0, 0, 0, 0 ]),
  ];
  const edges = WT.findEdges(terraceGrid);
  expect(edges.length).toBe(5);
  expect(edges[0].shape).toBe(WT.EdgeShape.NorthWestCorner);
  expect(edges[1].shape).toBe(WT.EdgeShape.NorthSouthCorridor);
  expect(edges[2].shape).toBe(WT.EdgeShape.EastPeninsula);
  expect(edges[3].shape).toBe(WT.EdgeShape.EastWestCorridor);
  expect(edges[4].shape).toBe(WT.EdgeShape.SouthPeninsula);
});

test("spire", () => {
  const terraceGrid = [
    new Uint8Array([ 0, 0, 0 ]),
    new Uint8Array([ 0, 1, 0 ]),
    new Uint8Array([ 0, 0, 0 ]),
  ];
  const edges = WT.findEdges(terraceGrid);
  expect(edges.length).toBe(1);
  expect(edges[0].shape).toBe(WT.EdgeShape.Spire);
});

test("centre ramps", () => {
  const terraceGrid = [
    new Uint8Array([ 1, 1, 1, 1, 1, 1, 1, 1, 1 ]),
    new Uint8Array([ 1, 0, 0, 0, 0, 0, 0, 0, 1 ]),
    new Uint8Array([ 1, 0, 0, 0, 0, 0, 0, 0, 1 ]),
    new Uint8Array([ 1, 0, 0, 0, 1, 0, 0, 0, 1 ]),
    new Uint8Array([ 1, 0, 0, 1, 1, 1, 0, 0, 1 ]),
    new Uint8Array([ 1, 0, 0, 0, 1, 0, 0, 0, 1 ]),
    new Uint8Array([ 1, 0, 0, 0, 0, 0, 0, 0, 1 ]),
    new Uint8Array([ 1, 0, 0, 0, 0, 0, 0, 0, 1 ]),
    new Uint8Array([ 1, 1, 1, 1, 1, 1, 1, 1, 1 ]),
  ];
  const edges = WT.findEdges(terraceGrid);
  expect(edges.length).toBe(32);
  const ramps = WT.findRamps(terraceGrid, edges);
  expect(ramps.length).toBe(4);
});

test("cardinals blocking grid", () => {
  const terraceGrid = [
    new Uint8Array([ 0, 0, 1, 0, 0 ]),
    new Uint8Array([ 0, 0, 1, 0, 0 ]),
    new Uint8Array([ 1, 1, 0, 1, 1 ]),
    new Uint8Array([ 0, 0, 1, 0, 0 ]),
    new Uint8Array([ 0, 0, 1, 0, 0 ]),
  ];
  const edges = WT.findEdges(terraceGrid);
  const ramps = [];
  const blockingRamps = false;
  const blockingUpHeight = 1;
  const blockingDownHeight = 1;
  const blockingGrid = WT.buildBlockingGrid(
    terraceGrid,
    edges,
    ramps,
    blockingRamps,
    blockingUpHeight,
    blockingDownHeight
  );
  expect(edges.length).toBe(8);
  // NorthWest, West, SouthWest  South, SouthEast East NorthEast
  // 128        64    32         16     8         4    2
  // 254
  let edge = edges[1];
  expect(edge.shape).toBe(WT.EdgeShape.SouthPeninsula);
  expect(blockingGrid[edge.y][edge.x]).toBe(254);

  // NorthWest, SouthWest, South, SouthEast,  East, NorthEast, North
  // 128        32         16     8           4     2          1
  // 191
  edge = edges[3];
  expect(edge.shape).toBe(WT.EdgeShape.EastPeninsula);
  expect(blockingGrid[edge.y][edge.x]).toBe(191);

  // NorthWest, West, SouthWest, South, SouthEast, NorthEast, North
  // 128        64    32         16     8          2          1
  // 251
  edge = edges[4];
  expect(edge.shape).toBe(WT.EdgeShape.WestPeninsula);
  expect(blockingGrid[edge.y][edge.x]).toBe(251);

  edge = edges[6];
  expect(edge.shape).toBe(WT.EdgeShape.NorthPeninsula);
  // NorthWest, West, SouthWest, SouthEast, East, NorthEast, North
  // 128        64    32         8          4     2          1
  // 239
  expect(blockingGrid[edge.y][edge.x]).toBe(239);

  // Middle
  let x = 2;
  let y = 2;
  expect(blockingGrid[y][x]).toBe(255);
  expect(WT.isNeighbourAccessible(x, y, WT.DirectionBit.North, blockingGrid)).toBe(false);
  expect(WT.isNeighbourAccessible(x, y, WT.DirectionBit.NorthEast, blockingGrid)).toBe(false);
  expect(WT.isNeighbourAccessible(x, y, WT.DirectionBit.East, blockingGrid)).toBe(false);
  expect(WT.isNeighbourAccessible(x, y, WT.DirectionBit.SouthEast, blockingGrid)).toBe(false);
  expect(WT.isNeighbourAccessible(x, y, WT.DirectionBit.South, blockingGrid)).toBe(false);
  expect(WT.isNeighbourAccessible(x, y, WT.DirectionBit.SouthWest, blockingGrid)).toBe(false);
  expect(WT.isNeighbourAccessible(x, y, WT.DirectionBit.West, blockingGrid)).toBe(false);
  expect(WT.isNeighbourAccessible(x, y, WT.DirectionBit.NorthWest, blockingGrid)).toBe(false);

  // Top left
  x = 0;
  y = 0;
  expect(WT.isNeighbourAccessible(x, y, WT.DirectionBit.North, blockingGrid)).toBe(false);
  expect(WT.isNeighbourAccessible(x, y, WT.DirectionBit.NorthEast, blockingGrid)).toBe(false);
  expect(WT.isNeighbourAccessible(x, y, WT.DirectionBit.East, blockingGrid)).toBe(true);
  expect(WT.isNeighbourAccessible(x, y, WT.DirectionBit.SouthEast, blockingGrid)).toBe(true);
  expect(WT.isNeighbourAccessible(x, y, WT.DirectionBit.South, blockingGrid)).toBe(true);
  expect(WT.isNeighbourAccessible(x, y, WT.DirectionBit.SouthWest, blockingGrid)).toBe(false);
  expect(WT.isNeighbourAccessible(x, y, WT.DirectionBit.West, blockingGrid)).toBe(false);
  expect(WT.isNeighbourAccessible(x, y, WT.DirectionBit.NorthWest, blockingGrid)).toBe(false);

  // Bottom right
  x = 4;
  y = 4;
  expect(WT.isNeighbourAccessible(x, y, WT.DirectionBit.North, blockingGrid)).toBe(true);
  expect(WT.isNeighbourAccessible(x, y, WT.DirectionBit.NorthEast, blockingGrid)).toBe(false);
  expect(WT.isNeighbourAccessible(x, y, WT.DirectionBit.East, blockingGrid)).toBe(false);
  expect(WT.isNeighbourAccessible(x, y, WT.DirectionBit.SouthEast, blockingGrid)).toBe(false);
  expect(WT.isNeighbourAccessible(x, y, WT.DirectionBit.South, blockingGrid)).toBe(false);
  expect(WT.isNeighbourAccessible(x, y, WT.DirectionBit.SouthWest, blockingGrid)).toBe(false);
  expect(WT.isNeighbourAccessible(x, y, WT.DirectionBit.West, blockingGrid)).toBe(true);
  expect(WT.isNeighbourAccessible(x, y, WT.DirectionBit.NorthWest, blockingGrid)).toBe(true);

  // Bottom right
  x = 0;
  y = 4;
  expect(WT.isNeighbourAccessible(x, y, WT.DirectionBit.North, blockingGrid)).toBe(true);
  expect(WT.isNeighbourAccessible(x, y, WT.DirectionBit.NorthEast, blockingGrid)).toBe(true);
  expect(WT.isNeighbourAccessible(x, y, WT.DirectionBit.East, blockingGrid)).toBe(true);
  expect(WT.isNeighbourAccessible(x, y, WT.DirectionBit.SouthEast, blockingGrid)).toBe(false);
  expect(WT.isNeighbourAccessible(x, y, WT.DirectionBit.South, blockingGrid)).toBe(false);
  expect(WT.isNeighbourAccessible(x, y, WT.DirectionBit.SouthWest, blockingGrid)).toBe(false);
  expect(WT.isNeighbourAccessible(x, y, WT.DirectionBit.West, blockingGrid)).toBe(false);
  expect(WT.isNeighbourAccessible(x, y, WT.DirectionBit.NorthWest, blockingGrid)).toBe(false);
});

test("spire path", () => {
  const terraceGrid = [
    new Uint8Array([ 0, 0, 0 ]),
    new Uint8Array([ 0, 1, 0 ]),
    new Uint8Array([ 0, 0, 0 ]),
  ];
  const edges = WT.findEdges(terraceGrid);
  const blockingRamps = false;
  const blockingUpHeight = 1;
  const blockingDownHeight = 1;
  const ramps = [];
  const blockingGrid = WT.buildBlockingGrid(
    terraceGrid,
    edges,
    ramps,
    blockingRamps,
    blockingUpHeight,
    blockingDownHeight
  );
  const startX = 0;
  const startY = 0;
  expect(WT.isNeighbourAccessible(startX, startY, WT.DirectionBit.East, blockingGrid)).toBe(true);
  expect(WT.isNeighbourAccessible(startX, startY, WT.DirectionBit.SouthEast, blockingGrid)).toBe(false);
  expect(WT.isNeighbourAccessible(startX, startY, WT.DirectionBit.South, blockingGrid)).toBe(true);

  const start = new WT.Coord(startX, startY);
  const end = new WT.Coord(2, 2);
  const path = WT.findPath(
    start,
    end,
    blockingGrid
  );
  expect(path.length).toBe(4);
  expect(path[0]).toMatchObject(new WT.Coord(1, 0));
  expect(path[1]).toMatchObject(new WT.Coord(2, 0));
  expect(path[2]).toMatchObject(new WT.Coord(2, 1));
  expect(path[3]).toMatchObject(new WT.Coord(2, 2));
});

test("centre ramps path", () => {
  const terraceGrid = [
    new Uint8Array([ 1, 1, 1, 1, 1, 1, 1, 1, 1 ]),
    new Uint8Array([ 1, 0, 0, 0, 0, 0, 0, 0, 1 ]),
    new Uint8Array([ 1, 0, 0, 0, 0, 0, 0, 0, 1 ]),
    new Uint8Array([ 1, 0, 0, 0, 1, 0, 0, 0, 1 ]),
    new Uint8Array([ 1, 0, 0, 1, 1, 1, 0, 0, 1 ]),
    new Uint8Array([ 1, 0, 0, 0, 1, 0, 0, 0, 1 ]),
    new Uint8Array([ 1, 0, 0, 0, 0, 0, 0, 0, 1 ]),
    new Uint8Array([ 1, 0, 0, 0, 0, 0, 0, 0, 1 ]),
    new Uint8Array([ 1, 1, 1, 1, 1, 1, 1, 1, 1 ]),
  ];
  const edges = WT.findEdges(terraceGrid);
  const ramps = WT.findRamps(terraceGrid, edges);
  const blockingRamps = false;
  const blockingUpHeight = 1;
  const blockingDownHeight = 1;
  const blockingGrid = WT.buildBlockingGrid(
    terraceGrid,
    edges,
    ramps,
    blockingRamps,
    blockingUpHeight,
    blockingDownHeight
  );

  // straight across
  let path = WT.findPath(
    new WT.Coord(1, 4),
    new WT.Coord(7, 4),
    blockingGrid
  );
  expect(path.length).toBe(6);
  expect(path[0]).toMatchObject(new WT.Coord(2, 4));
  expect(path[1]).toMatchObject(new WT.Coord(3, 4));
  expect(path[2]).toMatchObject(new WT.Coord(4, 4));
  expect(path[3]).toMatchObject(new WT.Coord(5, 4));
  expect(path[4]).toMatchObject(new WT.Coord(6, 4));
  expect(path[5]).toMatchObject(new WT.Coord(7, 4));

  // straight down
  path = WT.findPath(
    new WT.Coord(4, 1),
    new WT.Coord(4, 7),
    blockingGrid
  );
  expect(path.length).toBe(6);
  expect(path[0]).toMatchObject(new WT.Coord(4, 2));
  expect(path[1]).toMatchObject(new WT.Coord(4, 3));
  expect(path[2]).toMatchObject(new WT.Coord(4, 4));
  expect(path[3]).toMatchObject(new WT.Coord(4, 5));
  expect(path[4]).toMatchObject(new WT.Coord(4, 6));
  expect(path[5]).toMatchObject(new WT.Coord(4, 7));

  // between two ramps to another position between two ramps.
  const midx = 4;
  const midy = 4;
  expect(WT.isNeighbourAccessible(midx, midy, WT.DirectionBit.North, blockingGrid)).toBe(true);
  expect(WT.isNeighbourAccessible(midx, midy, WT.DirectionBit.NorthEast, blockingGrid)).toBe(false);
  expect(WT.isNeighbourAccessible(midx, midy, WT.DirectionBit.East, blockingGrid)).toBe(true);
  expect(WT.isNeighbourAccessible(midx, midy, WT.DirectionBit.SouthEast, blockingGrid)).toBe(false);
  expect(WT.isNeighbourAccessible(midx, midy, WT.DirectionBit.South, blockingGrid)).toBe(true);
  expect(WT.isNeighbourAccessible(midx, midy, WT.DirectionBit.SouthWest, blockingGrid)).toBe(false);
  expect(WT.isNeighbourAccessible(midx, midy, WT.DirectionBit.West, blockingGrid)).toBe(true);
  expect(WT.isNeighbourAccessible(midx, midy, WT.DirectionBit.NorthWest, blockingGrid)).toBe(false);
  path = WT.findPath(
    new WT.Coord(3, 3),
    new WT.Coord(5, 5),
    blockingGrid
  );
  expect(path.length).toBe(7);
  expect(path[0]).toMatchObject(new WT.Coord(2, 3));
  expect(path[1]).toMatchObject(new WT.Coord(2, 4));
  expect(path[2]).toMatchObject(new WT.Coord(3, 4));
  expect(path[3]).toMatchObject(new WT.Coord(4, 4));
  expect(path[4]).toMatchObject(new WT.Coord(5, 4));
  expect(path[5]).toMatchObject(new WT.Coord(6, 5));
  expect(path[6]).toMatchObject(new WT.Coord(5, 5));
});
