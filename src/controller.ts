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
