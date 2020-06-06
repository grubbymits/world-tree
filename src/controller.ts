import { Camera } from "./camera.js"
import { Point } from "./graphics.js"

export class MouseController {
  private _camera: Camera;
  private _primaryClicked: boolean = false;
  private _secondaryClicked: boolean = false;
  private _secondaryClickedAt: Point = new Point(0, 0);

  constructor(private _canvas: HTMLCanvasElement) {
    this._camera = new Camera(0, 0, _canvas.width, _canvas.height);

    var controller = this;
    this._canvas.addEventListener('mousedown', e => {
      if (e.button == 0) {
        controller.primaryClicked = true;
        controller.camera.pivot = new Point(e.clientX, e.clientY);
      } else if (e.button == 2) {
        controller.secondaryClicked = true;
        this._secondaryClickedAt = new Point(e.clientX, e.clientY);
      }
    });

    this._canvas.addEventListener('mouseup', e => {
      if (e.button == 0) {
        controller.primaryClicked = false;
      } else if (e.button == 2) {
        controller.secondaryClicked = false;
      }
    });

    this._canvas.addEventListener('mousemove', e => {
      if (controller.primaryClicked) {
        controller.camera.x = e.clientX;
        controller.camera.y = e.clientY;
      }
    });
  }

  set primaryClicked(click: boolean) { this._primaryClicked = click; }
  set secondaryClicked(click: boolean) { this._secondaryClicked = click; }
  get primaryClicked(): boolean { return this._primaryClicked; }
  get secondaryClicked(): boolean { return this._secondaryClicked; }
  get secondaryClickedAt(): Point { return this._secondaryClickedAt; }
  get camera(): Camera { return this._camera; }
}
