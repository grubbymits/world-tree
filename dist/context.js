import { EntityEvent } from "./entity.js";
import { IsometricRenderer } from "./graphics.js";
import { MouseCamera } from "./camera.js";
import { Octree } from "./tree.js";
export class Context {
    constructor(canvas) {
        this._entities = new Array();
        this._controllers = new Array();
        this._camera = new MouseCamera(canvas, 0, 0, canvas.width, canvas.height);
        this._gfx = new IsometricRenderer(canvas, this._camera);
        this._octree = new Octree();
    }
    get gfx() { return this._gfx; }
    get bounds() { return this._octree.bounds; }
    get spatial() { return this._octree; }
    set map(map) {
        this._worldMap = map;
    }
    verify() {
        console.log("context contains num entities:", this._entities.length);
        this._gfx.dump();
        this._octree.verify(this._entities);
    }
    addController(controller) {
        this._controllers.push(controller);
    }
    addEntity(entity) {
        this._entities.push(entity);
        this._octree.insert(entity);
        this._gfx.insertEntity(entity);
    }
    addActor(actor) {
        let spatialGraph = this._octree;
        actor.addEventListener(EntityEvent.Move, function () {
            spatialGraph.update(actor);
        });
    }
    update() {
        for (let controller of this._controllers) {
            controller.update();
        }
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
