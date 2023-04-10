import { MovableEntity, PhysicalEntity } from "./entity.ts";
import { Terrain } from "./terrain.ts";
import { EntityEvent } from "./events.ts";
import {
  Perspective,
  Scene,
  TrueIsometric,
  TwoByOneIsometric,
} from "./scene.ts";
import { Renderer,
         OffscreenRenderer,
         OnscreenRenderer,
} from "./render.ts";
import { SpriteSheet } from "./graphics.ts";
import { Camera } from "./camera.ts";
import { Octree } from "./tree.ts";
import {
  BoundingCuboid,
  CollisionDetector,
  Dimensions,
  Gravity,
} from "./physics.ts";

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
  private _scene: Scene;
  private _renderer: Renderer;
  private _entities: Array<PhysicalEntity> = new Array<PhysicalEntity>();
  private _updateables: Array<PhysicalEntity> = new Array<PhysicalEntity>();
  private _movables: Array<MovableEntity> = new Array<MovableEntity>();
  private _controllers: Array<Controller> = new Array<Controller>();
  private _spatialGraph: Octree;
  private _totalEntities = 0;

  static reset(): void {
    PhysicalEntity.reset();
    Terrain.reset();
    SpriteSheet.reset();
  }

  constructor(worldDims: Dimensions,
              perspective: Perspective) {
    this._spatialGraph = new Octree(worldDims);
    CollisionDetector.init(this._spatialGraph);
    switch (perspective) {
      default:
        console.error("unhandled perspective");
        break;
      case Perspective.TrueIsometric:
        this._scene = new Scene(new TrueIsometric());
        break;
      case Perspective.TwoByOneIsometric:
        this._scene = new Scene(new TwoByOneIsometric());
        break;
    }
    this._renderer = new OffscreenRenderer(1, 1);
  }

  get scene(): Scene {
    return this._scene;
  }
  get renderer(): Renderer {
    return this._renderer;
  }
  get entities(): Array<PhysicalEntity> {
    return this._entities;
  }
  get bounds(): BoundingCuboid {
    return this._spatialGraph.bounds;
  }
  get spatial(): Octree {
    return this._spatialGraph;
  }
  get controllers(): Array<Controller> {
    return this._controllers;
  }

  verify(): boolean {
    return this.entities.length == PhysicalEntity.getNumEntities() &&
      this.entities.length == this._totalEntities &&
      this.spatial.verify(this.entities) &&
      this.scene.verifyRenderer(this.entities);
  }

  addOnscreenRenderer(
    canvas: HTMLCanvasElement,
  ): void {
    this._renderer = new OnscreenRenderer(canvas);
  }

  addController(controller: Controller): void {
    this._controllers.push(controller);
  }

  addEntity(entity: PhysicalEntity): void {
    if (this.entities.length == 0) {
      if (entity.id != 0) {
        console.error("Adding entity with unexpected id:", entity.id);
      }
    } else if (this.entities.length > 0) {
      if (entity.id != this.entities[this.entities.length - 1].id + 1) {
        console.error("Adding entity with unexpected id:", entity.id);
      }
    }
    this.entities.push(entity);
    this.spatial.insert(entity);
    this.scene.insertEntity(entity);
    this._totalEntities++;
  }

  addUpdateableEntity(entity: PhysicalEntity): void {
    this._updateables.push(entity);
  }

  addMovableEntity(entity: MovableEntity): void {
    this._movables.push(entity);
    entity.addEventListener(EntityEvent.Moving, () => {
      this.spatial.update(entity);
      this.scene.updateEntity(entity);
    });
  }

  update(camera: Camera): void {
    camera.update();
    const drawElements = this._scene.render(camera, false);
    this.renderer.draw(drawElements);

    Gravity.update(this._movables);

    this._updateables.forEach((entity) => {
      entity.update();
    });

    this._controllers.forEach((controller) => {
      controller.update();
    });
  }
}

export function createContext(
  canvas: HTMLCanvasElement,
  worldDims: Dimensions,
  perspective: Perspective,
): Context {
  ContextImpl.reset();
  const context = new ContextImpl(worldDims, perspective);
  context.addOnscreenRenderer(canvas);
  return context;
}

export function createTestContext(
  worldDims: Dimensions,
  perspective: Perspective,
): Context {
  ContextImpl.reset();
  const context = new ContextImpl(worldDims, perspective);
  return context;
}
