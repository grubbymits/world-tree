export class MouseController {
    constructor(canvas, scene) {
        var controller = this;
        canvas.addEventListener('mousedown', e => {
            if (e.button == 0) {
            }
            else if (e.button == 2) {
                let entity = scene.getDrawnAt(e.clientX, e.clientY);
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
