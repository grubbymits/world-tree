import { assertEquals } from "https://deno.land/std@0.160.0/testing/asserts.ts";

import * as WT from "../world-tree.js";

function addDummyGraphic(sheet, type, shape) {
  WT.Terrain.addGraphic(
    /*terrainType*/ type,
    /*terrainShape*/ shape,
    /*spriteSheet*/ sheet,
    /*coord.x*/ 1,
    1,
    1,
    1,
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

Deno.test("terrace spacing with non-negative heights", () => {
  const dims = new WT.Dimensions(5, 5, 5);
  const width = 5;
  const depth = 5;
  const numTerraces = 3;
  const heightMap = [
    [0, 0, 0, 0, 0],
    [0, 1, 1, 1, 0],
    [0, 1, 2, 1, 0],
    [0, 1, 3, 1, 0],
    [0, 1, 2, 1, 0],
    [0, 0, 0, 0, 0],
  ];
  for (let type of types) {
    addDummyGraphic(dummySheet, type, WT.TerrainShape.Wall);
  }
  const config = new WT.TerrainBuilderConfig(
    numTerraces,
    WT.TerrainType.Lowland0,
    WT.TerrainType.Lowland0,
  );
  let builder = new WT.TerrainBuilder(width, depth, heightMap, config, dims);
  assertEquals(builder.terraceSpacing, 1);
});

Deno.test("terrace spacing with non-positive heights", () => {
  const dims = new WT.Dimensions(5, 5, 5);
  const width = 5;
  const depth = 6;
  const numTerraces = 3;
  const heightMap = [
    [0, 0, 0, 0, 0],
    [0, -1, -1, -1, 0],
    [0, -1, -2, -1, 0],
    [0, -1, -3, -1, 0],
    [0, -1, -2, -1, 0],
    [0, 0, 0, 0, 0],
  ];
  for (let type of types) {
    addDummyGraphic(dummySheet, type, WT.TerrainShape.Wall);
  }
  const config = new WT.TerrainBuilderConfig(
    numTerraces,
    WT.TerrainType.Lowland0,
    WT.TerrainType.Lowland0,
  );
  let builder = new WT.TerrainBuilder(width, depth, heightMap, config, dims);
  assertEquals(builder.terraceSpacing, 1);
});

Deno.test("terrace spacing with positive and negative heights", () => {
  const dims = new WT.Dimensions(5, 5, 5);
  const width = 5;
  const depth = 6;
  const numTerraces = 3;
  const heightMap = [
    [-1.5, -1, -1, -1, -1],
    [0, 0, 0, 0, 0],
    [0, 0, 2, 0, 0],
    [0, 1, 3, 1, 0],
    [0, 1, 2, 1, 0],
    [0, 0, 0, 0, 0],
  ];
  for (let type of types) {
    addDummyGraphic(dummySheet, type, WT.TerrainShape.Wall);
  }
  const config = new WT.TerrainBuilderConfig(
    numTerraces,
    WT.TerrainType.Lowland0,
    WT.TerrainType.Lowland0,
  );
  let builder = new WT.TerrainBuilder(width, depth, heightMap, config, dims);
  assertEquals(builder.terraceSpacing, 1.5);
});

Deno.test("ramps", () => {
  const dims = new WT.Dimensions(5, 5, 5);
  const width = 11;
  const depth = 11;
  const numTerraces = 3;
  const worldDims = new WT.Dimensions(
    dims.width * width,
    dims.depth * depth,
    dims.height * (numTerraces + 1),
  );
  let context = WT.createTestContext(
    worldDims,
    WT.Perspective.TwoByOneIsometric,
  );
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
  for (let type of types) {
    for (let shape of shapes) {
      addDummyGraphic(dummySheet, type, shape);
    }
  }
  let config = new WT.TerrainBuilderConfig(
    numTerraces,
    WT.TerrainType.Lowland0,
    WT.TerrainType.Lowland0,
  );
  config.hasRamps = true;
  let builder = new WT.TerrainBuilder(width, depth, heightMap, config, dims);
  builder.generateMap(context);

  for (let y = 0; y < depth; ++y) {
    for (let x = 0; x < width; ++x) {
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
      assertEquals(builder.terrainShapeAt(x, y), shape);
      //assertEquals(builder.terrainGeometryName(x, y), geometry);
    }
  }
});

Deno.test("walls", () => {
  const dims = new WT.Dimensions(5, 5, 5);
  const width = 5;
  const depth = 6;
  const numTerraces = 2;
  const worldDims = new WT.Dimensions(
    dims.width * width,
    dims.depth * depth,
    dims.height * (numTerraces + 1),
  );
  let context = WT.createTestContext(
    worldDims,
    WT.Perspective.TwoByOneIsometric,
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
    WT.TerrainType.Lowland0,
  );
  let builder = new WT.TerrainBuilder(width, depth, heightMap, config, dims);
  builder.generateMap(context);
  for (let y = 0; y < depth; ++y) {
    for (let x = 0; x < width; ++x) {
      if (x == 4) {
        assertEquals(builder.terrainShapeAt(x, y), WT.TerrainShape.Wall);
      } else if (
        (x == 2 && y == 2) ||
        (x == 1 && y == 3) ||
        (x == 3 && y == 3) ||
        (x == 2 && y == 4)
      ) {
        assertEquals(builder.terrainShapeAt(x, y), WT.TerrainShape.Wall);
      } else {
        assertEquals(builder.terrainShapeAt(x, y), WT.TerrainShape.Flat);
      }
    }
  }
});

Deno.test("shoreline", () => {
  const dims = new WT.Dimensions(5, 5, 5);
  const width = 5;
  const depth = 5;
  const numTerraces = 1;
  const worldDims = new WT.Dimensions(
    dims.width * width,
    dims.depth * depth,
    dims.height * (numTerraces + 1),
  );
  let context = WT.createTestContext(
    worldDims,
    WT.Perspective.TwoByOneIsometric,
  );
  const heightMap = [[0, 0, 0, 0, 0], [0, 1, 1, 1, 0], [0, 1, 2, 1, 0], [
    0,
    1,
    1,
    1,
    0,
  ], [0, 0, 0, 0, 0]];
  const features = [
    WT.TerrainFeature.ShorelineNorth,
    WT.TerrainFeature.ShorelineWest,
    WT.TerrainFeature.ShorelineEast,
    WT.TerrainFeature.ShorelineSouth,
  ];
  for (let feature of features) {
    WT.Terrain.addFeatureGraphics(feature, dummySprite);
  }
  for (let type of types) {
    for (let shape of shapes) {
      addDummyGraphic(dummySheet, type, shape);
    }
  }
  let config = new WT.TerrainBuilderConfig(
    numTerraces,
    WT.TerrainType.Lowland0,
    WT.TerrainType.Lowland0,
  );
  config.hasWater = true;
  config.hasBiomes = true;
  config.waterLine = 0;
  config.uplandThreshold = 4;
  let builder = new WT.TerrainBuilder(width, depth, heightMap, config, dims);
  builder.generateMap(context);

  for (let x = 0; x < width; ++x) {
    assertEquals(builder.terrainTypeAt(x, 0), WT.TerrainType.Water);
    assertEquals(builder.terrainTypeAt(x, 4), WT.TerrainType.Water);
  }
  for (let y = 0; y < depth; ++y) {
    assertEquals(builder.terrainTypeAt(0, y), WT.TerrainType.Water);
    assertEquals(builder.terrainTypeAt(4, y), WT.TerrainType.Water);
  }
  for (let x = 1; x < width - 1; ++x) {
    assertEquals(builder.terrainTypeAt(x, 1), WT.TerrainType.Lowland0);
    assertEquals(
      builder.hasFeature(x, 1, WT.TerrainFeature.ShorelineNorth),
      true,
    );
    assertEquals(builder.terrainTypeAt(x, 3), WT.TerrainType.Lowland0);
    assertEquals(
      builder.hasFeature(x, 3, WT.TerrainFeature.ShorelineSouth),
      true,
    );
  }
  for (let y = 1; y < depth - 1; ++y) {
    assertEquals(builder.terrainTypeAt(1, y), WT.TerrainType.Lowland0);
    assertEquals(
      builder.hasFeature(1, y, WT.TerrainFeature.ShorelineWest),
      true,
    );
    assertEquals(builder.terrainTypeAt(3, y), WT.TerrainType.Lowland0);
    assertEquals(
      builder.hasFeature(3, y, WT.TerrainFeature.ShorelineEast),
      true,
    );
  }
});
