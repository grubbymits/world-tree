import { PhysicalEntity,
         MovableEntity } from "./entity.js"
import { EntityEvent } from "./events.js"
import { SceneGraph,
         SceneRenderer,
         Perspective,
         TrueIsometric,
         TwoByOneIsometric } from "./scene.js"
import { Camera } from "./camera.js"
import { Controller } from "./controller.js"
import { Octree } from "./tree.js"
import { Dimensions,
         BoundingCuboid,
         CollisionDetector,
         Gravity } from "./physics.js"

export interface Context {
  //readonly scene: SceneGraph;
  //readonly bounds: BoundingCuboid;
  //readonly spatial: Octree;
  //readonly controllers: Array<Controller>;

  update(camera: Camera): void;
  addController(controller: Controller): void;
}

/** @internal */
export class ContextImpl implements Context {
  private _scene: SceneRenderer;
  private _entities: Array<PhysicalEntity> = new Array<PhysicalEntity>();
  private _objects: Array<MovableEntity> = new Array<MovableEntity>();
  private _controllers: Array<Controller> = new Array<Controller>();
  private _octree: Octree;

  constructor(worldDims: Dimensions) {
    this._octree = new Octree(worldDims);
    CollisionDetector.init(this._octree);
  }

  get scene(): SceneRenderer { return this._scene; }
  get bounds(): BoundingCuboid { return this._octree.bounds; }
  get spatial(): Octree { return this._octree; }
  get controllers(): Array<Controller> { return this._controllers; }

  verify(): void {
    console.log("context contains num entities:", this._entities.length);
    this._octree.verify(this._entities);
  }

  addRenderer(canvas: HTMLCanvasElement, 
              perspective: Perspective): void {
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

  addController(controller: Controller): void {
    this._controllers.push(controller);
  }

  addEntity(entity: PhysicalEntity): void {
    this._entities.push(entity);
    this._octree.insert(entity);
    if (this._scene != undefined) {
      this._scene.insertEntity(entity);
    }
  }

  addMovableEntity(entity: MovableEntity): void {
    this._objects.push(entity);
    let spatialGraph = this._octree;
    let scene = this._scene;
    entity.addEventListener(EntityEvent.Moving, function() {
      spatialGraph.update(entity);
      scene.updateEntity(entity);
    });
  }

  update(camera: Camera): void {
    for (let controller of this._controllers) {
      camera.update();
      controller.update();
    }
    Gravity.update(this._objects);
    this._scene.render(camera);
  }
}

export function createContext(canvas: HTMLCanvasElement,
                              worldDims: Dimensions,
                              perspective: Perspective): Context {
  let context = new ContextImpl(worldDims);
  context.addRenderer(canvas, perspective);
  return context;
}
