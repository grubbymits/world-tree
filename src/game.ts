import { Location, GameObject } from "./entity.js"
import { Point, SquareGrid } from "./map.js"
import { CoordSystem, Sprite,
         GraphicsComponent, StaticGraphicsComponent,
         Renderer, CartisanRenderer, IsometricRenderer } from "./gfx.js"

export class Game {
  private _gameMap: SquareGrid;
  private _gfx: Renderer;
  private _gameObjects : Array<GameObject>;

  constructor(_cellsX: number,
              _cellsY: number,
              _tileWidth: number,
              _tileHeight: number,
              sys: CoordSystem,
              _canvas: HTMLCanvasElement,
              _sprites: Array<Sprite>) {

    this._gameObjects = new Array<GameObject>();
    let _tileDepth = _tileHeight; // FIXME
    let floorGraphics = new StaticGraphicsComponent(0);
    this._gameMap = new SquareGrid(_cellsX, _cellsY, _tileWidth,
                                   _tileDepth, _tileHeight, floorGraphics);

    let context = _canvas.getContext("2d", { alpha: false })!;
    this._gfx = sys == CoordSystem.Cartisan ?
      new CartisanRenderer(context, _canvas.width, _canvas.height,
                           _tileWidth, _tileHeight, _sprites) :
      new IsometricRenderer(context, _canvas.width, _canvas.height,
                            _tileWidth, _tileHeight, _sprites);
    this._gfx.clear();
  }

  get map(): SquareGrid {
    return this._gameMap;
  }

  getLocation(x: number, y: number): Location {
    return this._gameMap.getLocation(x, y);
  }

  addTerrain(x: number, y: number, z: number,
             component: GraphicsComponent): GameObject {
    let terrain = this._gameMap.addRaisedTerrain(x, y, z, component);
    this._gameObjects.push(terrain);
    return terrain;
  }

  update(camera: Point): void {
    this._gfx.drawFloor(camera, this._gameMap);
    this._gfx.drawAll(this._gameObjects, camera);
  }
}
