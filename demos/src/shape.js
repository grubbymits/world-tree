import * as WT from "../../../dist/world-tree.mjs";

const worldDescriptor = {
  canvasName: "demoCanvas",
  projection: "TwoByOneIsometric",
  heightMap: [
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
  ],
  numTerraces: 3,
  floor: WT.TerrainType.Lowland0,
  wall: WT.TerrainType.Lowland0,
  terrainSpriteDescriptor: {
    spriteWidth: 161,
    spriteHeight: 125,
    spriteSheetName: "graphics/png/outside-tiles-muted-161x125",
    tileRowTypes: [
      WT.TerrainType.Lowland0,
    ],
    tileColumnShapes: [
      WT.TerrainShape.Flat,
      WT.TerrainShape.FlatWest,
      WT.TerrainShape.FlatNorth,
      WT.TerrainShape.FlatEast,
      WT.TerrainShape.FlatSouth,
      WT.TerrainShape.FlatNorthWest,
      WT.TerrainShape.FlatNorthEast,
      WT.TerrainShape.FlatSouthEast,
      WT.TerrainShape.FlatSouthWest,
      WT.TerrainShape.FlatWestOut,
      WT.TerrainShape.FlatNorthOut,
      WT.TerrainShape.FlatEastOut,
      WT.TerrainShape.FlatSouthOut,
      WT.TerrainShape.FlatAloneOut,
      WT.TerrainShape.FlatNorthSouth,
      WT.TerrainShape.FlatEastWest,
      WT.TerrainShape.RampUpSouth,
      WT.TerrainShape.RampUpWest,
      WT.TerrainShape.RampUpEast,
      WT.TerrainShape.RampUpNorth,
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
