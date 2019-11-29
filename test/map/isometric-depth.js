import * as WT from "../../dist/world-tree.js";
import OpenSimplexNoise from "../../libs/open-simplex-noise/index.js";

function createGraphic(path) {
  let sheet = new WT.SpriteSheet(path);
  let sprite = new WT.Sprite(sheet, 0, 0, 128, 128);
  return new Array(new WT.StaticGraphicComponent(sprite.id));
}

function createGraphics(paths) {
  let graphics = new Array();
  for (let i in paths) {
    let path = paths[i];
    let sheet = new WT.SpriteSheet(path);
    let sprite = new WT.Sprite(sheet, 0, 0, 128, 128);
    graphics.push(new WT.StaticGraphicComponent(sprite.id));
  }
  return graphics;
}

window.onload = function begin() {
  WT.Terrain.addTerrainGraphics(WT.TerrainType.Water, createGraphic("../../../res/img/light-water-flat"));
  let sprites = new Array("../../../res/img/sand-flat",
                          "../../../res/img/sand-ramp-north",
                          "../../../res/img/sand-ramp-east",
                          "../../../res/img/sand-ramp-south",
                          "../../../res/img/sand-ramp-west");
  WT.Terrain.addTerrainGraphics(WT.TerrainType.Sand, createGraphics(sprites));
  sprites = new Array("../../../res/img/light-grass-sand-flat",
                          "../../../res/img/light-grass-sand-ramp-north",
                          "../../../res/img/light-grass-sand-ramp-east",
                          "../../../res/img/sand-ramp-south",
                          "../../../res/img/sand-ramp-west");
  WT.Terrain.addTerrainGraphics(WT.TerrainType.DryGrass, createGraphics(sprites));
  sprites = new Array("../../../res/img/light-grass-rock-flat",
                          "../../../res/img/light-grass-rock-ramp-north",
                          "../../../res/img/light-grass-rock-ramp-east",
                          "../../../res/img/rock-ramp-south",
                          "../../../res/img/rock-ramp-west");
  WT.Terrain.addTerrainGraphics(WT.TerrainType.Rock, createGraphics(sprites));
  sprites = new Array("../../../res/img/dark-grass-sand-flat",
                      "../../../res/img/dark-grass-sand-ramp-north",
                      "../../../res/img/dark-grass-sand-ramp-east",
                      "../../../res/img/sand-ramp-south",
                      "../../../res/img/sand-ramp-west");
  WT.Terrain.addTerrainGraphics(WT.TerrainType.WetGrass, createGraphics(sprites));

  let tileDepth = 64;
  let cellsX = 15;
  let cellsY = 14;
  let terraces = 3;
  let waterMultiplier = 1.0;
  const openSimplex = new OpenSimplexNoise(Date.now());
  let heightMap = new Array();
  for (let y = 0; y < cellsY; y++) {
    heightMap[y] = new Array();
    for (let x = 0; x < cellsX; x++) {
      heightMap[y].push(openSimplex.noise2D(x, y) + 1); // value between 0-2.
    }
  }

  let tileWidth = 128;
  let tileHeight = 64;
  let builder = new WT.TerrainBuilder(cellsX, cellsY, terraces, waterMultiplier,
                                      tileWidth, tileHeight, tileDepth);
  builder.build(heightMap);
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
}
