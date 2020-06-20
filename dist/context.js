import { EntityEvent } from "./events.js";
import { IsometricRenderer } from "./graphics.js";
import { Octree } from "./tree.js";
export class Context {
    constructor(canvas, worldDims) {
        this._entities = new Array();
        this._controllers = new Array();
        this._scene = new IsometricRenderer(canvas);
        this._octree = new Octree(worldDims);
    }
    get scene() { return this._scene; }
    get bounds() { return this._octree.bounds; }
    get spatial() { return this._octree; }
    set map(map) {
        this._worldMap = map;
    }
    verify() {
        console.log("context contains num entities:", this._entities.length);
        this._octree.verify(this._entities);
    }
    addController(controller) {
        this._controllers.push(controller);
    }
    addEntity(entity) {
        this._entities.push(entity);
        this._octree.insert(entity);
        this._scene.insertEntity(entity);
    }
    addActor(actor) {
        let spatialGraph = this._octree;
        let scene = this._scene;
        actor.addEventListener(EntityEvent.Move, function () {
            spatialGraph.update(actor);
            scene.setDrawCoord(actor);
        });
    }
    update(camera) {
        for (let controller of this._controllers) {
            camera.update();
            controller.update();
        }
        this._scene.render(camera);
    }
}
