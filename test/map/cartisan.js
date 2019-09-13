import { Point, CoordSystem, Location, SquareGrid } from '../../js/map.js';
import { SpriteSheet, Sprite, Renderer } from '../../js/gfx.js';

console.log("begin");

let sheet = new SpriteSheet("cartisan-grass-floor");

sheet.image.onload = function() {
  let cellsX = 6;
  let cellsY = 6;
  let gameMap = new SquareGrid(cellsX, cellsY);
  let sprites = [];
  let tileWidth = 64;
  let tileHeight = 64;

  // The sprite sheet is 3x3...
  for (let y = 0; y < 3; y++) {
    for (let x = 0; x < 3; x++) {
      sprites.push(new Sprite(sheet, x * tileWidth, y * tileHeight,
                              tileWidth, tileHeight));
    }
  }

  let canvas = document.getElementById("testCanvas");
  let context = canvas.getContext("2d", { alpha: false });
  let gfx = new Renderer(context, canvas.width, canvas.height, sprites);
  gfx.clear();

  let camera = new Point(2 * tileWidth, 2 * tileHeight);

  for (let y = 0; y < cellsY; y++) {
    for (let x = 0; x < cellsX; x++) {
      let location = gameMap.getLocation(x, y);
      location.spriteId = 4; // middle tile
      let coord = gameMap.getDrawCoord(x, y, tileWidth, tileHeight,
                                       CoordSystem.Cartisan);
      let newCoord = new Point(coord.x + camera.x, coord.y + camera.y);
      console.log("draw at:", newCoord);
      gfx.render(newCoord, location.spriteId);
    }
  }
  console.log("done");
}
