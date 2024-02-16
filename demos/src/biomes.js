import * as WT from "../../../dist/world-tree.mjs";

const worldDescriptor = {
  canvasName: "demoCanvas",
  projection: "TwoByOneIsometric",
  heightMap: [
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0],
    [0, 1, 2, 2, 2, 2, 1, 1, 1, 1, 0],
    [0, 1, 1, 2, 2, 2, 2, 2, 1, 1, 0],
    [0, 1, 2, 2, 3, 3, 3, 2, 2, 1, 0],
    [0, 1, 2, 3, 3, 4, 3, 2, 2, 1, 0],
    [0, 1, 2, 2, 3, 3, 3, 2, 2, 1, 0],
    [0, 1, 2, 2, 2, 2, 2, 2, 2, 1, 0],
    [0, 1, 1, 2, 2, 2, 2, 2, 1, 1, 0],
    [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  ],
  numTerraces: 3,
  floor: WT.TerrainType.Lowland3,
  wall: WT.TerrainType.Lowland3,
  biomeConfig: {
    waterLine: 0,
    rainfall: 50,
    rainDirection: WT.Direction.North,
    uplandThreshold: 4,
  },
  terrainSpriteDescriptor: {
    spriteWidth: 322,
    spriteHeight: 270,
    spriteSheetName: "graphics/png/outside-terrain-tiles-muted",
    tileRowsTypes: [
      WT.TerrainType.Lowland5,
      WT.TerrainType.Lowland4,
      WT.TerrainType.Lowland3,
      WT.TerrainType.Lowland2,
      WT.TerrainType.Lowland1,
      WT.TerrainType.Lowland0,
      WT.TerrainType.Upland5,
      WT.TerrainType.Upland4,
      WT.TerrainType.Upland3,
      WT.TerrainType.Upland2,
      WT.TerrainType.Upland1,
      WT.TerrainType.Upland0,
      WT.TerrainType.Water,
    ],
    tileColumnShapes: [
      WT.TerrainShape.Flat,
    ],
  },
};

window.onload = async (event) => {
  const context = await WT.createWorld(worldDescriptor);
  const canvas = document.getElementById("demoCanvas");
  const camera = new WT.MouseCamera(
    context.scene,
    canvas,
    canvas.width,
    canvas.height,
  );

  const update = function() {
    if (document.hasFocus()) {
      context.update(camera);
    }
    window.requestAnimationFrame(update);
  };
  window.requestAnimationFrame(update);
};
