import * as WT from "../dist/world-tree.mjs";

export function addDummyTerrainGraphic(type, shape) {
  const dummySheet = WT.DummySpriteSheet;
  WT.TerrainGraphics.addGraphic(
    /*terrainType*/ type,
    /*terrainShape*/ shape,
    /*spriteSheet*/ dummySheet,
    /*coord.x*/ 1,
    1,
    1,
    1
  );
}
