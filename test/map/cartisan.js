import * as GM from '../../dist/greenman.js';

console.log("begin");

let sheet = new GM.SpriteSheet("../res/img/cartisan-grass-floor");

sheet.image.onload = function() {
  let cellsX = 6;
  let cellsY = 6;
  let tileWidth = 64;
  let tileHeight = 64;
  let sprites = [];

  // The sprite sheet is 3x3...
  for (let y = 0; y < 3; y++) {
    for (let x = 0; x < 3; x++) {
      sprites.push(new GM.Sprite(sheet, x * tileWidth, y * tileHeight,
                                 tileWidth, tileHeight));
    }
  }

  let canvas = document.getElementById("testCanvas");
  let game = new GM.Game(cellsX, cellsY, tileWidth, tileHeight,
                         GM.CoordSystem.Cartisan, canvas, sprites);

  for (let y = 0; y < cellsY; y++) {
    for (let x = 0; x < cellsX; x++) {
      let location = game.getLocation(x, y);
      location.spriteId = 4; // middle tile
    }
  }

  let camera = new GM.Point(2 * tileWidth, 2 * tileHeight);
  game.update(camera);
  console.log("done");
}
