import { IsometricRenderer } from "./graphics.js";
import { MouseCamera } from "./camera.js";
import { MouseController } from "./controller.js";
import { Octree } from "./tree.js";
export class Context {
    constructor(_worldMap, canvas) {
        this._worldMap = _worldMap;
        this._entities = new Array();
        let terrain = _worldMap.allTerrain;
        Array.from(terrain.values()).forEach(value => this._entities.push(value));
        this._camera = new MouseCamera(canvas, 0, 0, canvas.width, canvas.height);
        this._gfx = new IsometricRenderer(canvas, this._camera, this._entities);
        this._controller = new MouseController(canvas, this._gfx);
        this._octree = new Octree(this._entities);
        this._octree.verify(this._entities);
    }
    update() {
        this._controller.update();
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
