import { SceneGraph } from "./graphics.js"
import { Entity,
         Actor } from "./entity.js"

export abstract class Controller {
  protected _actors: Array<Actor> = new Array<Actor>();

  abstract update(): void;
}

export class MouseController extends Controller {
  private _entity: Entity;

  // private _actor: Entity;
  // private _action: Action;
  // private _target: Entity;

  constructor(canvas: HTMLCanvasElement,
              scene: SceneGraph) {
    super();
    var controller = this;

    canvas.addEventListener('mousedown', e => {
      if (e.button == 0) {
      } else if (e.button == 2) {
        let entity: Entity|null = scene.getDrawnAt(e.clientX, e.clientY);
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

