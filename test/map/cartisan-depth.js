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

  // Setup sprites for each location.
  for (let y = 0; y < cellsY; y++) {
    for (let x = 0; x < cellsX; x++) {
      let location = game.getLocation(x, y);
      location.spriteId = 4; // middle tile
    }
  }

  let raised = [];
  raised.push(game.addLocation(1, 2, 0));
  raised.push(game.addLocation(2, 2, 0));
  raised.push(game.addLocation(3, 2, 0));
  raised[0].spriteId = 6; // left lower edge
  raised[1].spriteId = 7; // middle lower edge
  raised[2].spriteId = 8; // right lower edge

  let camera = new GM.Point(2 * tileWidth, 2 * tileHeight);
  game.update(camera);
  console.log("done");
}
