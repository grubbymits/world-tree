import * as WT from "../dist/world-tree.mjs";
import * as Utils from "./utils.mjs";

const types = [
  WT.TerrainType.Lowland0,
  WT.TerrainType.Lowland1,
  WT.TerrainType.Lowland2,
  WT.TerrainType.Lowland3,
  WT.TerrainType.Lowland4,
  WT.TerrainType.Lowland5,
  WT.TerrainType.Water,
];
const shapes = [
  WT.TerrainShape.Flat,
  WT.TerrainShape.RampUpSouth,
  WT.TerrainShape.RampUpWest,
  WT.TerrainShape.RampUpEast,
  WT.TerrainShape.RampUpNorth,
];

test("terrace spacing with non-negative heights", () => {
  const numTerraces = 3;
  const heightMap = [
    [0, 0, 0, 0, 0],
    [0, 1, 1, 1, 0],
    [0, 1, 2, 1, 0],
    [0, 1, 3, 1, 0],
    [0, 1, 2, 1, 0],
    [0, 0, 0, 0, 0],
  ];
  expect(WT.normaliseHeightGrid(heightMap, numTerraces)).toBe(1);
});

test("terrace spacing with non-positive heights", () => {
  const numTerraces = 3;
  const heightMap = [
    [0, 0, 0, 0, 0],
    [0, -1, -1, -1, 0],
    [0, -1, -2, -1, 0],
    [0, -1, -3, -1, 0],
    [0, -1, -2, -1, 0],
    [0, 0, 0, 0, 0],
  ];
  expect(WT.normaliseHeightGrid(heightMap, numTerraces)).toBe(1);
});

test("terrace spacing with positive and negative heights", () => {
  const cellsX = 5;
  const cellsY = 5;
  const numTerraces = 3;
  const heightMap = [
    [-1.5, -1, -1, -1, -1],
    [0, 0, 0, 0, 0],
    [0, 0, 2, 0, 0],
    [0, 1, 3, 1, 0],
    [0, 1, 2, 1, 0],
    [0, 0, 0, 0, 0],
  ];
  const terraceSpacing = WT.normaliseHeightGrid(heightMap, numTerraces);
  expect(terraceSpacing).toBe(1.5);
  const terraceGrid = WT.buildTerraceGrid(heightMap, terraceSpacing);
  for (let y = 0; y < cellsY; ++y) {
    for (let x = 0; x < cellsX; ++x) {
      expect(terraceGrid[y][x]).toBe(Math.floor(heightMap[y][x] / terraceSpacing));
    }
  }
});

test("all ramps and edges supported", () => {
  const cellsX = 11;
  const cellsY = 11;
  const numTerraces = 3;
  const heightMap = [
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0],
    [0, 1, 2, 2, 2, 2, 1, 1, 1, 1, 0],
    [0, 1, 1, 2, 2, 2, 2, 2, 1, 1, 0],
    [0, 1, 2, 3, 3, 4, 3, 2, 2, 1, 0],
    [0, 1, 2, 3, 4, 6, 4, 2, 2, 1, 0],
    [0, 1, 2, 3, 4, 4, 3, 2, 2, 1, 0],
    [0, 1, 2, 3, 3, 2, 2, 2, 2, 1, 0],
    [0, 1, 1, 2, 2, 2, 2, 2, 1, 1, 0],
    [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  ];

  const terraceSpacing = WT.normaliseHeightGrid(heightMap, numTerraces);
  const terraceGrid = WT.buildTerraceGrid(heightMap, terraceSpacing);
  const edges = WT.findEdges(terraceGrid);
  const ramps = WT.findRamps(terraceGrid, edges);

  for (let shape = WT.TerrainShape.Flat; shape < WT.TerrainShape.Max; ++shape) {
    WT.Terrain.setSupportedShape(shape);
  }
  const shapeGrid = WT.buildTerrainShapeGrid(
    terraceGrid,
    edges,
    ramps
  );

  for (const edge of edges) {
    const terrainShape = shapeGrid[edge.y][edge.x];
    let expectedShape = WT.TerrainShape.Flat;
    switch (edge.shape) {
    case WT.EdgeShape.North:
      expectedShape = WT.TerrainShape.NorthEdge;
      break;
    case WT.EdgeShape.East:
      expectedShape = WT.TerrainShape.EastEdge;
      break;
    case WT.EdgeShape.NorthEastCorner:
      expectedShape = WT.TerrainShape.NorthEastCorner;
      break;
    case WT.EdgeShape.South:
      expectedShape = WT.TerrainShape.SouthEdge;
      break;
    case WT.EdgeShape.NorthSouthCorridor:
      expectedShape = WT.TerrainShape.NorthSouthCorridor;
      break;
    case WT.EdgeShape.SouthEastCorner:
      expectedShape = WT.TerrainShape.SouthEastCorner;
      break;
    case WT.EdgeShape.EastPeninsula:
      expectedShape = WT.TerrainShape.EastPeninsula;
      break;
    case WT.EdgeShape.West:
      expectedShape = WT.TerrainShape.WestEdge;
      break;
    case WT.EdgeShape.NorthWestCorner:
      expectedShape = WT.TerrainShape.NorthWestCorner;
      break;
    case WT.EdgeShape.EastWestCorridor:
      expectedShape = WT.TerrainShape.EastWestCorridor;
      break;
    case WT.EdgeShape.NorthPeninsula:
      expectedShape = WT.TerrainShape.NorthPeninsula;
      break;
    case WT.EdgeShape.SouthWestCorner:
      expectedShape = WT.TerrainShape.SouthWestCorner;
      break;
    case WT.EdgeShape.WestPeninsula:
      expectedShape = WT.TerrainShape.WestPeninsula;
      break;
    case WT.EdgeShape.SouthPeninsula:
      expectedShape = WT.TerrainShape.SouthPeninsula;
      break;
    case WT.EdgeShape.Spire:
      expectedShape = WT.TerrainShape.Spire;
      break;
    }
    expect(terrainShape).toBe(expectedShape);
  }
});

