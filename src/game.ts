import { Location, GameObject } from "./entity.js"
import { Terrain, TerrainShape, TerrainType } from "./terrain.js"
import { Point, SquareGrid } from "./map.js"
import { CoordSystem, Sprite,
         Renderer, CartisanRenderer, IsometricRenderer } from "./graphics.js"
import { MouseController } from "./controller.js"

export class Game {
  private _gfx: Renderer;
  private _gameObjects : Array<GameObject>;
  private _controller: MouseController;

  constructor(private _gameMap: SquareGrid,
              sys: CoordSystem,
              canvas: HTMLCanvasElement,
              sprites: Array<Sprite>) {

    this._controller = new MouseController(canvas);
    this._gameObjects = new Array<GameObject>();
    this._gfx = sys == CoordSystem.Cartisan ?
      new CartisanRenderer(canvas, sprites) :
      new IsometricRenderer(canvas, sprites);
  }

  get map(): SquareGrid {
    return this._gameMap;
  }

  getTerrain(x: number, y: number): Terrain | null {
    return this._gameMap.getTerrain(x, y, 0);
  }

  update(): void {
    this._gfx.update(this._gameObjects, this._gameMap, this._controller.camera);
    this._gfx.render();
  }

  run(): void {
    let game = this;
    var update = function update() {
      if (document.hasFocus()) {
        game.update();
      }
    }
    window.requestAnimationFrame(update);
  }
}
