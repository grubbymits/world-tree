import { Entity,
         EventableEntity,
         MovableEntity,
         Actor } from "./entity.js"
import { EntityEvent } from "./events.js"
import { SceneGraph,
         Perspective,
         IsometricRenderer,
         TwoByOneIsometricRenderer } from "./scene.js"
import { Camera } from "./camera.js"
import { Octree } from "./tree.js"
import { Dimensions,
         BoundingCuboid,
         CollisionDetector,
         Gravity } from "./physics.js"

export interface Context {
  update(camera: Camera): void;
  addController(controller: Controller): void;
}

export interface Controller {
  update(): void;
}

/** @internal */
export class ContextImpl implements Context {
  private _scene: SceneGraph;
  private _entities: Array<Entity> = new Array<Entity>();
  private _eventables: Array<EventableEntity> = new Array<EventableEntity>();
  private _movables: Array<MovableEntity> = new Array<MovableEntity>();
  private _controllers: Array<Controller> = new Array<Controller>();
  private _octree: Octree;

  constructor(canvas: HTMLCanvasElement, worldDims: Dimensions,
              perspective: Perspective) {
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

  get scene(): SceneGraph { return this._scene; }
  get bounds(): BoundingCuboid { return this._octree.bounds; }
  get spatial(): Octree { return this._octree; }
  get controllers(): Array<Controller> { return this._controllers; }

  verify(): void {
    console.log("context contains num entities:", this._entities.length);
    this._octree.verify(this._entities);
  }

  addController(controller: Controller): void {
    this._controllers.push(controller);
  }

  addEntity(entity: Entity): void {
    this._entities.push(entity);
    this._octree.insert(entity);
    this._scene.insertEntity(entity);
  }

  addEventableEntity(entity: EventableEntity): void {
    this._eventables.push(entity);
  }

  addMovableEntity(entity: MovableEntity): void {
    this._movables.push(entity);
    let spatialGraph = this._octree;
    let scene = this._scene;
    entity.addEventListener(EntityEvent.Moving, function() {
      spatialGraph.update(entity);
      scene.updateEntity(entity);
    });
  }

  update(camera: Camera): void {
    camera.update();
    this._scene.render(camera);

    Gravity.update(this._movables);

    this._eventables.forEach(entity => {
      entity.update();
    });

    this._controllers.forEach(controller => {
      controller.update()
    });
  }
}

export function createContext(canvas: HTMLCanvasElement,
                              worldDims: Dimensions,
                              perspective: Perspective): Context {
  return new ContextImpl(canvas, worldDims, perspective);
}
