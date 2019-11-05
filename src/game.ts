import { Location, GameObject } from "./entity.js"
import { Terrain, TerrainType } from "./terrain.js"
import { Point, SquareGrid } from "./map.js"
import { CoordSystem, Sprite,
         GraphicsComponent, StaticGraphicsComponent,
         Renderer, CartisanRenderer, IsometricRenderer } from "./gfx.js"
import { MouseController } from "./controller.js"

export class Game {
  private _gameMap: SquareGrid;
  private _gfx: Renderer;
  private _gameObjects : Array<GameObject>;
  private _controller: MouseController;

  constructor(_cellsX: number,
              _cellsY: number,
              _tileWidth: number,
              _tileHeight: number,
              sys: CoordSystem,
              canvas: HTMLCanvasElement,
              sprites: Array<Sprite>,
              floorSpriteId: number) {

    this._controller = new MouseController(canvas);
    this._gameObjects = new Array<GameObject>();
    let _tileDepth = _tileHeight; // FIXME
    let floorGraphics = new StaticGraphicsComponent(floorSpriteId);
    this._gameMap = new SquareGrid(_cellsX, _cellsY, _tileWidth, _tileDepth,
                                   _tileHeight, floorGraphics);

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

  addFlatTerrain(x: number, y: number, z: number, component: GraphicsComponent): Terrain {
    let terrain = this._gameMap.addRaisedTerrain(x, y, z, TerrainType.Flat, component);
    console.log("created raised", terrain);
    this._gameObjects.push(terrain);
    return terrain;
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
