import { CoordSystem, CartisanRenderer, IsometricRenderer } from "./graphics.js";
import { MouseController } from "./controller.js";
export class Game {
    constructor(_gameMap, sys, canvas, sprites) {
        this._gameMap = _gameMap;
        this._controller = new MouseController(canvas);
        this._gameObjects = new Array();
        this._gfx = sys == CoordSystem.Cartisan ?
            new CartisanRenderer(canvas, sprites) :
            new IsometricRenderer(canvas, sprites);
    }
    get map() {
        return this._gameMap;
    }
    getTerrain(x, y) {
        return this._gameMap.getTerrain(x, y, 0);
    }
    update() {
        this._gfx.update(this._gameObjects, this._gameMap, this._controller.camera);
        this._gfx.render();
    }
    run() {
        let game = this;
        var update = function update() {
            if (document.hasFocus()) {
                game.update();
            }
        };
        window.requestAnimationFrame(update);
    }
}
