import { EntityEvent } from "./events.js";
import { OnscreenSceneRenderer, OffscreenSceneRenderer, verifyRenderer, Perspective, TrueIsometric, TwoByOneIsometric } from "./scene.js";
import { Octree } from "./tree.js";
import { CollisionDetector, Gravity } from "./physics.js";
export class ContextImpl {
    constructor(worldDims) {
        this._entities = new Array();
        this._updateables = new Array();
        this._movables = new Array();
        this._controllers = new Array();
        this._octree = new Octree(worldDims);
        CollisionDetector.init(this._octree);
    }
    get scene() { return this._scene; }
    get bounds() { return this._octree.bounds; }
    get spatial() { return this._octree; }
    get controllers() { return this._controllers; }
    verify() {
        return this._octree.verify(this._entities) && verifyRenderer(this.scene);
    }
    addOnscreenRenderer(canvas, perspective) {
        switch (perspective) {
            default:
                console.error("unhandled perspective");
                break;
            case Perspective.TrueIsometric:
                this._scene = new OnscreenSceneRenderer(canvas, new TrueIsometric());
                break;
            case Perspective.TwoByOneIsometric:
                this._scene = new OnscreenSceneRenderer(canvas, new TwoByOneIsometric());
                break;
        }
        this._entities.forEach(entity => this._scene.insertEntity(entity));
        let scene = this._scene;
        let spatialGraph = this._octree;
        this._movables.forEach(entity => entity.addEventListener(EntityEvent.Moving, function () {
            spatialGraph.update(entity);
            scene.updateEntity(entity);
        }));
    }
    addOffscreenRenderer(perspective) {
        switch (perspective) {
            default:
                console.error("unhandled perspective");
                break;
            case Perspective.TrueIsometric:
                this._scene = new OffscreenSceneRenderer(new TrueIsometric());
                break;
            case Perspective.TwoByOneIsometric:
                this._scene = new OffscreenSceneRenderer(new TwoByOneIsometric());
                break;
        }
        this._entities.forEach(entity => this._scene.insertEntity(entity));
        let scene = this._scene;
        let spatialGraph = this._octree;
        this._movables.forEach(entity => entity.addEventListener(EntityEvent.Moving, function () {
            spatialGraph.update(entity);
            scene.updateEntity(entity);
        }));
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
    addUpdateableEntity(entity) {
        this._updateables.push(entity);
    }
    addMovableEntity(entity) {
        this._movables.push(entity);
        let spatialGraph = this._octree;
        let scene = this._scene;
        entity.addEventListener(EntityEvent.Moving, function () {
            spatialGraph.update(entity);
            if (scene)
                scene.updateEntity(entity);
        });
    }
    update(camera) {
        camera.update();
        this._scene.render(camera);
        Gravity.update(this._movables);
        this._updateables.forEach(entity => {
            entity.update();
        });
        this._controllers.forEach(controller => {
            controller.update();
        });
    }
}
export function createContext(canvas, worldDims, perspective) {
    let context = new ContextImpl(worldDims);
    context.addOnscreenRenderer(canvas, perspective);
    return context;
}
export function createTestContext(worldDims, perspective) {
    let context = new ContextImpl(worldDims);
    context.addOffscreenRenderer(perspective);
    return context;
}
