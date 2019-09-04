import { Point, CoordSystem, Location, SquareGrid } from '../../js/map.js';
import { SpriteSheet, Sprite, Renderer } from '../../js/gfx.js';

console.log("begin");

let sheet = new SpriteSheet("block");

sheet.image.onload = function() {
  let cellsX = 7;
  let cellsY = 7;
  let gameMap = new SquareGrid(cellsX, cellsY);
  let sprites = [];
  sprites.push(new Sprite(sheet, 0, 0, 128, 128));
  let tileWidth = 128;
  let tileHeight = 64;

  let canvas = document.getElementById("testCanvas");
  let context = canvas.getContext("2d", { alpha: false });
  let gfx = new Renderer(context, canvas.width, canvas.height, sprites);
  gfx.clear();

  // Offset the grid so its displayed roughly in the middle of the canvas.
  let offset = new Point(0, Math.floor(canvas.height / 2));

  for (let y = 0; y < cellsY; y++) {
    for (let x = cellsX - 1; x >= 0; x--) {
      let location = gameMap.getLocation(x, y);
      location.spriteId = 0;
      let coord = gameMap.getDrawCoord(x, y, tileWidth, tileHeight,
                                       CoordSystem.Isometric);
      let newCoord = new Point(coord.x + offset.x, coord.y + offset.y);
      console.log("draw at:", newCoord);
      gfx.render(newCoord, location.spriteId);
    }
  }
  console.log("done");
}
