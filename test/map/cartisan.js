import { Point,
         CoordSystem,
         Location,
         SquareGrid,
         SpriteSheet,
         Sprite,
         Renderer,
         renderRaised,
         renderFloor
} from '../../dist/greenman.js';

console.log("begin");

let sheet = new SpriteSheet("../res/img/cartisan-grass-floor");

sheet.image.onload = function() {
  let cellsX = 6;
  let cellsY = 6;
  let tileWidth = 64;
  let tileHeight = 64;
  let gameMap = new SquareGrid(cellsX, cellsY, tileWidth, tileHeight);
  let sprites = [];

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
    }
  }
  renderFloor(gameMap, camera, CoordSystem.Cartisan, gfx);
  console.log("done");
}
