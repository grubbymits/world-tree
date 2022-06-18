import * as WT from '../dist/world-tree.js';

function addDummyGraphic(sheet, type, shape) {
  WT.Terrain.addGraphic(/*terrainType*/type,
                        /*terrainShape*/shape,
                        /*spriteSheet*/sheet,
                        /*coord.x*/1, 1, 1, 1);
}
const dummySheet = { };
const dummySprite = { };
const types = [
  WT.TerrainType.Rock,
  WT.TerrainType.DryGrass,
  WT.TerrainType.WetGrass,
  WT.TerrainType.Mud,
  WT.TerrainType.Sand,
  WT.TerrainType.Water,
];
const shapes = [
  WT.TerrainShape.Flat,
  WT.TerrainShape.RampUpSouth,
  WT.TerrainShape.RampUpWest,
  WT.TerrainShape.RampUpEast,
  WT.TerrainShape.RampUpNorth,
];
for (let type of types) {
  for (let shape of shapes) {
    addDummyGraphic(dummySheet, type, shape);
  }
}
                                           
test('terrace spacing with non-negative heights', () => {
  const dims = new WT.Dimensions(5, 5, 5);
  const width = 5;
  const depth = 5;
  const numTerraces = 3;
  const heightMap = [ [0, 0, 0, 0, 0],
                      [0, 1, 1, 1, 0],
                      [0, 1, 2, 1, 0],
                      [0, 1, 3, 1, 0],
                      [0, 1, 2, 1, 0],
                      [0, 0, 0, 0, 0] ];
  const config = new WT.TerrainBuilderConfig(numTerraces,
                                             WT.TerrainType.Rock,
                                             WT.TerrainType.Sand);
  let builder = new WT.TerrainBuilder(width, depth, heightMap, config, dims);
  expect(builder.terraceSpacing).toBe(1);
});

test('terrace spacing with non-positive heights', () => {
  const dims = new WT.Dimensions(5, 5, 5);
  const width = 5;
  const depth = 6;
  const numTerraces = 3;
  const heightMap = [ [0,  0,  0,  0, 0],
                      [0, -1, -1, -1, 0],
                      [0, -1, -2, -1, 0],
                      [0, -1, -3, -1, 0],
                      [0, -1, -2, -1, 0],
                      [0,  0,  0,  0, 0] ];
  const config = new WT.TerrainBuilderConfig(numTerraces,
                                             WT.TerrainType.Rock,
                                             WT.TerrainType.Sand);
  let builder = new WT.TerrainBuilder(width, depth, heightMap, config, dims);
  expect(builder.terraceSpacing).toBe(1);
});

test('terrace spacing with positive and negative heights', () => {
  const dims = new WT.Dimensions(5, 5, 5);
  const width = 5;
  const depth = 6;
  const numTerraces = 3;
  const heightMap = [ [-1.5, -1, -1, -1, -1],
                      [ 0,  0,  0,  0, 0],
                      [ 0,  0,  2,  0, 0],
                      [ 0,  1,  3,  1, 0],
                      [ 0,  1,  2,  1, 0],
                      [ 0,  0,  0,  0, 0] ];
  const config = new WT.TerrainBuilderConfig(numTerraces,
                                             WT.TerrainType.Rock,
                                             WT.TerrainType.Sand);
  let builder = new WT.TerrainBuilder(width, depth, heightMap, config, dims);
  expect(builder.terraceSpacing).toBe(1.5);
});

test('ramps', () => {
  const dims = new WT.Dimensions(5, 5, 5);
  const width = 11;
  const depth = 11;
  const numTerraces = 3;
  const worldDims = new WT.Dimensions(dims.width * width,
                                      dims.depth * depth,
                                      dims.height * (numTerraces + 1));
  const heightMap = [ [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 ],
                      [ 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0 ],
                      [ 0, 1, 2, 2, 2, 2, 1, 1, 1, 1, 0 ],
                      [ 0, 1, 1, 2, 2, 2, 2, 2, 1, 1, 0 ],
                      [ 0, 1, 2, 3, 3, 4, 3, 2, 2, 1, 0 ],
                      [ 0, 1, 2, 3, 4, 6, 4, 2, 2, 1, 0 ],
                      [ 0, 1, 2, 3, 4, 4, 3, 2, 2, 1, 0 ],
                      [ 0, 1, 2, 3, 3, 2, 2, 2, 2, 1, 0 ],
                      [ 0, 1, 1, 2, 2, 2, 2, 2, 1, 1, 0 ],
                      [ 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0 ],
                      [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] ];
  let config = new WT.TerrainBuilderConfig(numTerraces,
                                           WT.TerrainType.Rock,
                                           WT.TerrainType.Rock);
  config.hasRamps = true;
  let builder = new WT.TerrainBuilder(width, depth, heightMap, config, dims);
  let context = WT.createTestContext(worldDims, WT.Perspective.TwoByOneIsometric);
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
      expect(builder.terrainShapeAt(x, y)).toBe(shape);
      //expect(builder.terrainGeometryName(x, y)).toBe(geometry);
    }
  }
});

