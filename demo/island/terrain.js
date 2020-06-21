import * as WT from "../../dist/world-tree.js";

const spriteWidth = 256;
const spriteHeight = 246;

// Create all the sprite necessary for ground tiles of the island.
let waterSheet = new WT.SpriteSheet("../../../res/img/water");
WT.Terrain.addGraphic(WT.TerrainType.Water, WT.TerrainShape.Flat,
                      waterSheet, 0, 0, spriteWidth, spriteHeight);

let spriteSheetPaths = [
  "../../../res/img/sand",
  "../../../res/img/rock",
  "../../../res/img/light-grass-rock",
];

let terrainTypes = [
  WT.TerrainType.Sand,
  WT.TerrainType.Rock,
  WT.TerrainType.DryGrass,
];

let terrainShapes = [
  WT.TerrainShape.Flat,
  WT.TerrainShape.FlatWest,
  WT.TerrainShape.FlatEast,
  WT.TerrainShape.FlatNorthWest,
  WT.TerrainShape.FlatNorth,
  WT.TerrainShape.FlatNorthEast,
  WT.TerrainShape.FlatSouthWest,
  WT.TerrainShape.FlatSouth,
  WT.TerrainShape.FlatSouthEast,
  WT.TerrainShape.FlatNorthOut,
  WT.TerrainShape.FlatEastOut,
  WT.TerrainShape.FlatWestOut,
  WT.TerrainShape.FlatSouthOut,
  WT.TerrainShape.FlatAloneOut,
  WT.TerrainShape.RampUpSouthEdge,
  WT.TerrainShape.RampUpWestEdge,
  WT.TerrainShape.RampUpEastEdge,
  WT.TerrainShape.RampUpNorthEdge,
  WT.TerrainShape.RampUpSouth,
  WT.TerrainShape.RampUpWest,
  WT.TerrainShape.RampUpEast,
  WT.TerrainShape.RampUpNorth,
];

for (let i in spriteSheetPaths) {
  let sheet = new WT.SpriteSheet(spriteSheetPaths[i]);
  let terrainType = terrainTypes[i];
  let shape = 0;

  // Sprite sheets are 3x7 with a single remaining sprite in the 8th row.
  let y = 0;
  for (; y < 7; y++) {
    for (let x = 0; x < 3; x++) {
      let offsetX = x * spriteWidth;
      let offsetY = y * spriteHeight;
      WT.Terrain.addGraphic(terrainType, terrainShapes[shape],
                            sheet, offsetX, offsetY,
                            spriteWidth, spriteHeight);
      shape++;
    }
  }
  WT.Terrain.addGraphic(terrainType, terrainShapes[shape],
                        sheet, 0, y * spriteHeight,
                        spriteWidth, spriteHeight);
}

// Add graphical features: Waves.
let sheet = new WT.SpriteSheet("../../../res/img/waves");
let features = [ WT.TerrainFeature.ShorelineNorth,
                 WT.TerrainFeature.ShorelineWest,
                 WT.TerrainFeature.ShorelineEast,
                 WT.TerrainFeature.ShorelineSouth, ];

for (let y in features) {               
  let waveSprites = new Array();
  for (let x = 0; x < 3; x++) {
    waveSprites.push(new WT.Sprite(sheet,
                                   x * spriteWidth,
                                   y * spriteHeight,
                                   spriteWidth, spriteHeight));
  }
  let waves = new WT.OssilateGraphicComponent(waveSprites, 500);
  let feature = features[y];
  WT.Terrain.addFeatureGraphics(feature, waves);
}

// Add graphical features: Grass.
sheet = new WT.SpriteSheet("../../../res/img/grass");
let grassSprites = new Array();
for (let x = 0; x < 4; x++) {
  grassSprites.push(new WT.Sprite(sheet, x * spriteWidth, 0,
                                  spriteWidth, 148));
}
let grass = new WT.OssilateGraphicComponent(grassSprites, 333);
WT.Terrain.addFeatureGraphics(WT.TerrainFeature.WetGrass, grass);

grassSprites = new Array();
for (let x = 0; x < 4; x++) {
  grassSprites.push(new WT.Sprite(sheet, x * spriteWidth, 148,
                                  spriteWidth, 148));
}
grass = new WT.OssilateGraphicComponent(grassSprites, 333);
WT.Terrain.addFeatureGraphics(WT.TerrainFeature.DryGrass, grass);

// Add graphical features: Mud.
sheet = new WT.SpriteSheet("../../../res/img/mud");
let mudSprite = new WT.Sprite(sheet, 0, 0, spriteWidth, 149);
let mud = new WT.StaticGraphicComponent(mudSprite.id);
WT.Terrain.addFeatureGraphics(WT.TerrainFeature.Mud, mud);
