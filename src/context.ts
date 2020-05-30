import { Entity } from "./entity.js"
import { Terrain, TerrainShape, TerrainType } from "./terrain.js"
import { SquareGrid } from "./map.js"
import { Point,
         Sprite,
         IsometricRenderer } from "./graphics.js"
import { MouseController } from "./controller.js"

export class Context {
  private _gfx: IsometricRenderer;
  private _entities : Array<Entity>;
  private _controller: MouseController;

  constructor(private _worldMap: SquareGrid,
              canvas: HTMLCanvasElement) {

    this._controller = new MouseController(canvas);
    this._entities = new Array<Entity>();
    let terrain = _worldMap.allTerrain;
    Array.from(terrain.values()).forEach(value => this._entities.push(value));

    // Select the top right entity, at the lowest level, to be the root of the
    // scene.
    let root: Entity = _worldMap.getTerrain(_worldMap.width - 1, 0, 0)!;
    this._gfx = new IsometricRenderer(canvas, root, this._entities);
  }

  addEntity(entity: Entity): void {
    this._entities.push(entity);
    this._gfx.insertEntity(entity);
  }

  update(): void {
    this._gfx.render(this._controller.camera);
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
