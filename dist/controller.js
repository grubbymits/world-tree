export class Controller {
    constructor() {
        this._actors = new Array();
    }
    get actors() { return this._actors; }
    update() {
        for (let actor of this._actors) {
            actor.update();
        }
    }
}
