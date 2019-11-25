import { Point } from "./graphics.js"

export class Camera {

  private _lowerX : number;
  private _lowerY : number;
  private _upperX : number;
  private _upperY : number;
  private _centre: Point;
  static sensistivity: number = 10;

  constructor(private _x: number,
              private _y: number,
              private _width: number,
              private _height: number) {
    this._lowerX = _x;
    this._lowerY = _y;
    this._upperX = _x + _width;
    this._upperY = _y + _height;
    this._centre = new Point(Math.floor(_width / 2), Math.floor(_height / 2));
  }

  set centre(coord: Point) {
    this._centre = coord;
  }
  get centre(): Point {
    return this._centre;
  }

  set x(x: number) {
    if (x < this._centre.x) {
      this._x += Math.floor((this.centre.x - x) / Camera.sensistivity);
    } else if (x > this._centre.x) {
      this._x -= Math.floor((x - this.centre.x) / Camera.sensistivity);
    } else {
      return;
    }
    this._lowerX = Math.floor(this._x - this._width);
    this._upperX = Math.floor(this._x + this._width);
  }

  set y(y: number) {
    if (y < this._centre.y) {
      this._y += Math.floor((this.centre.y - y) / Camera.sensistivity);
    } else if (y > this._centre.y) {
      this._y -= Math.floor((y - this.centre.y) / Camera.sensistivity);
    } else {
      return;
    }
    this._lowerY = Math.floor(this._y - this._height);
    this._upperY = Math.floor(this._y + this._height);
  }

  isOnScreen(coord : Point) : boolean {
    if (coord.x < this._lowerX || coord.y < this._lowerY ||
        coord.x > this._upperX || coord.y > this._upperY) {
      return false;
    }
    return true;
  }

  getDrawCoord(coord: Point) : Point {
    return new Point(coord.x - this._x, coord.y - this._y);
  }
}
