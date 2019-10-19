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
                         GM.CoordSystem.Isometric, canvas, sprites, 0);

  let raised = [];
  let graphic = new GM.StaticGraphicsComponent(0);
  raised.push(game.addTerrain(0, 4, 1, graphic));
  raised.push(game.addTerrain(1, 4, 1, graphic));
  raised.push(game.addTerrain(2, 4, 1, graphic));
  raised.push(game.addTerrain(2, 3, 1, graphic));
  raised.push(game.addTerrain(0, 5, 1, graphic));

  raised.push(game.addTerrain(2, 2, 1, graphic));
  raised.push(game.addTerrain(2, 2, 2, graphic));
  raised.push(game.addTerrain(2, 2, 3, graphic));

  // Offset the grid so its displayed roughly in the middle of the canvas.
  let camera = new GM.Point(tileWidth, Math.floor(canvas.height / 2));
  game.update(camera);
  console.log("done");
}
