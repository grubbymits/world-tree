import { PhysicalEntity,
         Actor } from "./entity.js"
import { EntityEvent } from "./events.js"
import { Terrain, TerrainShape, TerrainType } from "./terrain.js"
import { SquareGrid } from "./map.js"
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
         CollisionDetector } from "./physics.js"

export class Context {
  private _scene: SceneRenderer;
  private _entities : Array<PhysicalEntity> = new Array<PhysicalEntity>();
  private _controllers: Array<Controller> = new Array<Controller>();
  private _octree : Octree;
  private _worldMap: SquareGrid;

  constructor(worldDims: Dimensions) {
    this._octree = new Octree(worldDims);
    CollisionDetector.init(this._octree);
  }

  get scene(): SceneRenderer { return this._scene; }
  get bounds(): BoundingCuboid { return this._octree.bounds; }
  get spatial(): Octree { return this._octree; }
  get map(): SquareGrid { return this._worldMap; }

  set map(map: SquareGrid) {
    this._worldMap = map;
  }

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
