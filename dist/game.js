import { CoordSystem, CartisanGrid, IsometricGrid } from "./map.js";
import { Renderer } from "./gfx.js";
export class Game {
    constructor(_cellsX, _cellsY, _tileWidth, _tileHeight, sys, _canvas, _sprites) {
        this._drawables = new Array();
        this._gameMap = sys == CoordSystem.Isometric ?
            new IsometricGrid(_cellsX, _cellsY, _tileWidth, _tileHeight) :
            new CartisanGrid(_cellsX, _cellsY, _tileWidth, _tileHeight);
        let context = _canvas.getContext("2d", { alpha: false });
        this._gfx = new Renderer(context, _canvas.width, _canvas.height, _sprites);
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
        this._gameMap.drawFloor(camera, this._gfx);
        this._gameMap.sortDrawables(this._drawables);
        this._gfx.drawAll(this._drawables, camera);
    }
}
