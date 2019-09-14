import { CoordSystem, Point, Location,
         SquareGrid, CartisanGrid, IsometricGrid } from "./map.js"
import { Drawable, Sprite, Renderer } from "./gfx.js"

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
    this._gameMap = sys == CoordSystem.Isometric ?
      new IsometricGrid(_cellsX, _cellsY, _tileWidth, _tileHeight) :
      new CartisanGrid(_cellsX, _cellsY, _tileWidth, _tileHeight);

    let context = _canvas.getContext("2d", { alpha: false })!;
    this._gfx = new Renderer(context, _canvas.width, _canvas.height, _sprites);
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
    this._gameMap.drawFloor(camera, this._gfx);
    this._gameMap.sortDrawables(this._drawables);
    this._gfx.drawAll(this._drawables, camera);
  }
}
