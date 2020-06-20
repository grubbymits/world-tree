export class Controller {
    constructor() {
        this._actors = new Array();
    }
}
export class MouseController extends Controller {
    constructor(scene, canvas, camera) {
        super();
        var controller = this;
        canvas.addEventListener('mousedown', e => {
            if (e.button == 0) {
            }
            else if (e.button == 2) {
                let entity = scene.getEntityDrawnAt(e.clientX, e.clientY, camera);
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
    set entity(e) { this._entity = e; }
}
