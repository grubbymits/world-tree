export class Controller {
    constructor() {
        this._actors = new Array();
    }
    update() {
        for (let actor of this._actors) {
            actor.update();
        }
    }
}
