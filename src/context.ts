import { PhysicalEntity,
         MovableEntity } from "./entity.ts"
import { Terrain } from "./terrain.ts"
import { EntityEvent } from "./events.ts"
import { SceneGraph,
         SceneRenderer,
         OnscreenSceneRenderer,
         OffscreenSceneRenderer,
         Perspective,
         TrueIsometric,
         TwoByOneIsometric } from "./scene.ts"
import { SpriteSheet } from "./graphics.ts"
import { Camera } from "./camera.ts"
import { Octree } from "./tree.ts"
import { Dimensions,
         BoundingCuboid,
         CollisionDetector,
         Gravity } from "./physics.ts"

export interface Context {
  update(camera: Camera): void;
  addController(controller: Controller): void;
  verify(): boolean;
}

export interface Controller {
  update(): void;
}


/** @internal */
export class ContextImpl implements Context {
  private _scene: SceneRenderer;
  private _entities: Array<PhysicalEntity> = new Array<PhysicalEntity>();
  private _updateables: Array<PhysicalEntity> = new Array<PhysicalEntity>();
  private _movables: Array<MovableEntity> = new Array<MovableEntity>();
  private _controllers: Array<Controller> = new Array<Controller>();
  private _octree: Octree;
  private _totalEntities: number = 0;

  static reset(): void {
    PhysicalEntity.reset();
    Terrain.reset();
    SpriteSheet.reset();
  }

  constructor(worldDims: Dimensions) {
    this._octree = new Octree(worldDims);
    CollisionDetector.init(this._octree);
  }

  get scene(): SceneRenderer { return this._scene; }
  get entities(): Array<PhysicalEntity> { return this._entities; }
  get bounds(): BoundingCuboid { return this._octree.bounds; }
  get spatial(): Octree { return this._octree; }
  get controllers(): Array<Controller> { return this._controllers; }

  verify(): boolean {
    return this.entities.length == PhysicalEntity.getNumEntities() &&
           this.entities.length == this._totalEntities &&
           this._octree.verify(this.entities) &&
           this.scene.verifyRenderer(this.entities);
  }

  addOnscreenRenderer(canvas: HTMLCanvasElement, 
                      perspective: Perspective): void {
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
    this._movables.forEach(entity => 
      entity.addEventListener(EntityEvent.Moving, function() {
        spatialGraph.update(entity);
        scene.updateEntity(entity);
    }));
  }

  addOffscreenRenderer(perspective: Perspective): void {
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
    this._movables.forEach(entity => 
      entity.addEventListener(EntityEvent.Moving, function() {
        spatialGraph.update(entity);
        scene.updateEntity(entity);
    }));
  }

  addController(controller: Controller): void {
    this._controllers.push(controller);
  }

  addEntity(entity: PhysicalEntity): void {
    if (this._entities.length == 0) {
      if (entity.id != 0) {
        console.error("Adding entity with unexpected id:", entity.id);
      }
    } else if (this._entities.length > 0) {
      if (entity.id != this._entities[this._entities.length - 1].id + 1) {
        console.error("Adding entity with unexpected id:", entity.id);
      }
    }
    this._entities.push(entity);
    this._octree.insert(entity);
    this._scene.insertEntity(entity);
    this._totalEntities++;
  }

  addUpdateableEntity(entity: PhysicalEntity): void {
    this._updateables.push(entity);
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
    this._scene.render(camera, false);

    Gravity.update(this._movables);

    this._updateables.forEach(entity => {
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
  let context = new ContextImpl(worldDims);
  context.addOnscreenRenderer(canvas, perspective);
  return context;
}

export function createTestContext(worldDims: Dimensions,
                                  perspective: Perspective): Context {
  ContextImpl.reset();
  let context = new ContextImpl(worldDims);
  context.addOffscreenRenderer(perspective);
  return context;
}
