import { Point } from "./graphics.js"
import { EventHandler,
         InputEvent } from "./events.js"
import { Point3D } from "./geometry.js"
import { SceneGraph } from "./graphics.js"

export class Camera {
  protected _x: number;
  protected _y: number;
  protected _lowerX : number = 0;
  protected _lowerY : number = 0;
  protected _upperX : number;
  protected _upperY : number;
  protected _handler = new EventHandler<InputEvent>();
  protected _surfaceLocation : Point3D|null;

  constructor(protected _scene: SceneGraph,
              protected readonly _width: number,
              protected readonly _height: number) {
    this._x = Math.floor(_width / 2);
    this._y = Math.floor(_height / 2);
    this._upperX = _width;
    this._upperY = _height;
    console.log("initialising camera at (x,y):", this._x, this._y);
    this._surfaceLocation = _scene.getLocationAt(this._x, this._y, this);
  }

  isOnScreen(coord : Point, width: number, depth: number) : boolean {
    if (coord.x + width < this._lowerX || coord.y + depth < this._lowerY ||
        coord.x - width > this._upperX || coord.y - depth > this._upperY) {
      return false;
    }
    return true;
  }

  get x(): number { return this._x; }
  get y(): number { return this._y; }
  get width(): number { return this._width; }
  get height(): number { return this._height; }
  get location(): Point3D|null { return this._surfaceLocation; }
  set x(x: number)  {
    this._x = x;
    this._lowerX = x - Math.floor(this.width / 2);
    this._upperX = x + Math.floor(this.width / 2);
  }
  set y(y: number) {
    this._y = y;
    this._lowerY = y - Math.floor(this.height / 2);
    this._upperY = y + Math.floor(this.height / 2);
  }

  getDrawCoord(coord: Point) : Point {
    return new Point(coord.x - this._lowerX, coord.y - this._lowerY);
  }

  update(): void {
    this._handler.service();
  }

  addEventListener(event: InputEvent, callback: Function): void {
    this._handler.addEventListener(event, callback);
  }

  removeEventListener(event: InputEvent, callback: Function): void {
    this._handler.removeEventListener(event, callback);
  }

  set location(newLocation: Point3D|null) {
    if (newLocation == undefined) {
      console.log("undefined camera surface location");
      return;
    }
    console.log("updating camera to centre on (x,y,z):",
                newLocation.x, newLocation.y, newLocation.z);
    let newPoint: Point = this._scene.getDrawCoord(newLocation);
    this.x = newPoint.x;
    this.y = newPoint.y;
    this._handler.post(InputEvent.CameraMove);
    this._surfaceLocation = newLocation;
  }
}

export class MouseCamera extends Camera {

  constructor(scene: SceneGraph,
              canvas: HTMLCanvasElement,
              width: number,
              height: number) {
    super(scene, width, height);

    var camera = this;
    canvas.addEventListener('mousedown', e => {
      if (e.button == 0) {
        camera.location = scene.getLocationAt(e.clientX, e.clientY, this);
      }
    });
  }

  get min(): Point { return new Point(this._lowerX, this._lowerY); }
}
