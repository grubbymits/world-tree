import { Point } from "./graphics.js"

export class Camera {

  private _lowerX : number;
  private _lowerY : number;
  private _upperX : number;
  private _upperY : number;
  private _pivot: Point;
  static sensistivity: number = 10;

  constructor(private _x: number,
              private _y: number,
              private _width: number,
              private _height: number) {
    this._lowerX = _x;
    this._lowerY = _y;
    this._upperX = _x + _width;
    this._upperY = _y + _height;
    this._pivot = new Point(Math.floor(_width / 2), Math.floor(_height / 2));
  }

  set pivot(coord: Point) { this._pivot = coord; }
  get pivot(): Point { return this._pivot; }
  get min(): Point { return new Point(this._lowerX, this._lowerY); }

  set x(x: number) {
    let dx: number = 0;
    if (x < this._pivot.x) {
      dx = Math.floor((this.pivot.x - x) / Camera.sensistivity);
    } else if (x > this._pivot.x) {
      dx = -Math.floor((x - this.pivot.x) / Camera.sensistivity);
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
      dy = Math.floor((this.pivot.y - y) / Camera.sensistivity);
    } else if (y > this._pivot.y) {
      dy = -Math.floor((y - this.pivot.y) / Camera.sensistivity);
    } else {
      return;
    }
    this._y += dy;
    this._lowerY += dy;
    this._upperY += dy;
  }

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
