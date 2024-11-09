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
  defaultTerrainType: WT.TerrainType.DryGrass,
  biomeConfig: {
    waterLine: 0,
    rainfall: 50,
    rainDirection: WT.Direction.North,
    uplandThreshold: 4,
  },
  terrainSpriteDescriptor: {
    spriteWidth: 161,
    spriteHeight: 124,
    spriteSheetName: "graphics/png/flat-tiles-162x124",
    tileRowTypes: [
      WT.TerrainType.WetGrass,
      WT.TerrainType.DryGrass,
      WT.TerrainType.Mud,
      WT.TerrainType.Sand,
      WT.TerrainType.Rock,
      WT.TerrainType.Snow,
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
