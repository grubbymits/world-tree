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
  hasRamps: true,
  defaultTerrainType: WT.TerrainType.DryGrass,
  terrainSpriteDescriptor: {
    spriteWidth: 161,
    spriteHeight: 125,
    spriteSheetName: "graphics/png/outside-tiles-muted-161x125",
    tileRowTypes: [
      WT.TerrainType.DryGrass,
    ],
    tileColumnShapes: [
      WT.TerrainShape.Flat,
      WT.TerrainShape.WestEdge,
      WT.TerrainShape.NorthEdge,
      WT.TerrainShape.EastEdge,
      WT.TerrainShape.SouthEdge,
      WT.TerrainShape.NorthWestCorner,
      WT.TerrainShape.NorthEastCorner,
      WT.TerrainShape.SouthEastCorner,
      WT.TerrainShape.SouthWestCorner,
      WT.TerrainShape.WestPeninsula,
      WT.TerrainShape.NorthPeninsula,
      WT.TerrainShape.EastPeninsula,
      WT.TerrainShape.SouthPeninsula,
      WT.TerrainShape.Spire,
      WT.TerrainShape.NorthSouthCorridor,
      WT.TerrainShape.EastWestCorridor,
      WT.TerrainShape.RampSouth,
      WT.TerrainShape.RampWest,
      WT.TerrainShape.RampEast,
      WT.TerrainShape.RampNorth,
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
