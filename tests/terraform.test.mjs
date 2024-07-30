import * as WT from "../dist/world-tree.mjs";

test("surrounded", () => {
  const terraceGrid = [
    [ 1, 1, 1, 1, 1, 1 ],
    [ 1, 0, 0, 0, 0, 1 ],
    [ 1, 0, 0, 0, 0, 1 ],
    [ 1, 0, 0, 0, 0, 1 ],
    [ 1, 0, 0, 0, 0, 1 ],
    [ 1, 1, 1, 1, 1, 1 ],
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

test("peninsulas", () => {
  const terraceGrid = [
    [ 0, 0, 0, 0, 0 ],
    [ 0, 0, 1, 0, 0 ],
    [ 0, 1, 1, 1, 0 ],
    [ 0, 0, 1, 0, 0 ],
    [ 0, 0, 0, 0, 0 ],
  ];
  const edges = WT.findEdges(terraceGrid);
  expect(edges.length).toBe(4);
  expect(edges[0].shape).toBe(WT.EdgeShape.NorthPeninsula);
  expect(edges[1].shape).toBe(WT.EdgeShape.WestPeninsula);
  expect(edges[2].shape).toBe(WT.EdgeShape.EastPeninsula);
  expect(edges[3].shape).toBe(WT.EdgeShape.SouthPeninsula);
});

test("corners", () => {
  const terraceGrid = [
    [ 0, 0, 0, 0, 0 ],
    [ 0, 1, 1, 1, 0 ],
    [ 0, 1, 1, 1, 0 ],
    [ 0, 1, 1, 1, 0 ],
    [ 0, 0, 0, 0, 0 ],
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
    [ 0, 0, 0, 0, 0 ],
    [ 0, 1, 1, 1, 0 ],
    [ 0, 1, 0, 0, 0 ],
    [ 0, 1, 0, 0, 0 ],
    [ 0, 0, 0, 0, 0 ],
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
    [ 0, 0, 0 ],
    [ 0, 1, 0 ],
    [ 0, 0, 0 ]
  ];
  const edges = WT.findEdges(terraceGrid);
  expect(edges.length).toBe(1);
  expect(edges[0].shape).toBe(WT.EdgeShape.Spire);
});

test("centre ramps", () => {
  const terraceGrid = [
    [ 1, 1, 1, 1, 1, 1, 1, 1, 1 ],
    [ 1, 0, 0, 0, 0, 0, 0, 0, 1 ],
    [ 1, 0, 0, 0, 0, 0, 0, 0, 1 ],
    [ 1, 0, 0, 0, 1, 0, 0, 0, 1 ],
    [ 1, 0, 0, 1, 1, 1, 0, 0, 1 ],
    [ 1, 0, 0, 0, 1, 0, 0, 0, 1 ],
    [ 1, 0, 0, 0, 0, 0, 0, 0, 1 ],
    [ 1, 0, 0, 0, 0, 0, 0, 0, 1 ],
    [ 1, 1, 1, 1, 1, 1, 1, 1, 1 ],
  ];
  const edges = WT.findEdges(terraceGrid);
  expect(edges.length).toBe(32);
  const ramps = WT.findRamps(terraceGrid, edges);
  expect(ramps.length).toBe(4);
});
