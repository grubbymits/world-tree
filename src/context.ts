import { Entity } from "./entity.js"
import { Terrain, TerrainShape, TerrainType } from "./terrain.js"
import { SquareGrid } from "./map.js"
import { Point,
         Sprite,
         IsometricRenderer } from "./graphics.js"
import { MouseCamera } from "./camera.js"
import { MouseController } from "./controller.js"

export class Context {
  private _gfx: IsometricRenderer;
  private _entities : Array<Entity>;
  private _camera: MouseCamera;
  private _controller: MouseController;

  constructor(private _worldMap: SquareGrid,
              canvas: HTMLCanvasElement) {

    this._entities = new Array<Entity>();
    let terrain = _worldMap.allTerrain;
    Array.from(terrain.values()).forEach(value => this._entities.push(value));
    this._camera = new MouseCamera(canvas, 0, 0, canvas.width, canvas.height);
    this._gfx = new IsometricRenderer(canvas, this._camera, this._entities);
    this._controller = new MouseController(canvas, this._gfx);
  }

  update(): void {
    this._controller.update();
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
