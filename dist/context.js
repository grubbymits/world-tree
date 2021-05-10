import { EntityEvent } from "./events.js";
import { SceneRenderer, Perspective, TrueIsometric, TwoByOneIsometric } from "./scene.js";
import { Octree } from "./tree.js";
import { CollisionDetector } from "./physics.js";
export class Context {
    constructor(worldDims) {
        this._entities = new Array();
        this._controllers = new Array();
        this._octree = new Octree(worldDims);
        CollisionDetector.init(this._octree);
    }
    get scene() { return this._scene; }
    get bounds() { return this._octree.bounds; }
    get spatial() { return this._octree; }
    get map() { return this._worldMap; }
    set map(map) {
        this._worldMap = map;
    }
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
