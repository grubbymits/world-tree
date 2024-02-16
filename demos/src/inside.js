import * as WT from "../../../dist/world-tree.mjs";

const worldDescriptor = {
  canvasName: "demoCanvas",
  projection: "TwoByOneIsometric",
  numTerraces: 1,
  heightMap: [ [ 1, 1, 0, 1, 1 ],
               [ 1, 0, 0, 0, 1 ],
               [ 1, 0, 0, 0, 1 ],
               [ 0, 0, 0, 0, 1 ],
               [ 0, 0, 1, 1, 1 ],
             ],
  floor: WT.TerrainType.Inside,
  wall: WT.TerrainType.Inside,
  terrainSpriteDescriptor: {
    spriteSheetName: "graphics/png/basic-dungeon",
    spriteWidth: 322,
    spriteHeight: 270,
    tileRowTypes: [
      WT.TerrainType.Inside,
    ],
    tileColumnShapes: [
      WT.TerrainShape.Flat,
      WT.TerrainShape.Wall,
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
