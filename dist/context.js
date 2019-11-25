import { CoordSystem, CartisanRenderer, IsometricRenderer } from "./graphics.js";
import { MouseController } from "./controller.js";
export class Context {
    constructor(_worldMap, sys, canvas) {
        this._worldMap = _worldMap;
        this._controller = new MouseController(canvas);
        this._entities = new Array();
        let terrain = _worldMap.allTerrain;
        Array.from(terrain.values()).forEach(value => this._entities.push(value));
        this._gfx = sys == CoordSystem.Cartisan ?
            new CartisanRenderer(canvas) :
            new IsometricRenderer(canvas);
    }
    get map() {
        return this._worldMap;
    }
    getTerrain(x, y) {
        return this._worldMap.getTerrain(x, y, 0);
    }
    update() {
        this._gfx.update(this._entities, this._worldMap, this._controller.camera);
        this._gfx.render();
    }
    run() {
        let context = this;
        var update = function update() {
            if (document.hasFocus()) {
                context.update();
            }
        };
        window.requestAnimationFrame(update);
    }
}
