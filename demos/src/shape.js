import * as WT from "../../../dist/world-tree.mjs";

const width = 20;
const depth = 20;
const scale = 4;
const factor = 2;
const numTerraces = 3;
const lattice = new WT.GradientNoise(width, depth, scale, factor);
const worldDescriptor = {
  canvasName: "demoCanvas",
  projection: "TwoByOneIsometric",
  heightMap: lattice.valueGradientNoise(WT.quadraticMean),
  numTerraces: numTerraces,
  hasRamps: true,
  defaultTerrainType: WT.TerrainType.DryGrass,
  terrainSpriteDescriptor: {
    spriteWidth: 161,
    spriteHeight: 125,
    spriteSheetName: "graphics/png/grass-all-shapes-161x125",
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
