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
    addEntity(entity) {
        this._entities.push(entity);
    }
    update() {
        this._gfx.render(this._entities, this._controller.camera);
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
