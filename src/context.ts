import { Entity,
         EventableEntity,
         Actor } from "./entity.js"
import { EntityEvent } from "./events.js"
import { Terrain, TerrainShape, TerrainType } from "./terrain.js"
import { SquareGrid } from "./map.js"
import { SceneGraph,
         Perspective,
         IsometricRenderer,
         TwoByOneIsometricRenderer } from "./scene.js"
import { Camera } from "./camera.js"
import { Controller } from "./controller.js"
import { Octree } from "./tree.js"
import { Dimensions,
         BoundingCuboid } from "./physics.js"

export class Context {
  private _scene: SceneGraph;
  private _entities : Array<Entity> = new Array<Entity>();
  private _controllers: Array<Controller> = new Array<Controller>();
  private _octree : Octree;
  private _worldMap: SquareGrid;

  constructor(canvas: HTMLCanvasElement, worldDims: Dimensions,
              perspective = Perspective.TrueIsometric) {
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

  get scene(): SceneGraph { return this._scene; }
  get bounds(): BoundingCuboid { return this._octree.bounds; }
  get spatial(): Octree { return this._octree; }

  set map(map: SquareGrid) {
    this._worldMap = map;
  }

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

  addActor(actor: Actor): void {
    let spatialGraph = this._octree;
    let scene = this._scene;
    actor.addEventListener(EntityEvent.Moving, function() {
      spatialGraph.update(actor);
      scene.updateEntity(actor);
    });
  }

  update(camera: Camera): void {
    for (let controller of this._controllers) {
      camera.update();
      controller.update();
    }
    this._scene.render(camera);
  }
}
