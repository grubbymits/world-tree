import { EntityEvent } from "./events.js";
import { Perspective, IsometricRenderer, TwoByOneIsometricRenderer } from "./scene.js";
import { Octree } from "./tree.js";
import { CollisionDetector, Gravity } from "./physics.js";
export class ContextImpl {
    constructor(canvas, worldDims, perspective) {
        this._entities = new Array();
        this._eventables = new Array();
        this._movables = new Array();
        this._controllers = new Array();
        switch (perspective) {
            default:
                console.error("unhandled perspective");
                break;
            case Perspective.TrueIsometric:
                console.log("true isometric");
                this._scene = new IsometricRenderer(canvas);
                break;
            case Perspective.TwoByOneIsometric:
                console.log("2:1 isometric");
                this._scene = new TwoByOneIsometricRenderer(canvas);
                break;
        }
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
    addController(controller) {
        this._controllers.push(controller);
    }
    addEntity(entity) {
        this._entities.push(entity);
        this._octree.insert(entity);
        this._scene.insertEntity(entity);
    }
    addEventableEntity(entity) {
        this._eventables.push(entity);
    }
    addMovableEntity(entity) {
        this._movables.push(entity);
        let spatialGraph = this._octree;
        let scene = this._scene;
        entity.addEventListener(EntityEvent.Moving, function () {
            spatialGraph.update(entity);
            scene.updateEntity(entity);
        });
    }
    update(camera) {
        camera.update();
        this._scene.render(camera);
        Gravity.update(this._movables);
        this._eventables.forEach(entity => {
            entity.update();
        });
        this._controllers.forEach(controller => {
            controller.update();
        });
    }
}
export function createContext(canvas, worldDims, perspective) {
    return new ContextImpl(canvas, worldDims, perspective);
}