test('walls', () => {
  for (let type of types) {
    addDummyGraphic(dummySheet, type, WT.TerrainShape.Wall);
  }
  const dims = new WT.Dimensions(5, 5, 5);
  const width = 5;
  const depth = 6;
  const numTerraces = 2;
  const worldDims = new WT.Dimensions(dims.width * width,
                                      dims.depth * depth,
                                      dims.height * (numTerraces + 1));
  const heightMap = [ [ 0, 0, 0, 0, 1],
                      [ 0, 0, 0, 0, 1],
                      [ 0, 0, 2, 0, 1],
                      [ 0, 2, 2, 2, 1],
                      [ 0, 0, 2, 0, 1],
                      [ 0, 0, 0, 0, 1] ];
  const config = new WT.TerrainBuilderConfig(numTerraces,
                                             WT.TerrainType.Rock,
                                             WT.TerrainType.Rock);
  let builder = new WT.TerrainBuilder(width, depth, heightMap, config, dims);
  let context = WT.createTestContext(worldDims, WT.Perspective.TwoByOneIsometric);
  builder.generateMap(context);
  for (let y = 0; y < depth; ++y) {
    for (let x = 0; x < width; ++x) {
      if (x == 4) {
        expect(builder.terrainShapeAt(x, y)).toBe(WT.TerrainShape.Wall);
      } else if ((x == 2 && y == 2) ||
                 (x == 1 && y == 3) ||
                 (x == 3 && y == 3) ||
                 (x == 2 && y == 4)) {
        expect(builder.terrainShapeAt(x, y)).toBe(WT.TerrainShape.Wall);
      } else {
        expect(builder.terrainShapeAt(x, y)).toBe(WT.TerrainShape.Flat);
      }
    }
  }
});

test('shoreline', () => {
  const features = [ WT.TerrainFeature.ShorelineNorth,
                     WT.TerrainFeature.ShorelineWest,
                     WT.TerrainFeature.ShorelineEast,
                     WT.TerrainFeature.ShorelineSouth ];
  for (let feature of features) {
    WT.Terrain.addFeatureGraphics(feature, dummySprite);
  }
  const dims = new WT.Dimensions(5, 5, 5);
  const width = 5;
  const depth = 5;
  const numTerraces = 1;
  const worldDims = new WT.Dimensions(dims.width * width,
                                      dims.depth * depth,
                                      dims.height * (numTerraces + 1));
  const heightMap = [ [ 0, 0, 0, 0, 0 ],
                      [ 0, 1, 1, 1, 0 ],
                      [ 0, 1, 2, 1, 0 ],
                      [ 0, 1, 1, 1, 0 ],
                      [ 0, 0, 0, 0, 0 ]];
  let config = new WT.TerrainBuilderConfig(numTerraces,
                                           WT.TerrainType.Rock,
                                           WT.TerrainType.Rock);
  config.hasRamps = true;
  config.hasWater = true;
  config.hasBiomes = true;
  let builder = new WT.TerrainBuilder(width, depth, heightMap, config, dims);
  let context = WT.createTestContext(worldDims, WT.Perspective.TwoByOneIsometric);
  builder.generateMap(context);

  for (let x = 0; x < width; ++x) {
    expect(builder.terrainTypeAt(x, 0)).toBe(WT.TerrainType.Water);
    expect(builder.terrainTypeAt(x, 4)).toBe(WT.TerrainType.Water);
  }
  for (let y = 0; y < depth; ++y) {
    expect(builder.terrainTypeAt(0, y)).toBe(WT.TerrainType.Water);
    expect(builder.terrainTypeAt(4, y)).toBe(WT.TerrainType.Water);
  }
  for (let x = 1; x < width - 1; ++x) {
    expect(builder.terrainTypeAt(x, 1)).toBe(WT.TerrainType.Sand);
    expect(builder.biomeAt(x, 1)).toBe(WT.Biome.Beach);
    expect(builder.hasFeature(x, 1, WT.TerrainFeature.ShorelineNorth)).toBe(true);
    expect(builder.terrainTypeAt(x, 3)).toBe(WT.TerrainType.Sand);
    expect(builder.biomeAt(x, 3)).toBe(WT.Biome.Beach);
    expect(builder.hasFeature(x, 3, WT.TerrainFeature.ShorelineSouth)).toBe(true);
  }
  for (let y = 1; y < depth - 1; ++y) {
    expect(builder.terrainTypeAt(1, y)).toBe(WT.TerrainType.Sand);
    expect(builder.biomeAt(1, y)).toBe(WT.Biome.Beach);
    expect(builder.hasFeature(1, y, WT.TerrainFeature.ShorelineWest)).toBe(true);
    expect(builder.terrainTypeAt(3, y)).toBe(WT.TerrainType.Sand);
    expect(builder.biomeAt(3, y)).toBe(WT.Biome.Beach);
    expect(builder.hasFeature(3, y, WT.TerrainFeature.ShorelineEast)).toBe(true);
  }
});

