import { Point,
         CoordSystem,
         Location,
         SquareGrid,
         SpriteSheet,
         Sprite,
         Renderer,
         renderRaised,
         renderFloor
} from '../../js/greenman.js';

console.log("begin");

let sheet = new SpriteSheet("../res/img/block");

sheet.image.onload = function() {
  let cellsX = 7;
  let cellsY = 7;
  let tileWidth = 128;
  let tileHeight = 64;
  let gameMap = new SquareGrid(cellsX, cellsY, tileWidth, tileHeight);
  let sprites = [];
  sprites.push(new Sprite(sheet, 0, 0, 128, 128));

  let canvas = document.getElementById("testCanvas");
  let context = canvas.getContext("2d", { alpha: false });
  let gfx = new Renderer(context, canvas.width, canvas.height, sprites);
  gfx.clear();


  for (let y = 0; y < cellsY; y++) {
    for (let x = cellsX - 1; x >= 0; x--) {
      let location = gameMap.getLocation(x, y);
      location.spriteId = 0;
    }
  }
  // Offset the grid so its displayed roughly in the middle of the canvas.
  let camera = new Point(0, Math.floor(canvas.height / 2));
  renderFloor(gameMap, camera, CoordSystem.Isometric, gfx);
  console.log("done");
}
