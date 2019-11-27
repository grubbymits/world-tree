import * as WT from '../../dist/world-tree.js';

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
  let tileWidth = 128;
  let tileHeight = 64;
  let tileDepth = 64;
  let cellsX = 15;
  let cellsY = 14;
  let terraces = 3;
  let waterMultiplier = 1.0;
  let waterLevel = 0.1;

  let sprites = new Array("../../../res/img/light-grass-sand-flat",
                          "../../../res/img/light-grass-sand-ramp-north",
                          "../../../res/img/light-grass-sand-ramp-east",
                          "../../../res/img/sand-ramp-south",
                          "../../../res/img/sand-ramp-west");
  WT.Terrain.addTerrainGraphics(WT.TerrainType.Grass, createGraphics(sprites));
  WT.Terrain.addTerrainGraphics(WT.TerrainType.Water, createGraphic("../../../res/img/light-water-flat"));
  WT.Terrain.addTerrainGraphics(WT.TerrainType.Sand, createGraphic("../../../res/img/sand-flat"));

  let water =  new Array(0.0, 0.0,  0.0,  0.0,  0.0,  0.0,  0.0,  0.0,  0.0,  0.0,  0.0,  0.0,  0.0,  0.0,  0.0);
  let edge  =  new Array(0.0, 0.11, 0.12, 0.13, 0.14, 0.15, 0.14, 0.13, 0.12, 0.11, 0.10, 0.0,  0.0,  0.0,  0.0);
  let ground = new Array(0.0, 0.11, 0.12, 0.23, 0.24, 0.25, 0.26, 0.27, 0.26, 0.24, 0.23, 0.12, 0.11, 0.10, 0.0);
  let raised = new Array(0.0, 0.11, 0.22, 0.25, 0.3,  0.35, 0.40, 0.35, 0.3,  0.25, 0.20, 0.22, 0.11, 0.10, 0.0);
  let hill =   new Array(0.0, 0.11, 0.22, 0.33, 0.44, 0.55, 0.6,  0.7,  0.6,  0.50, 0.33, 0.22, 0.11, 0.10, 0.0);
  let heightMap = new Array(water,
                            edge,
                            ground,
                            raised,
                            hill,
                            hill,
                            hill,
                            hill,
                            hill,
                            raised,
                            ground,
                            ground,
                            edge,
                            water);
  let builder = new WT.TerrainBuilder(cellsX, cellsY, terraces,
                                      waterMultiplier, waterLevel,
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
