import { Camera } from "./camera.js"
import { Point } from "./graphics.js"

export class MouseController {
  private _camera: Camera;
  private _clicked: boolean;

  constructor(private _canvas: HTMLCanvasElement) {
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

  set clicked(click: boolean) { this._clicked = click; }
  get clicked(): boolean { return this._clicked; }
  get camera(): Camera { return this._camera; }
}
