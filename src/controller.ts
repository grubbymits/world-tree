import { SceneGraph } from "./scene.js"
import { Entity,
         Actor } from "./entity.js"
import { Camera } from "./camera.js"

export class Controller {
  protected _actors: Array<Actor> = new Array<Actor>();

  update(): void {
    for (let actor of this._actors) {
      actor.update();
    }
  }
}

export class MouseController extends Controller {
  private _entity: Entity;

  // private _actor: Entity;
  // private _action: Action;
  // private _target: Entity;

  constructor(scene: SceneGraph,
              canvas: HTMLCanvasElement,
              camera: Camera) {
    super();
    var controller = this;

    canvas.addEventListener('mousedown', e => {
      if (e.button == 0) {
      } else if (e.button == 2) {
        let entity: Entity|null =
          scene.getEntityDrawnAt(e.clientX, e.clientY, camera);
        if (entity != undefined) {
          controller.entity = entity;
        }
      }
    });
  }

  update(): void {
    if (this._entity != undefined) {
      this._entity.visible = false;
    }
  }

  set entity(e: Entity) { this._entity = e; }
}

