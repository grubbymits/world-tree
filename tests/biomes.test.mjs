import * as WT from "../dist/world-tree.mjs";

test("rain", () => {
  const heightGrid = [
    [0, 0, 0, 0, 0 ],
    [0, 0, 0, 0, 0 ],
    [0, 1, 1, 1, 0 ],
    [0, 1, 2, 1, 0 ],
    [0, 1, 2, 1, 0 ],
    [0, 1, 1, 1, 0 ],
    [0, 0, 0, 0, 0 ],
  ];
  const terraceGrid = [
    [0, 0, 0, 0, 0 ],
    [0, 0, 0, 0, 0 ],
    [0, 0, 0, 0, 0 ],
    [0, 0, 1, 0, 0 ],
    [0, 0, 1, 0, 0 ],
    [0, 0, 0, 0, 0 ],
    [0, 0, 0, 0, 0 ],
  ];
  const towards = WT.Direction.North;
  const waterLine = 0;
  const water = 10;
  const moistureGrid = WT.addRain(
    heightGrid,
    terraceGrid,
    towards,
    water,
    waterLine);
  const expected = [
    [ 1, 1, 0.81, 1, 1 ],
    [ 0, 0, 0, 0, 0 ],
    [ 0, 0, 0.05705606717275993, 0, 0 ],
    [ 0, 0, 2.7829154042059856, 0, 0 ],
    [ 0, 0, 3.091948624864835, 0, 0 ],
    [ 0, 0, 0, 0, 0 ],
    [ 0, 0, 0, 0, 0 ]
  ];
  expect(moistureGrid).toEqual(expected);
});

test("no moisture", () => {
  const waterLine = 0;
  const uplandThreshold = 2;
  const rainfall = 0;
  const rainDirection = WT.Direction.North;

  const config = new WT.BiomeConfig(
    waterLine,
    uplandThreshold,
    rainfall,
    rainDirection
  );
  const cellsX = 5;
  const cellsY = 5;
  const heightGrid = [
    [0, 0, 0, 0, 0 ],
    [0, 1, 1, 1, 0 ],
    [0, 1, 2, 1, 0 ],
    [0, 1, 1, 1, 0 ],
    [0, 0, 0, 0, 0 ],
  ];
  const moistureGrid = [
    [0, 0, 0, 0, 0 ],
    [0, 0, 0, 0, 0 ],
    [0, 0, 0, 0, 0 ],
    [0, 0, 0, 0, 0 ],
    [0, 0, 0, 0, 0 ],
  ];
  const biomeGrid = WT.generateBiomeGrid(
    config,
    heightGrid,
    moistureGrid
  );
  for (let x = 0; x < cellsX; ++x) {
    expect(biomeGrid[0][x]).toBe(WT.Biome.Water);
    expect(biomeGrid[4][x]).toBe(WT.Biome.Water);
  }
  for (let y = 1; y < cellsY - 1; ++y) {
    expect(biomeGrid[y][0]).toBe(WT.Biome.Water);
    expect(biomeGrid[y][4]).toBe(WT.Biome.Water);
    expect(biomeGrid[y][1]).toBe(WT.Biome.Desert);
    expect(biomeGrid[y][3]).toBe(WT.Biome.Desert);
  }
  expect(biomeGrid[2][2]).toBe(WT.Biome.Rock);
});

test("moisture", () => {
  const waterLine = 0;
  const uplandThreshold = 2;
  const rainfall = 0;
  const rainDirection = WT.Direction.North;

  const config = new WT.BiomeConfig(
    waterLine,
    uplandThreshold,
    rainfall,
    rainDirection
  );
  const cellsX = 5;
  const cellsY = 5;
  const heightGrid = [
    [0, 0, 0, 0, 0 ],
    [0, 1, 1, 1, 0 ],
    [0, 1, 2, 1, 0 ],
    [0, 1, 1, 1, 0 ],
    [0, 0, 0, 0, 0 ],
  ];
  const moistureGrid = [
    [0, 0, 0, 0, 0 ],
    [0, 1, 2, 3, 0 ],
    [0, 4, 0, 5, 0 ],
    [0, 4, 5, 6, 0 ],
    [0, 0, 0, 0, 0 ],
  ];
  const biomeGrid = WT.generateBiomeGrid(
    config,
    heightGrid,
    moistureGrid
  );
  expect(biomeGrid[1][1]).toBe(WT.Biome.Desert);
  expect(biomeGrid[1][2]).toBe(WT.Biome.Grassland);
  expect(biomeGrid[1][3]).toBe(WT.Biome.Shrubland);
  expect(biomeGrid[3][1]).toBe(WT.Biome.MoistForest);
  expect(biomeGrid[3][2]).toBe(WT.Biome.WetForest);
  expect(biomeGrid[3][3]).toBe(WT.Biome.RainForest);
});
