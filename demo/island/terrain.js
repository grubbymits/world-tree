import * as WT from "../../dist/world-tree.js";

const spriteWidth = 256;
const spriteHeight = 246;

// Create all the sprite necessary for ground tiles of the island.
let sheet = new WT.SpriteSheet("../../../res/img/water");
WT.Terrain.addGraphic(WT.TerrainType.Water, sheet, spriteWidth, spriteHeight);

sheet = new WT.SpriteSheet("../../../res/img/sand");
WT.Terrain.addGraphics(WT.TerrainType.Sand, sheet, spriteWidth, spriteHeight);

sheet = new WT.SpriteSheet("../../../res/img/rock");
WT.Terrain.addGraphics(WT.TerrainType.Rock, sheet, spriteWidth, spriteHeight);

sheet = new WT.SpriteSheet("../../../res/img/light-grass-rock");
WT.Terrain.addGraphics(WT.TerrainType.DryGrass, sheet, spriteWidth, spriteHeight);

WT.Terrain.addGraphics(WT.TerrainType.WetGrass, sheet, spriteWidth, spriteHeight);
WT.Terrain.addGraphics(WT.TerrainType.Mud, sheet, spriteWidth, spriteHeight);

// Add graphical features: Waves.
sheet = new WT.SpriteSheet("../../../res/img/waves");
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
