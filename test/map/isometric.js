import * as GM from '../../dist/greenman.js';

console.log("begin");

let sheet = new GM.SpriteSheet("../res/img/block");

sheet.image.onload = function() {
  let cellsX = 7;
  let cellsY = 7;
  let tileWidth = 128;
  let tileHeight = 64;
  let sprites = [];

  sprites.push(new GM.Sprite(sheet, 0, 0, 128, 128));
  let canvas = document.getElementById("testCanvas");
  let game = new GM.Game(cellsX, cellsY, tileWidth, tileHeight,
                         GM.CoordSystem.Isometric, canvas, sprites);

  for (let y = 0; y < cellsY; y++) {
    for (let x = cellsX - 1; x >= 0; x--) {
      let location = game.getLocation(x, y);
      location.spriteId = 0;
    }
  }
  // Offset the grid so its displayed roughly in the middle of the canvas.
  let camera = new GM.Point(0, Math.floor(canvas.height / 2));
  game.update(camera);
  console.log("done");
}
