import * as WT from "../../dist/world-tree.js";
import OpenSimplexNoise from "../../libs/open-simplex-noise/index.js";

const spriteWidth = 261;
const spriteHeight = 251;

function createGraphic(path) {
  let sheet = new WT.SpriteSheet(path);
  let sprite = new WT.Sprite(sheet, 0, 0, spriteWidth, spriteHeight);
  return new Array(new WT.StaticGraphicComponent(sprite.id));
}

function createGraphics(paths) {
  let graphics = new Array();
  for (let i in paths) {
    let path = paths[i];
    let sheet = new WT.SpriteSheet(path);
    let sprite = new WT.Sprite(sheet, 0, 0, spriteWidth, spriteHeight);
    graphics.push(new WT.StaticGraphicComponent(sprite.id));
  }
  return graphics;
}

window.onload = (event) => {
  console.log("loaded");
  let cellsX = 20;
  let cellsY = 20;
  let terraces = 3;
  let waterMultiplier = 0.0;
  let freq = 0.1;
  const openSimplex = new OpenSimplexNoise(Date.now());
  let heightMap = new Array();

  let cx = cellsX / 2;
  let cy = cellsY / 2;
  let edgeUp = 0.07
  let edgeDown = 0.5
  let falloff = 1.5

  for (let y = 0; y < cellsY; y++) {
    heightMap[y] = new Array();
    for (let x = 0; x < cellsX; x++) {
      let height = openSimplex.noise2D(freq * x, freq * y) +
                   0.50 * openSimplex.noise2D(2 * freq * x, 2 * freq * y) +
                   0.25 * openSimplex.noise2D(4 * freq * x, 4 * freq * y) +
                   0.125 * openSimplex.noise2D(8 * freq * x, 8 * freq * y);

      // bias the heights to make an island in the middle
      let nx = (cx - x) / cx;
      let ny = (cy - y) / cy;
      let distance = 2 * Math.max(Math.abs(nx), Math.abs(ny));
      height += edgeUp - edgeDown * Math.pow(distance, falloff);
      heightMap[y].push(height);
    }
  }

  // width / height ratio
  let heightRatio = 2/3;
  console.log("heightRatio:", heightRatio);
  let builder = new WT.TerrainBuilder(cellsX, cellsY, terraces, waterMultiplier,
                                      spriteWidth, spriteHeight, heightRatio,
                                      WT.CoordSystem.Isometric);
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
};

WT.Terrain.addTerrainGraphics(WT.TerrainType.Water, createGraphic("../../../res/img/water/flat"));
let sprites = new Array("../../../res/img/sand/flat",
                        "../../../res/img/sand/flat-north-edge",
                        "../../../res/img/sand/flat-north-east-edge",
                        "../../../res/img/sand/flat-east-edge",
                        "../../../res/img/sand/south",
                        "../../../res/img/sand/south-edge",
                        "../../../res/img/sand/west",
                        "../../../res/img/sand/west-edge",
                        "../../../res/img/sand/north",
                        "../../../res/img/sand/north-edge",
                        "../../../res/img/sand/east",
                        "../../../res/img/sand/east-edge");
WT.Terrain.addTerrainGraphics(WT.TerrainType.Sand, createGraphics(sprites));
sprites = new Array("../../../res/img/light-grass-sand/flat",
                    "../../../res/img/light-grass-sand/flat-north-edge",
                    "../../../res/img/light-grass-sand/flat-north-east-edge",
                    "../../../res/img/light-grass-sand/flat-east-edge",
                    "../../../res/img/light-grass-sand/south",
                    "../../../res/img/light-grass-sand/south-edge",
                    "../../../res/img/light-grass-sand/west",
                    "../../../res/img/light-grass-sand/west-edge",
                    "../../../res/img/light-grass-sand/north",
                    "../../../res/img/light-grass-sand/north-edge",
                    "../../../res/img/light-grass-sand/east",
                    "../../../res/img/light-grass-sand/east-edge");
  WT.Terrain.addTerrainGraphics(WT.TerrainType.DryGrass, createGraphics(sprites));
  WT.Terrain.addTerrainGraphics(WT.TerrainType.Mud, createGraphics(sprites));
  WT.Terrain.addTerrainGraphics(WT.TerrainType.Rock, createGraphics(sprites));
  WT.Terrain.addTerrainGraphics(WT.TerrainType.WetGrass, createGraphics(sprites));

