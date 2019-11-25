import { Entity } from "./entity.js"
import { Terrain, TerrainShape, TerrainType } from "./terrain.js"
import { SquareGrid } from "./map.js"
import { Point, CoordSystem, Sprite,
         Renderer, CartisanRenderer, IsometricRenderer } from "./graphics.js"
import { MouseController } from "./controller.js"

export class Context {
  private _gfx: Renderer;
  private _entities : Array<Entity>;
  private _controller: MouseController;

  constructor(private _worldMap: SquareGrid,
              sys: CoordSystem,
              canvas: HTMLCanvasElement) {

    this._controller = new MouseController(canvas);
    this._entities = new Array<Entity>();
    let terrain = _worldMap.allTerrain;
    Array.from(terrain.values()).forEach(value => this._entities.push(value));
    this._gfx = sys == CoordSystem.Cartisan ?
      new CartisanRenderer(canvas) :
      new IsometricRenderer(canvas);
  }

  get map(): SquareGrid {
    return this._worldMap;
  }

  getTerrain(x: number, y: number): Terrain | null {
    return this._worldMap.getTerrain(x, y, 0);
  }

  update(): void {
    this._gfx.update(this._entities, this._worldMap, this._controller.camera);
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
