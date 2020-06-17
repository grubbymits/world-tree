import { Entity,
         EventableEntity,
         EntityEvent,
         Actor } from "./entity.js"
import { Terrain, TerrainShape, TerrainType } from "./terrain.js"
import { SquareGrid } from "./map.js"
import { Point,
         Sprite,
         SceneGraph,
         IsometricRenderer } from "./graphics.js"
import { MouseCamera } from "./camera.js"
import { Controller } from "./controller.js"
import { Octree } from "./tree.js"
import { Dimensions,
         BoundingCuboid } from "./physics.js"

export class Context {
  private _gfx: IsometricRenderer;
  private _entities : Array<Entity> = new Array<Entity>();
  private _camera: MouseCamera;
  private _controllers: Array<Controller> = new Array<Controller>();
  private _octree : Octree;
  private _worldMap: SquareGrid;

  constructor(canvas: HTMLCanvasElement, worldDims: Dimensions) {

    //let terrain = _worldMap.allTerrain;
    //Array.from(terrain.values()).forEach(value => this._entities.push(value));
    this._camera = new MouseCamera(canvas, 0, 0, canvas.width, canvas.height);
    this._gfx = new IsometricRenderer(canvas, this._camera);
    this._octree = new Octree(worldDims);
  }

  get gfx(): SceneGraph { return this._gfx; }
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
    this._gfx.insertEntity(entity);
  }

  addActor(actor: Actor): void {
    let spatialGraph = this._octree;
    actor.addEventListener(EntityEvent.Move, function() {
      spatialGraph.update(actor);
    });
  }

  update(): void {
    for (let controller of this._controllers) {
      controller.update();
    }
    this._gfx.render();
  }

  run(): void {
    let context = this;
    var update = function update() {
      if (document.hasFocus()) {
        context.update();
      }
    }
    window.requestAnimationFrame(update);
  }
}
