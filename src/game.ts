import { CoordSystem, Point, Location, SquareGrid } from "./map.js"
import { Drawable, Sprite,
         Renderer, CartisanRenderer, IsometricRenderer } from "./gfx.js"

export class Game {
  private _gameMap: SquareGrid;
  private _gfx: Renderer;
  private _drawables: Array<Drawable>;

  constructor(_cellsX: number,
              _cellsY: number,
              _tileWidth: number,
              _tileHeight: number,
              sys: CoordSystem,
              _canvas: HTMLCanvasElement,
              _sprites: Array<Sprite>) {

    this._drawables = new Array<Drawable>();
    this._gameMap = new SquareGrid(_cellsX, _cellsY);

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

  addLocation(x: number, y: number, z: number): Location {
    let location = this._gameMap.addRaisedLocation(x, y, z);
    this._drawables.push(location);
    return location;
  }

  update(camera: Point): void {
    this._gfx.drawFloor(camera, this._gameMap);
    this._gfx.drawAll(this._drawables, camera);
  }
}
