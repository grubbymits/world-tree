import * as WT from "../../../dist/world-tree.mjs";

const width = 20;
const depth = 20;
const scale = 4;
const factor = 3;
const numTerraces = 3;
const lattice = new WT.GradientNoise(width, depth, scale, factor);
const worldDescriptor = {
  canvasName: "demoCanvas",
  projection: "TwoByOneIsometric",
  heightMap: lattice.valueGradientNoise(),
  numTerraces: numTerraces,
  defaultTerrainType: WT.TerrainType.DryGrass,
  biomeConfig: {
    waterLine: 1,
    rainfall: 50,
    rainDirection: WT.Direction.North,
    uplandThreshold: 4,
  },
  terrainSpriteDescriptor: {
    spriteWidth: 161,
    spriteHeight: 124,
    spriteSheetName: "graphics/png/flat-tiles-162x123",
    tileRowTypes: [
      WT.TerrainType.WetGrass,
      WT.TerrainType.DryGrass,
      WT.TerrainType.Mud,
      WT.TerrainType.Sand,
      WT.TerrainType.Rock,
      WT.TerrainType.Snow,
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
