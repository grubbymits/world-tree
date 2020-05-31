import { IsometricRenderer } from "./graphics.js";
import { MouseController } from "./controller.js";
export class Context {
    constructor(_worldMap, canvas) {
        this._worldMap = _worldMap;
        this._controller = new MouseController(canvas);
        this._entities = new Array();
        let terrain = _worldMap.allTerrain;
        Array.from(terrain.values()).forEach(value => this._entities.push(value));
        this._gfx = new IsometricRenderer(canvas, this._entities);
    }
    update() {
        this._gfx.render(this._controller.camera);
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
