import * as WT from "../../../dist/world-tree.mjs";

const heightMap = new WT.ValueGradientLattice(20, 20, 4, 3).noise;
const worldDescriptor = {
  canvasName: "demoCanvas",
  projection: "TwoByOneIsometric",
  heightMap: heightMap,
  numTerraces: 4,
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