test("only flat and wall supported", () => {
  const cellsX = 11;
  const cellsY = 11;
  const numTerraces = 3;
  const heightMap = [
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0],
    [0, 1, 2, 2, 2, 2, 1, 1, 1, 1, 0],
    [0, 1, 1, 2, 2, 2, 2, 2, 1, 1, 0],
    [0, 1, 2, 3, 3, 4, 3, 2, 2, 1, 0],
    [0, 1, 2, 3, 4, 6, 4, 2, 2, 1, 0],
    [0, 1, 2, 3, 4, 4, 3, 2, 2, 1, 0],
    [0, 1, 2, 3, 3, 2, 2, 2, 2, 1, 0],
    [0, 1, 1, 2, 2, 2, 2, 2, 1, 1, 0],
    [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  ];

  const terraceSpacing = WT.normaliseHeightGrid(heightMap, numTerraces);
  const terraceGrid = WT.buildTerraceGrid(heightMap, terraceSpacing);
  const edges = WT.findEdges(terraceGrid);
  const ramps = WT.findRamps(terraceGrid, edges);

  WT.Terrain.reset();
  const shapeGrid = WT.buildTerrainShapeGrid(
    terraceGrid,
    edges,
    ramps
  );

  for (const edge of edges) {
    const terrainShape = shapeGrid[edge.y][edge.x];
    expect(terrainShape).toBe(WT.TerrainShape.Wall);
  }
});
test("only basic edges supported", () => {
  const cellsX = 11;
  const cellsY = 11;
  const numTerraces = 3;
  const heightMap = [
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0],
    [0, 1, 2, 2, 2, 2, 1, 1, 1, 1, 0],
    [0, 1, 1, 2, 2, 2, 2, 2, 1, 1, 0],
    [0, 1, 2, 3, 3, 4, 3, 2, 2, 1, 0],
    [0, 1, 2, 3, 4, 6, 4, 2, 2, 1, 0],
    [0, 1, 2, 3, 4, 4, 3, 2, 2, 1, 0],
    [0, 1, 2, 3, 3, 2, 2, 2, 2, 1, 0],
    [0, 1, 1, 2, 2, 2, 2, 2, 1, 1, 0],
    [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  ];

  const terraceSpacing = WT.normaliseHeightGrid(heightMap, numTerraces);
  const terraceGrid = WT.buildTerraceGrid(heightMap, terraceSpacing);
  const edges = WT.findEdges(terraceGrid);
  const ramps = WT.findRamps(terraceGrid, edges);

  const supportedShapes = [
    WT.TerrainShape.Flat,
    WT.TerrainShape.Wall,
    WT.TerrainShape.NorthEdge,
    WT.TerrainShape.EastEdge,
    WT.TerrainShape.SouthEdge,
    WT.TerrainShape.WestEdge
  ];

  WT.Terrain.reset();
  for (const shape of supportedShapes) {
    WT.Terrain.setSupportedShape(shape);
  }
  const shapeGrid = WT.buildTerrainShapeGrid(
    terraceGrid,
    edges,
    ramps
  );

  for (const edge of edges) {
    const terrainShape = shapeGrid[edge.y][edge.x];
    let expectedShape = WT.TerrainShape.Flat;
    switch (edge.shape) {
    case WT.EdgeShape.North:
    case WT.EdgeShape.NorthSouthCorridor:
    case WT.EdgeShape.NorthWestCorner:
    case WT.EdgeShape.EastWestCorridor:
    case WT.EdgeShape.WestPeninsula:
      expectedShape = WT.TerrainShape.NorthEdge;
      break;
    case WT.EdgeShape.East:
    case WT.EdgeShape.NorthEastCorner:
    case WT.EdgeShape.SouthEastCorner:
    case WT.EdgeShape.NorthPeninsula:
    case WT.EdgeShape.EastPeninsula:
    case WT.EdgeShape.SouthPeninsula:
    case WT.EdgeShape.Spire:
      expectedShape = WT.TerrainShape.EastEdge;
      break;
    case WT.EdgeShape.South:
    case WT.EdgeShape.SouthWestCorner:
      expectedShape = WT.TerrainShape.SouthEdge;
      break;
    case WT.EdgeShape.West:
      expectedShape = WT.TerrainShape.WestEdge;
      break;
    }
    expect(terrainShape).toBe(expectedShape);
  }
});
