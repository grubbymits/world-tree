import * as WT from "../dist/world-tree.mjs";

function addDummyGraphic(sheet, type, shape) {
  WT.Terrain.addGraphic(
    /*terrainType*/ type,
    /*terrainShape*/ shape,
    /*spriteSheet*/ sheet,
    /*coord.x*/ 1,
    1,
    1,
    1
  );
}
const dummySheet = WT.DummySpriteSheet;
const dummySprite = {};
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
  const terraceGrid = WT.setTerraces(heightMap, terraceSpacing);
  for (let y = 0; y < cellsY; ++y) {
    for (let x = 0; x < cellsX; ++x) {
      expect(terraceGrid[y][x]).toBe(Math.floor(heightMap[y][x] / terraceSpacing));
    }
  }
});

test("zero tolerance ramps", () => {
  const tolerance = 0;
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
  const terraceGrid = WT.setTerraces(heightMap, terraceSpacing);
  const shapeGrid = new Array();
  for (let y = 0; y < cellsY; ++y) {
    shapeGrid[y] = new Array();
    for (let x = 0; x < cellsX; ++x) {
      shapeGrid[y][x] = WT.TerrainShape.Flat;
    }
  }

  const numRamps = WT.setRamps(heightMap, terraceGrid, shapeGrid, terraceSpacing, tolerance);

  for (let y = 0; y < cellsY; ++y) {
    for (let x = 0; x < cellsX; ++x) {
      let shape = WT.TerrainShape.Flat;
      let geometry = "CuboidGeometry";

      if (x == 3 && y == 3) {
        shape = WT.TerrainShape.RampUpEast;
        geometry = "RampUpEastGeometry";
      } else if (x == 2 && y == 4) {
        shape = WT.TerrainShape.RampUpSouth;
        geometry = "RampUpSouthGeometry";
      } else if (x == 5 && y == 2) {
        shape = WT.TerrainShape.RampUpWest;
        geometry = "RampUpWestGeometry";
      } else if (x == 7 && y == 3) {
        shape = WT.TerrainShape.RampUpWest;
        geometry = "RampUpWestGeometry";
      } else if (x == 2 && y == 7) {
        shape = WT.TerrainShape.RampUpNorth;
        geometry = "RampUpNorthGeometry";
      } else if (x == 4 && y == 6) {
        shape = WT.TerrainShape.RampUpNorth;
        geometry = "RampUpNorthGeometry";
      } else if (x == 3 && y == 8) {
        shape = WT.TerrainShape.RampUpEast;
        geometry = "RampUpEastGeometry";
      } else if (x == 7 && y == 8) {
        shape = WT.TerrainShape.RampUpWest;
        geometry = "RampUpWestGeometry";
      } else if (x == 8 && y == 7) {
        shape = WT.TerrainShape.RampUpNorth;
        geometry = "RampUpNorthGeometry";
      } else if (x == 8 && y == 4) {
        shape = WT.TerrainShape.RampUpSouth;
        geometry = "RampUpSouthGeometry";
      }
      expect(shapeGrid[y][x]).toBe(shape);
      //expect(builder.terrainGeometryName(x, y), geometry);
    }
  }
});

test("0.5 tolerance ramps", () => {
  const tolerance = 0;
  const cellsX = 5;
  const cellsY = 7;
  const numTerraces = 2;
  const heightMap = [
    [3, 3, 3, 3, 3],
    [3, 3, 3, 3, 3],
    [3, 2, 2, 2, 3],
    [3, 2, 2, 2, 3],
    [3, 1, 1, 1, 3],
    [3, 1, 1, 1, 3],
    [3, 1, 1, 1, 3],
  ];

  const terraceSpacing = WT.normaliseHeightGrid(heightMap, numTerraces);
  expect(terraceSpacing).toBe(1.5);
  const terraceGrid = WT.setTerraces(heightMap, terraceSpacing);
  const shapeGrid = new Array();
  for (let y = 0; y < cellsY; ++y) {
    shapeGrid[y] = new Array();
    for (let x = 0; x < cellsX; ++x) {
      shapeGrid[y][x] = WT.TerrainShape.Flat;
    }
  }

  const numRamps = WT.setRamps(heightMap, terraceGrid, shapeGrid, terraceSpacing, 0.5);
  const expected = [
    [ 0, 0, 0, 0, 0 ],
    [ 0, 0, WT.Terrain.RampUpNorth, 0, 0 ],
    [ 0, 0, 0, 0, 0 ],
    [ 0, 0, WT.Terrain.RampUpNorth, 0, 0 ],
    [ 0, 0, 0, 0, 0 ],
    [ 0, 0, 0, 0, 0 ],
    [ 0, 0, 0, 0, 0 ]
  ];
  expect(numRamps).toBe(3);
});

test("walls", () => {
  const dims = new WT.Dimensions(5, 5, 5);
  const width = 5;
  const depth = 6;
  const numTerraces = 2;
  const worldDims = new WT.Dimensions(
    dims.width * width,
    dims.depth * depth,
    dims.height * (numTerraces + 1)
  );
  let context = WT.createTestContext(
    worldDims,
    WT.Perspective.TwoByOneIsometric
  );
  const heightMap = [
    [0, 0, 0, 0, 1],
    [0, 0, 0, 0, 1],
    [0, 0, 2, 0, 1],
    [0, 2, 2, 2, 1],
    [0, 0, 2, 0, 1],
    [0, 0, 0, 0, 1],
  ];
  for (let type of types) {
    addDummyGraphic(dummySheet, type, WT.TerrainShape.Wall);
    addDummyGraphic(dummySheet, type, WT.TerrainShape.Flat);
  }
  const config = new WT.TerrainBuilderConfig(
    numTerraces,
    WT.TerrainType.Lowland0,
    WT.TerrainType.Lowland0
  );
  let builder = new WT.TerrainBuilder(width, depth, heightMap, config, dims);
  builder.generateMap(context);
  for (let y = 0; y < depth; ++y) {
    for (let x = 0; x < width; ++x) {
      if (x == 4) {
        expect(builder.terrainShapeAt(x, y)).toBe(WT.TerrainShape.Wall);
      } else if (
        (x == 2 && y == 2) ||
        (x == 1 && y == 3) ||
        (x == 3 && y == 3) ||
        (x == 2 && y == 4)
      ) {
        expect(builder.terrainShapeAt(x, y)).toBe(WT.TerrainShape.Wall);
      } else {
        expect(builder.terrainShapeAt(x, y)).toBe(WT.TerrainShape.Flat);
      }
    }
  }
});
