import * as WT from "../../dist/world-tree.js";
import OpenSimplexNoise from "../../libs/open-simplex-noise/index.js";

// Create a height map for the island.
const openSimplex = new OpenSimplexNoise(Date.now());
const cellsX = 20;
const cellsY = 20;
const freq = 0.2;
const cx = Math.floor(cellsX / 2);
const cy = Math.floor(cellsY / 2);
const defaultHeight = 0.75;
const factor = 0.05;
const ceiling = 1;

var heightMap = new Array();
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

window.onload = (event) => {

  const terraces = 4;
  const water = 3;
  const dryLimit = 0.2;
  const wetLimit = 1;

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
  let builder = new WT.TerrainBuilder(cellsX, cellsY, ceiling, terraces,
                                      water, wetLimit, dryLimit,
                                      physicalDims);
  builder.initialise(heightMap);
  builder.addRain(WT.Direction.North);
  context.map = builder.generateMap(context);

  context.addController(new WT.MouseController(canvas, context.gfx));
  context.verify();
  /*
  let cloudController = new WT.CloudController(context);
  context.addController(cloudController);

  const cloudDims = new WT.Dimensions();
  const z = bounds.maxZ - cloudDims.height;

  for (let i = 0; i < 20; i++) {
    let x;
    let y;
    let randLocation = new WT.Location(x, y, z);
    let cloud = new Cloud(randLocation);
    // dy == -1 == northwards.
    cloud.addAction(new WT.MoveDirection(cloud, 0, -1, 0));
    cloudController.add(cloud);
  }*/

  console.log("done");
  var update = function update() {
    if (document.hasFocus()) {
      context.update();
    }
    window.requestAnimationFrame(update);
  }
  window.requestAnimationFrame(update);
  //context.run();
}
