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
        if (this._controller.secondaryClicked) {
            this._controller.secondaryClicked = false;
            let entity = this._gfx.getDrawnAt(this._controller.secondaryClickedAt, this._controller.camera);
            if (entity != undefined) {
                entity.visible = false;
            }
        }
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
