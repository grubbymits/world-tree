import * as WT from "../../../dist/world-tree.mjs";

const worldDescriptor = {
  canvasName: "demoCanvas",
  projection: "TwoByOneIsometric",
  heightMap: [
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0],
    [0, 1, 2, 2, 2, 2, 1, 1, 1, 1, 0],
    [0, 1, 1, 2, 2, 2, 2, 2, 1, 1, 0],
    [0, 1, 1, 2, 3, 3, 3, 2, 1, 1, 0],
    [0, 1, 1, 2, 3, 3, 3, 2, 1, 1, 0],
    [0, 1, 2, 3, 3, 4, 3, 3, 2, 1, 0],
    [0, 1, 2, 3, 4, 6, 4, 2, 2, 1, 0],
    [0, 1, 2, 3, 4, 4, 3, 2, 2, 1, 0],
    [0, 1, 2, 3, 4, 4, 3, 2, 2, 1, 0],
    [0, 1, 2, 3, 3, 3, 3, 3, 2, 1, 0],
    [0, 1, 1, 2, 2, 2, 3, 3, 1, 1, 0],
    [0, 1, 1, 2, 2, 2, 2, 2, 1, 1, 0],
    [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  ],
  numTerraces: 3,
  floor: WT.TerrainType.Lowland0,
  wall: WT.TerrainType.Lowland0,
  biomeConfig: {
    waterLine: 0,
    rainfall: 50,
    rainDirection: WT.Direction.North,
    uplandThreshold: 4,
  },
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

function random_inrange(min, max) {
  return Math.random() * (max - min) + min;
}

async function addTrees(totalTrees, context) {
  const treeSpriteWidth = 79;
  const treeSpriteHeight = 158;
  const treeDims = WT.TwoByOneIsometric.getDimensions(
    treeSpriteWidth,
    treeSpriteHeight,
  );
  const terrainDims = WT.TwoByOneIsometric.getDimensions(
    worldDescriptor.terrainSpriteDescriptor.spriteWidth,
    worldDescriptor.terrainSpriteDescriptor.spriteHeight
  );
  const graphics =
    await WT.SpriteSheet.create("graphics/png/tall-trees-muted", context).then((sheet) => {
      const rows = 2;
      const columns = 2;
      const treeGraphics = new Array();
      for (let y = 0; y < rows; ++y) {
        for (let x = 0; x < columns; ++x) {
          const spriteId = WT.Sprite.create(
            sheet,
            x * treeSpriteWidth,
            y * treeSpriteHeight,
            treeSpriteWidth,
            treeSpriteHeight
          );
          treeGraphics.push(new WT.StaticGraphicComponent(spriteId));
        }
      }
      let inserted = 0;
      let insertedAt = new Map();
      let attempts = 0;
      const maxAttempts = 1000;
      const waterOrTooDry = function (biome) {
        return biome == WT.Biome.Water ||
          biome == WT.Biome.Desert ||
          biome == WT.Biome.Rock ||
          biome == WT.Biome.Tundra;
      };
      const cellsX = context.grid.cellsX;
      const cellsY = context.grid.cellsY;
      while (inserted < totalTrees && attempts < maxAttempts) {
        // Choose a random spot on the map and check whether it seems wet
        // enough to support a tree.
        attempts++;
        const x = Math.floor(Math.random() * cellsX);
        const y = Math.floor(Math.random() * cellsY);
        const biome = context.grid.biomeAt(x, y);
        // Don't place a tree where it would be out of place.
        if (waterOrTooDry(biome)) {
          continue;
        }
        // Don't place on a ramp.
        if (!WT.Terrain.isFlat(context.grid.terrainShapeAt(x, y))) {
          continue;
        }
        if (WT.Terrain.isEdge(context.grid.terrainShapeAt(x, y))) {
          continue;
        }
        // Don't place two trees in the same place.
        if (insertedAt.has(y) && insertedAt.get(y).has(x)) {
          continue;
        } else if (insertedAt.has(y)) {
          insertedAt.get(y).add(x);
        } else {
          insertedAt.set(y, new Set());
          insertedAt.get(y).add(x);
        }

        // Try not the place the tree in the exact same relative spot within a tile.
        const offsetX = random_inrange(treeDims.width / -4, treeDims.width / 4);
        const offsetY = random_inrange(treeDims.depth / -4, treeDims.depth / 4);
        const loc =
          context.grid.getSurfaceLocationAt(x, y).add(new WT.Vector3D(offsetX, offsetY, 1));

        // Choose a random graphic.
        const idx = Math.floor(random_inrange(0, treeGraphics.length - 1));
        const graphic = treeGraphics[idx];
        const tree = new WT.createGraphicalEntity(context, loc, treeDims, graphic);
        inserted++;
      }
      console.log('number of trees added:', inserted);
  });
}

window.onload = async (event) => {
  const context = await WT.createWorld(worldDescriptor);
  const canvas = document.getElementById("demoCanvas");
  const camera = new WT.MouseCamera(
    context.scene,
    canvas,
    canvas.width,
    canvas.height,
  );

  await addTrees(15, context);

  const update = function() {
    if (document.hasFocus()) {
      context.update(camera);
    }
    window.requestAnimationFrame(update);
  };
  window.requestAnimationFrame(update);
};
