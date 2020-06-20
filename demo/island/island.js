import * as WT from "../../dist/world-tree.js";
import OpenSimplexNoise from "../../libs/open-simplex-noise/index.js";
import { CloudController } from "./cloud.js";

// Create a height map for the island.
const openSimplex = new OpenSimplexNoise(Date.now());
const cellsX = 40;
const cellsY = 40;
const freq = 0.2;
const cx = Math.floor(cellsX / 2);
const cy = Math.floor(cellsY / 2);

var heightMap = new Array();
let maxDistance = Math.max(cellsX, cellsY) / 2;

for (let y = 0; y < cellsY; y++) {
  heightMap[y] = new Array();
  for (let x = 0; x < cellsX; x++) {
    let nx = Math.abs(x - cx);
    let ny = Math.abs(y - cy);
    let height = 1;
    height += 0.40 * openSimplex.noise2D(freq * x, freq * y) +
              0.20 * openSimplex.noise2D(freq * 2 * x, freq * 2 * y) +
              0.10 * openSimplex.noise2D(freq * 4 * x, freq * 4 * y);
    height *= Math.exp(-(0.1 * nx + 0.1 * ny));
    heightMap[y].push(height);
  }
}

window.onload = (event) => {

  const terraces = 4;
  const water = 3;
  const dryLimit = 0.2;
  const treeLimit = 0.7;
  const wetLimit = 1;
  const hasWater = true;

  // width / height ratio => 2 cubes high, 3 wide and 3 deep.
  const spriteWidth = 256;
  const relativeDims = new WT.Dimensions(3, 3, 2);
  const physicalDims = new WT.IsometricPhysicalDimensions(spriteWidth, relativeDims);

  const worldDims = new WT.Dimensions(physicalDims.width * cellsX,
                                       physicalDims.depth * cellsY,
                                       physicalDims.height * terraces);
  let canvas = document.getElementById("testCanvas");
  let context = new WT.Context(canvas, worldDims);

  // Use the height map to construct a terrain.
  let builder = new WT.OpenTerrainBuilder(cellsX, cellsY, heightMap,
                                          terraces, hasWater,
                                          WT.Grass, physicalDims);
  builder.addRain(WT.Direction.North, water);
  builder.setBiomes(wetLimit, dryLimit, treeLimit);
  builder.setShapes();
  builder.setEdges();
  builder.setFeatures();
  context.map = builder.generateMap(context);

  let camera = new WT.MouseCamera(context.scene, canvas,
                                  canvas.width, canvas.height);
  context.addController(new WT.MouseController(context.scene, canvas, camera));
  context.verify();

  let cloudController = new CloudController(context, worldDims);
  cloudController.addClouds(20);
  context.addController(cloudController);

  let musicDims = new WT.Dimensions(Math.floor(worldDims.width / 2),
                                    Math.floor(worldDims.depth / 2),
                                    Math.floor(worldDims.height / 2));
  let musicArea = new WT.BoundingCuboid(context.bounds.centre, musicDims);
  let islandMusic = new WT.ZonalAudioLoop("../../res/audio/purple-planet/pretty-things.mp3",
                                          musicArea, context.scene, camera);


  console.log("done");
  var update = function update() {
    if (document.hasFocus()) {
      context.update(camera);
    }
    window.requestAnimationFrame(update);
  }
  window.requestAnimationFrame(update);
}
