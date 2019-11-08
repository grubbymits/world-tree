import { Camera } from "./camera.js";
import { Point } from "./map.js";
export class MouseController {
    constructor(_canvas) {
        this._canvas = _canvas;
        this._camera = new Camera(0, 0, _canvas.width, _canvas.height);
        this._clicked = false;
        var controller = this;
        this._canvas.addEventListener('mousedown', e => {
            controller.clicked = true;
            controller.camera.centre = new Point(e.clientX, e.clientY);
        });
        this._canvas.addEventListener('mouseup', e => {
            controller.clicked = false;
        });
        this._canvas.addEventListener('mousemove', e => {
            if (controller.clicked) {
                controller.camera.x = e.clientX;
                controller.camera.y = e.clientY;
            }
        });
    }
    set clicked(click) { this._clicked = click; }
    get clicked() { return this._clicked; }
    get camera() { return this._camera; }
}
