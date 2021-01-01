import { EntityEvent } from "./events.js";
import { Perspective, IsometricRenderer, TwoByOneIsometricRenderer } from "./scene.js";
import { Octree } from "./tree.js";
export class Context {
    constructor(canvas, worldDims, perspective = Perspective.TrueIsometric) {
        this._entities = new Array();
        this._controllers = new Array();
        switch (perspective) {
            default:
                console.error("unhandled perspective");
                break;
            case Perspective.TrueIsometric:
                this._scene = new IsometricRenderer(canvas);
                break;
            case Perspective.TwoByOneIsometric:
                this._scene = new TwoByOneIsometricRenderer(canvas);
                break;
        }
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
        actor.addEventListener(EntityEvent.Moving, function () {
            spatialGraph.update(actor);
            scene.updateEntity(actor);
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
