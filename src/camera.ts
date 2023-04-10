//deno-lint-ignore-file no-explicit-any

import { EntityEvent, EventHandler, InputEvent } from "./events.ts";
import { MovableEntity } from "./entity.ts";
import { Point2D, Point3D } from "./geometry.ts";
import { Scene } from "./scene.ts";

export class Camera {
  protected _lowerX = 0;
  protected _lowerY = 0;
  protected _upperX: number;
  protected _upperY: number;
  protected readonly _width: number;
  protected readonly _height: number;
  protected _handler = new EventHandler<InputEvent>();
  protected _surfaceLocation: Point3D | null;

  constructor(protected _scene: Scene, width: number, height: number) {
    this._width = Math.floor(width);
    this._height = Math.floor(height);
    this._upperX = Math.floor(width);
    this._upperY = Math.floor(height);
    this._surfaceLocation = _scene.getLocationAt(
      this._lowerX,
      this._lowerY,
      this
    );
  }

  isOnScreen(coord: Point2D, width: number, depth: number): boolean {
    if (
      coord.x + width < this._lowerX ||
      coord.y + depth < this._lowerY ||
      coord.x - width > this._upperX ||
      coord.y - depth > this._upperY
    ) {
      return false;
    }
    return true;
  }

  get min(): Point2D {
    return new Point2D(this._lowerX, this._lowerY);
  }
  get max(): Point2D {
    return new Point2D(this._upperX, this._upperY);
  }
  get width(): number {
    return this._width;
  }
  get height(): number {
    return this._height;
  }
  get location(): Point3D | null {
    return this._surfaceLocation;
  }
  set location(newLocation: Point3D | null) {
    if (newLocation == undefined) {
      console.log("undefined camera surface location");
      return;
    }
    const newPoint: Point2D = this._scene.graph.getDrawCoord(newLocation);
    this.x = newPoint.x;
    this.y = newPoint.y;
    this._handler.post(InputEvent.CameraMove);
    this._surfaceLocation = newLocation;
  }
  set x(x: number) {
    this._lowerX = x - Math.floor(this.width / 2);
    this._upperX = x + Math.floor(this.width / 2);
  }
  set y(y: number) {
    this._lowerY = y - Math.floor(this.height / 2);
    this._upperY = y + Math.floor(this.height / 2);
  }

  getDrawCoord(coord: Point2D): Point2D {
    return new Point2D(coord.x - this._lowerX, coord.y - this._lowerY);
  }

  update(): void {
    this._handler.service();
  }

  addEventListener(event: InputEvent, callback: any): void {
    this._handler.addEventListener(event, callback);
  }

  removeEventListener(event: InputEvent, callback: any): void {
    this._handler.removeEventListener(event, callback);
  }
}

export class MouseCamera extends Camera {
  constructor(
    scene: Scene,
    canvas: HTMLCanvasElement,
    width: number,
    height: number
  ) {
    super(scene, width, height);

    canvas.addEventListener("mousedown", (e) => {
      if (e.button == 0) {
        this.location = scene.getLocationAt(e.offsetX, e.offsetY, this);
      }
    });
    canvas.addEventListener("touchstart", (e) => {
      const touch = e.touches[0];
      this.location = scene.getLocationAt(touch.pageX, touch.pageY, this);
    });
  }
}

export class TrackerCamera extends Camera {
  constructor(
    scene: Scene,
    width: number,
    height: number,
    movable: MovableEntity
  ) {
    super(scene, width, height);

    this.location = movable.centre;
    movable.addEventListener(EntityEvent.Moving, () => {
      this.location = movable.centre;
    });
  }
}
