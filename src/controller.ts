import { SceneGraph } from "./graphics.js"
import { Entity } from "./entity.js"

export class MouseController {
  private _entity: Entity;

  // private _actor: Entity;
  // private _action: Action;
  // private _target: Entity;

  constructor(canvas: HTMLCanvasElement,
              scene: SceneGraph) {
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

  update() {
    if (this._entity != undefined) {
      this._entity.visible = false;
    }
  }

  set entity(e: Entity) { this._entity = e; }
}