test('rain northwards', () => {
  const dims = new WT.Dimensions(5, 5, 5);
  const width = 11;
  const depth = 11;
  const numTerraces = 3;
  const worldDims = new WT.Dimensions(dims.width * width,
                                      dims.depth * depth,
                                      dims.height * (numTerraces + 1));
  const heightMap = [ [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 ],
                      [ 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0 ],
                      [ 0, 1, 2, 2, 2, 2, 1, 1, 1, 1, 0 ],
                      [ 0, 1, 1, 2, 2, 2, 2, 2, 1, 1, 0 ],
                      [ 0, 1, 2, 3, 3, 4, 3, 2, 2, 1, 0 ],
                      [ 0, 1, 2, 3, 4, 6, 4, 2, 2, 1, 0 ],
                      [ 0, 1, 2, 3, 4, 4, 3, 2, 2, 1, 0 ],
                      [ 0, 1, 2, 3, 3, 2, 2, 2, 2, 1, 0 ],
                      [ 0, 1, 1, 2, 2, 2, 2, 2, 1, 1, 0 ],
                      [ 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0 ],
                      [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] ];
  let config = new WT.TerrainBuilderConfig(numTerraces,
                                           WT.TerrainType.Rock,
                                           WT.TerrainType.Rock);
  config.hasRamps = true;
  config.hasWater = true;
  config.waterLine = 0;
  config.rainfall = 30;
  config.rainDirection = WT.Direction.North;

  let builder = new WT.TerrainBuilder(width, depth, heightMap, config, dims);
  let context = WT.createTestContext(worldDims, WT.Perspective.TwoByOneIsometric);
  builder.generateMap(context);

  // No 'moisture' over the surrounding water.
  for (let x = 0; x < width; ++x) {
    expect(builder.moistureAt(x, 0)).toBe(0);
    expect(builder.moistureAt(x, depth - 1)).toBe(0);
  }
  for (let y = 0; y < depth; ++y) {
    expect(builder.moistureAt(0, y)).toBe(0);
    expect(builder.moistureAt(width - 1, y)).toBe(0);
  }
  // Check first row of rainfall
  let y = depth - 2;
  expect(Math.round(builder.moistureAt(1, y))).toBe(2);
  expect(Math.round(builder.moistureAt(2, y))).toBe(2);
  expect(Math.round(builder.moistureAt(3, y))).toBe(3);
  expect(Math.round(builder.moistureAt(4, y))).toBe(3);
  expect(Math.round(builder.moistureAt(5, y))).toBe(3);
  expect(Math.round(builder.moistureAt(6, y))).toBe(3);
  expect(Math.round(builder.moistureAt(7, y))).toBe(3);
  expect(Math.round(builder.moistureAt(8, y))).toBe(2);
  expect(Math.round(builder.moistureAt(9, y))).toBe(2);

  // Check second row of rainfall
  y = depth - 3;
  expect(Math.round(builder.moistureAt(1, y))).toBe(1);
  expect(Math.round(builder.moistureAt(2, y))).toBe(4);
  expect(Math.round(builder.moistureAt(3, y))).toBe(3);
  expect(Math.round(builder.moistureAt(4, y))).toBe(3);
  expect(Math.round(builder.moistureAt(5, y))).toBe(4);
  expect(Math.round(builder.moistureAt(6, y))).toBe(3);
  expect(Math.round(builder.moistureAt(7, y))).toBe(3);
  expect(Math.round(builder.moistureAt(8, y))).toBe(4);
  expect(Math.round(builder.moistureAt(9, y))).toBe(1);
});
