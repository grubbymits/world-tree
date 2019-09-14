import * as GM from '../../dist/greenman.js';

console.log("begin");

let sheet = new GM.SpriteSheet("../res/img/block");

sheet.image.onload = function() {
  let cellsX = 6;
  let cellsY = 6;
  let tileWidth = 128;
  let tileHeight = 64;
  let sprites = [];
  sprites.push(new GM.Sprite(sheet, 0, 0, 128, 128));
  let canvas = document.getElementById("testCanvas");

  let game = new GM.Game(cellsX, cellsY, tileWidth, tileHeight,
                         GM.CoordSystem.Isometric, canvas, sprites);

  for (let y = 0; y < cellsY; y++) {
    for (let x = 0; x < cellsX; x++) {
      let location = game.getLocation(x, y);
      location.spriteId = 0;
    }
  }

  let raised = [];
  raised.push(game.addLocation(3, 1, 0));
  raised.push(game.addLocation(2, 1, 0));
  raised.push(game.addLocation(2, 2, 0));
  raised.push(game.addLocation(2, 3, 0));
  raised.push(game.addLocation(3, 3, 0));
  raised[0].spriteId = 0;
  raised[1].spriteId = 0;
  raised[2].spriteId = 0;
  raised[3].spriteId = 0;
  raised[4].spriteId = 0;

  // Offset the grid so its displayed roughly in the middle of the canvas.
  let camera = new GM.Point(tileWidth, Math.floor(canvas.height / 2));
  game.update(camera);
  console.log("done");
}
