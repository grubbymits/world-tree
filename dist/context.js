import { EntityEvent } from "./events.js";
import { SceneRenderer, Perspective, TrueIsometric, TwoByOneIsometric } from "./scene.js";
import { Octree } from "./tree.js";
import { CollisionDetector, Gravity } from "./physics.js";
export class ContextImpl {
    constructor(worldDims) {
        this._entities = new Array();
        this._objects = new Array();
        this._controllers = new Array();
        this._octree = new Octree(worldDims);
        CollisionDetector.init(this._octree);
    }
    get scene() { return this._scene; }
    get bounds() { return this._octree.bounds; }
    get spatial() { return this._octree; }
    get controllers() { return this._controllers; }
    verify() {
        console.log("context contains num entities:", this._entities.length);
        this._octree.verify(this._entities);
    }
    addRenderer(canvas, perspective) {
        switch (perspective) {
            default:
                console.error("unhandled perspective");
                break;
            case Perspective.TrueIsometric:
                this._scene = new SceneRenderer(canvas, new TrueIsometric());
                break;
            case Perspective.TwoByOneIsometric:
                this._scene = new SceneRenderer(canvas, new TwoByOneIsometric());
                break;
        }
    }
    addController(controller) {
        this._controllers.push(controller);
    }
    addEntity(entity) {
        this._entities.push(entity);
        this._octree.insert(entity);
        if (this._scene != undefined) {
            this._scene.insertEntity(entity);
        }
    }
    addMovableEntity(entity) {
        this._objects.push(entity);
        let spatialGraph = this._octree;
        let scene = this._scene;
        entity.addEventListener(EntityEvent.Moving, function () {
            spatialGraph.update(entity);
            scene.updateEntity(entity);
        });
    }
    update(camera) {
        for (let controller of this._controllers) {
            camera.update();
            controller.update();
        }
        Gravity.update(this._objects);
        this._scene.render(camera);
    }
}
export function createContext(canvas, worldDims, perspective) {
    let context = new ContextImpl(worldDims);
    context.addRenderer(canvas, perspective);
    return context;
}
