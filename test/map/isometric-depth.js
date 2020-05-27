import * as WT from "../../dist/world-tree.js";
import OpenSimplexNoise from "../../libs/open-simplex-noise/index.js";

const spriteWidth = 256;
const spriteHeight = 246;

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

sheet = new WT.SpriteSheet("../../../res/img/mud");
let mudSprite = new WT.Sprite(sheet, 0, 0, spriteWidth, 149);
let mud = new WT.StaticGraphicComponent(mudSprite.id);
WT.Terrain.addFeatureGraphics(WT.TerrainFeature.Mud, mud);

window.onload = (event) => {
  console.log("loaded");
  let cellsX = 50;
  let cellsY = 50;
  let freq = 0.2;
  const openSimplex = new OpenSimplexNoise(Date.now());
  let heightMap = new Array();

  let cx = Math.floor(cellsX / 2);
  let cy = Math.floor(cellsY / 2);
  let defaultHeight = 0.75;
  let factor = 0.05;
  let ceiling = 1;

  for (let y = 0; y < cellsY; y++) {
    heightMap[y] = new Array();
    for (let x = 0; x < cellsX; x++) {
      let height = defaultHeight;
      height += 0.40 * openSimplex.noise2D(freq * x, freq * y) +
                0.20 * openSimplex.noise2D(freq * 2 * x, freq * 2 * y) +
                0.10 * openSimplex.noise2D(freq * 4 * x, freq * 4 * y);
      let nx = Math.abs(x - cx);
      let ny = Math.abs(y - cy);
      let distance = Math.sqrt(Math.pow(nx, 2) + Math.pow(ny, 2));
      height -= factor * distance;
      heightMap[y].push(height);
    }
  }

  // width / height ratio => 2 cubes high, 3 wide and 3 deep.
  let relativeDims = new WT.Dimensions(3, 3, 2);
  let physicalDims =
    new WT.IsometricPhysicalDimensions(spriteWidth, relativeDims);
  let terraces = 4;
  let water = 3;
  let dryLimit = 0.2;
  let wetLimit = 1;

  let builder = new WT.TerrainBuilder(cellsX, cellsY, ceiling, terraces,
                                      water, wetLimit, dryLimit,
                                      physicalDims);
  builder.initialise(heightMap);
  builder.addRain();
  builder.populate();

  let canvas = document.getElementById("testCanvas");
  let context = new WT.Context(builder.terrain, WT.CoordSystem.Isometric, canvas);

  var update = function update() {
    if (document.hasFocus()) {
      context.update();
    }
    window.requestAnimationFrame(update);
  }
  window.requestAnimationFrame(update);
  console.log("done");
  context.run();
};

