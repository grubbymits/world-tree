import * as WT from "../../../dist/world-tree.mjs";
const spriteWidth = 322;
const spriteHeight = 270;

const cellsX = 11;
const cellsY = 11;
const numTerraces = 3;
const heightMap = [
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
];

window.onload = (event) => {
  console.log("biome window loaded");
  const physicalDims = WT.TwoByOneIsometric.getDimensions(
    spriteWidth,
    spriteHeight,
  );
  const worldDims = new WT.Dimensions(
    physicalDims.width * cellsX,
    physicalDims.depth * cellsY,
    physicalDims.height * (1 + numTerraces),
  );
  let canvas = document.getElementById("demoCanvas");
  let context = WT.createContext(
    canvas,
    worldDims,
    WT.Perspective.TwoByOneIsometric,
  );
  console.log("attempting to construct SpriteSheet");
  WT.SpriteSheet.create("graphics/png/outside-terrain-tiles-muted", context).then((sheet) => {
    const terrainSpriteDescriptor = {
      spriteWidth: spriteWidth,
      spriteHeight: spriteHeight,
      spriteSheet: sheet,
      tileRows: [
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
      tileColumns: [
        WT.TerrainShape.Flat,
      ],
    };
    WT.Terrain.generateSprites(terrainSpriteDescriptor);

    // Use the height map to construct a terrain.
    let builder = new WT.TerrainBuilder(
      heightMap,
      numTerraces,
      WT.TerrainType.Lowland3,
      WT.TerrainType.Lowland3,
      physicalDims
    );

    const biomeConfig = {
      waterLine: 0,
      rainfall: 50,
      rainDirection: WT.Direction.North,
      uplandThreshold: 4,
    };
    builder.generateBiomes(biomeConfig);
    builder.generateMap(context);

    let camera = new WT.MouseCamera(
      context.scene,
      canvas,
      canvas.width,
      canvas.height,
    );

    var update = function update() {
      if (document.hasFocus()) {
        context.update(camera);
      }
      window.requestAnimationFrame(update);
    };
    window.requestAnimationFrame(update);
  });
};
