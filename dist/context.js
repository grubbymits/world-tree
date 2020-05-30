import { IsometricRenderer } from "./graphics.js";
import { MouseController } from "./controller.js";
export class Context {
    constructor(_worldMap, canvas) {
        this._worldMap = _worldMap;
        this._controller = new MouseController(canvas);
        this._entities = new Array();
        let terrain = _worldMap.allTerrain;
        Array.from(terrain.values()).forEach(value => this._entities.push(value));
        let root = _worldMap.getTerrain(_worldMap.width - 1, 0, 0);
        this._gfx = new IsometricRenderer(canvas, root, this._entities);
    }
    addEntity(entity) {
        this._entities.push(entity);
        this._gfx.insertEntity(entity);
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
