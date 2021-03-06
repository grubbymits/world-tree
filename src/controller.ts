import { SceneGraph } from "./scene.js"
import { Actor } from "./entity.js"
import { Camera } from "./camera.js"

export class Controller {
  protected _actors: Array<Actor> = new Array<Actor>();

  get actors(): Array<Actor> { return this._actors; }

  update(): void {
    for (let actor of this._actors) {
      actor.update();
    }
  }
}
