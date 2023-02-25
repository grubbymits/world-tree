import { assertEquals } from "https://deno.land/std@0.160.0/testing/asserts.ts";

import * as WT from "../world-tree.js";

function addDummyGraphic(
  spriteSheet: any,
  terrainType: any,
  terrainShape: any,
) {
  WT.Terrain.addGraphic(
    terrainType,
    terrainShape,
    spriteSheet,
    /*coord.x*/ 1,
    1,
    1,
    1,
  );
}
const dummySheet = WT.DummySpriteSheet;
const dummySprite = {};

Deno.test("3x3 neighbours", () => {
  const dims = new WT.Dimensions(4, 4, 4);
  const width = 3;
  const depth = 3;
  const numTerraces = 1;
  const heightMap = [
    [1, 1, 1],
    [1, 1, 1],
    [1, 1, 1],
  ];
  const worldDims = new WT.Dimensions(
    dims.width * width,
    dims.depth * depth,
    dims.height,
  );
  const context = WT.createTestContext(
    worldDims,
    WT.Perspective.TwoByOneIsometric,
  );
  addDummyGraphic(dummySheet, WT.TerrainType.Lowland0, WT.TerrainShape.Flat);
  const config = new WT.TerrainBuilderConfig(
    numTerraces,
    WT.TerrainType.Lowland0,
    WT.TerrainType.Lowland0,
  );
  const builder = new WT.TerrainBuilder(width, depth, heightMap, config, dims);
  const grid = builder.generateMap(context);

  // at x, y
  assertEquals(grid.getNeighbours(grid.getSurfaceTerrainAt(0, 0)).length, 3);
  assertEquals(grid.getNeighbours(grid.getSurfaceTerrainAt(1, 0)).length, 5);
  assertEquals(grid.getNeighbours(grid.getSurfaceTerrainAt(2, 0)).length, 3);
  assertEquals(grid.getNeighbours(grid.getSurfaceTerrainAt(0, 1)).length, 5);
  assertEquals(grid.getNeighbours(grid.getSurfaceTerrainAt(1, 1)).length, 8);
  assertEquals(grid.getNeighbours(grid.getSurfaceTerrainAt(2, 1)).length, 5);
  assertEquals(grid.getNeighbours(grid.getSurfaceTerrainAt(0, 2)).length, 3);
  assertEquals(grid.getNeighbours(grid.getSurfaceTerrainAt(1, 2)).length, 5);
  assertEquals(grid.getNeighbours(grid.getSurfaceTerrainAt(2, 2)).length, 3);
});

Deno.test("eight neighbours", () => {
  const dims = new WT.Dimensions(4, 4, 4);
  const width = 3;
  const depth = 3;
  const numTerraces = 1;
  const heightMap = [
    [1, 1, 1],
    [1, 1, 1],
    [1, 1, 1],
  ];
  const worldDims = new WT.Dimensions(
    dims.width * width,
    dims.depth * depth,
    dims.height,
  );
  const context = WT.createTestContext(
    worldDims,
    WT.Perspective.TwoByOneIsometric,
  );
  addDummyGraphic(dummySheet, WT.TerrainType.Lowland0, WT.TerrainShape.Flat);
  const config = new WT.TerrainBuilderConfig(
    numTerraces,
    WT.TerrainType.Lowland0,
    WT.TerrainType.Lowland0,
  );
  const builder = new WT.TerrainBuilder(width, depth, heightMap, config, dims);
  const grid = builder.generateMap(context);
  const surface = grid.surfaceTerrain;
  const centre = surface[1][1];
  assertEquals(grid.getNeighbours(centre).length, 8);

  const pathFinder = new WT.PathFinder(grid);
  const accessibleNeighbours = pathFinder.getAccessibleNeighbours(centre);
  assertEquals(accessibleNeighbours.length, 8);
});

Deno.test("move north from centre", () => {
  const dims = new WT.Dimensions(4, 4, 4);
  const width = 3;
  const depth = 3;
  const numTerraces = 1;
  const heightMap = [
    [1, 1, 1],
    [1, 1, 1],
    [1, 1, 1],
  ];
  const worldDims = new WT.Dimensions(
    dims.width * width,
    dims.depth * depth,
    dims.height,
  );
  const context = WT.createTestContext(
    worldDims,
    WT.Perspective.TwoByOneIsometric,
  );
  addDummyGraphic(dummySheet, WT.TerrainType.Lowland0, WT.TerrainShape.Flat);
  const config = new WT.TerrainBuilderConfig(
    numTerraces,
    WT.TerrainType.Lowland0,
    WT.TerrainType.Lowland0,
  );
  const builder = new WT.TerrainBuilder(width, depth, heightMap, config, dims);
  const grid = builder.generateMap(context);
  const surface = grid.surfaceTerrain;
  const start = surface[1][1];
  const end = surface[1][0];
  const pathFinder = new WT.PathFinder(grid);
  const path = pathFinder.findPath(start.surfaceLocation, end.surfaceLocation);
  assertEquals(path.length, 1);
});

Deno.test("path north from points", () => {
  const dims = new WT.Dimensions(4, 4, 4);
  const width = 5;
  const depth = 5;
  const numTerraces = 1;
  const heightMap = [
    [1, 1, 1, 1, 1],
    [1, 1, 1, 1, 1],
    [1, 1, 1, 1, 1],
    [1, 1, 1, 1, 1],
    [1, 1, 1, 1, 1],
  ];
  const worldDims = new WT.Dimensions(
    dims.width * width,
    dims.depth * depth,
    dims.height,
  );
  const context = WT.createTestContext(
    worldDims,
    WT.Perspective.TwoByOneIsometric,
  );
  addDummyGraphic(dummySheet, WT.TerrainType.Lowland0, WT.TerrainShape.Flat);
  const config = new WT.TerrainBuilderConfig(
    numTerraces,
    WT.TerrainType.Lowland0,
    WT.TerrainType.Lowland0,
  );
  const builder = new WT.TerrainBuilder(width, depth, heightMap, config, dims);
  const grid = builder.generateMap(context);
  const pathFinder = new WT.PathFinder(grid);
  // centre.
  const start = new WT.Point3D(
    dims.width * width / 2,
    dims.depth * depth / 2,
    dims.height * 2,
  );
  // top middle.
  const end = new WT.Point3D(dims.width * width / 2, 0, dims.height * 2);
  const path = pathFinder.findPath(start, end);
  assertEquals(path.length, 2);
});

Deno.test("path east", () => {
});

Deno.test("path south", () => {
});

Deno.test("path west", () => {
});
