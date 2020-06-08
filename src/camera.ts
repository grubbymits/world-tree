import { Point } from "./graphics.js"

export class Camera {
  protected _lowerX : number;
  protected _lowerY : number;
  protected _upperX : number;
  protected _upperY : number;

  constructor(protected _x: number,
              protected _y: number,
              protected readonly _width: number,
              protected readonly _height: number) { }

  isOnScreen(coord : Point, width: number, depth: number) : boolean {
    if (coord.x + width < this._lowerX || coord.y + depth < this._lowerY ||
        coord.x - width > this._upperX || coord.y - depth > this._upperY) {
      return false;
    }
    return true;
  }

  getDrawCoord(coord: Point) : Point {
    return new Point(coord.x - this._x, coord.y - this._y);
  }
}

export class MouseCamera extends Camera {
  static sensistivity: number = 10;

  private _pivot: Point;
  private _primaryClicked: boolean = false;

  constructor(canvas: HTMLCanvasElement,
              x: number,
              y: number,
              width: number,
              height: number) {
    super(x, y, width, height);
    this._pivot = new Point(Math.floor(width / 2), Math.floor(height / 2));

    var camera = this;
    canvas.addEventListener('mousedown', e => {
      if (e.button == 0) {
        camera.primaryClicked = true;
        camera.pivot = new Point(e.clientX, e.clientY);
      }
    });

    canvas.addEventListener('mouseup', e => {
      if (e.button == 0) {
        camera.primaryClicked = false;
      }
    });

    canvas.addEventListener('mousemove', e => {
      if (camera.primaryClicked) {
        camera.x = e.clientX;
        camera.y = e.clientY;
      }
    });
  }

  set primaryClicked(click: boolean) { this._primaryClicked = click; }
  set pivot(coord: Point) { this._pivot = coord; }
  get pivot(): Point { return this._pivot; }
  get min(): Point { return new Point(this._lowerX, this._lowerY); }
  get primaryClicked(): boolean { return this._primaryClicked; }

  set x(x: number) {
    let dx: number = 0;
    if (x < this._pivot.x) {
      dx = Math.floor((this.pivot.x - x) / MouseCamera.sensistivity);
    } else if (x > this._pivot.x) {
      dx = -Math.floor((x - this.pivot.x) / MouseCamera.sensistivity);
    } else {
      return;
    }
    this._x += dx;
    this._lowerX += dx;
    this._upperX += dx;
  }

  set y(y: number) {
    let dy: number = 0;
    if (y < this._pivot.y) {
      dy = Math.floor((this.pivot.y - y) / MouseCamera.sensistivity);
    } else if (y > this._pivot.y) {
      dy = -Math.floor((y - this.pivot.y) / MouseCamera.sensistivity);
    } else {
      return;
    }
    this._y += dy;
    this._lowerY += dy;
    this._upperY += dy;
  }
}
