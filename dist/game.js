import { CoordSystem, SquareGrid } from "./map.js";
import { CartisanRenderer, IsometricRenderer } from "./gfx.js";
export class Game {
    constructor(_cellsX, _cellsY, _tileWidth, _tileHeight, sys, _canvas, _sprites) {
        this._drawables = new Array();
        this._gameMap = new SquareGrid(_cellsX, _cellsY);
        let context = _canvas.getContext("2d", { alpha: false });
        this._gfx = sys == CoordSystem.Cartisan ?
            new CartisanRenderer(context, _canvas.width, _canvas.height, _tileWidth, _tileHeight, _sprites) :
            new IsometricRenderer(context, _canvas.width, _canvas.height, _tileWidth, _tileHeight, _sprites);
        this._gfx.clear();
    }
    get map() {
        return this._gameMap;
    }
    getLocation(x, y) {
        return this._gameMap.getLocation(x, y);
    }
    addLocation(x, y, z) {
        let location = this._gameMap.addRaisedLocation(x, y, z);
        this._drawables.push(location);
        return location;
    }
    update(camera) {
        this._gfx.drawFloor(camera, this._gameMap);
        this._gfx.drawAll(this._drawables, camera);
    }
}
