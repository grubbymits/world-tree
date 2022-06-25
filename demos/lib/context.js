import { PhysicalEntity } from "./entity.js";
import { Terrain } from "./terrain.js";
import { EntityEvent } from "./events.js";
import { OnscreenSceneRenderer, OffscreenSceneRenderer, verifyRenderer, Perspective, TrueIsometric, TwoByOneIsometric } from "./scene.js";
import { SpriteSheet } from "./graphics.js";
import { Octree } from "./tree.js";
import { CollisionDetector, Gravity } from "./physics.js";
export class ContextImpl {
    constructor(worldDims) {
        this._entities = new Array();
        this._updateables = new Array();
        this._movables = new Array();
        this._controllers = new Array();
        this._totalEntities = 0;
        this._octree = new Octree(worldDims);
        CollisionDetector.init(this._octree);
    }
    static reset() {
        PhysicalEntity.reset();
        Terrain.reset();
        SpriteSheet.reset();
    }
    get scene() { return this._scene; }
    get entities() { return this._entities; }
    get bounds() { return this._octree.bounds; }
    get spatial() { return this._octree; }
    get controllers() { return this._controllers; }
    verify() {
        return this.entities.length == PhysicalEntity.getNumEntities() &&
            this.entities.length == this._totalEntities &&
            this._octree.verify(this.entities) &&
            verifyRenderer(this.scene, this.entities);
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
        if (this._entities.length == 0) {
            if (entity.id != 0) {
                console.error("Adding entity with unexpected id:", entity.id);
            }
        }
        else if (this._entities.length > 0) {
            if (entity.id != this._entities[this._entities.length - 1].id + 1) {
                console.error("Adding entity with unexpected id:", entity.id);
            }
        }
        this._entities.push(entity);
        this._octree.insert(entity);
        this._scene.insertEntity(entity);
        this._totalEntities++;
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
    ContextImpl.reset();
    let context = new ContextImpl(worldDims);
    context.addOffscreenRenderer(perspective);
    return context;
}
