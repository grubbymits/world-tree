import * as GM from '../../dist/greenman.js';

console.log("begin");

let sheet = new GM.SpriteSheet("../res/img/block");

sheet.image.onload = function() {
  let cellsX = 6;
  let cellsY = 6;
  let tileWidth = 128;
  let tileHeight = 64;
  let gameMap = new GM.IsometricGrid(cellsX, cellsY, tileWidth, tileHeight);
  let sprites = [];
  sprites.push(new GM.Sprite(sheet, 0, 0, 128, 128));

  let canvas = document.getElementById("testCanvas");
  let context = canvas.getContext("2d", { alpha: false });
  let gfx = new GM.Renderer(context, canvas.width, canvas.height, sprites);
  gfx.clear();


  for (let y = 0; y < cellsY; y++) {
    for (let x = 0; x < cellsX; x++) {
      let location = gameMap.getLocation(x, y);
      location.spriteId = 0;
    }
  }

  let raised = [];
  raised.push(gameMap.addRaisedLocation(3, 1, 0));
  raised.push(gameMap.addRaisedLocation(2, 1, 0));
  raised.push(gameMap.addRaisedLocation(2, 2, 0));
  raised.push(gameMap.addRaisedLocation(2, 3, 0));
  raised.push(gameMap.addRaisedLocation(3, 3, 0));
  raised[0].spriteId = 0;
  raised[1].spriteId = 0;
  raised[2].spriteId = 0;
  raised[3].spriteId = 0;
  raised[4].spriteId = 0;

  // Offset the grid so its displayed roughly in the middle of the canvas.
  let camera = new GM.Point(tileWidth, Math.floor(canvas.height / 2));
  gameMap.renderFloor(camera, gfx);
  gameMap.renderRaised(camera, gfx);
  console.log("done");
}
