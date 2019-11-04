import { Point } from "./map.js"

const edge: number = 16;

export class Camera {

  private _lowerX : number;
  private _lowerY : number;
  private _upperX : number;
  private _upperY : number;
  private _horizontalScroller: number;
  private _verticalScroller: number;

  constructor(private _x: number,
              private _y: number,
              private _width: number,
              private _height: number) {
    this._lowerX = _x;
    this._lowerY = _y;
    this._upperX = _x + _width;
    this._upperY = _y + _height;
    this._horizontalScroller = 0;
    this._verticalScroller = 0;
  }

  updateBoundsX(): void {
    this._lowerX = this._x - this._width;
    this._upperX = this._x + this._width;
  }

  scrollLeft(): void {
    this._x = this._x - 5;
    this.updateBoundsX();
  }

  scrollRight(): void {
    this._x = this._x + 5;
    this.updateBoundsX();
  }

  set x(x: number) {
    if (this._horizontalScroller == 0) {
      if (x <= edge) {
        this._horizontalScroller = setInterval(() => { this.scrollLeft(); }, 16);
      } else if (x >= this._width - edge) {
        this._horizontalScroller = setInterval(() => { this.scrollRight(); }, 16);
      }
    } else {
      clearInterval(this._horizontalScroller);
      this._horizontalScroller = 0;
    }
  }

  updateBoundsY(): void {
    this._lowerY = this._y - this._height;
    this._upperY = this._y + this._height;
  }

  scrollUp(): void {
    this._y = this._y - 5;
    this.updateBoundsY();
  }

  scrollDown(): void {
    this._y = this._y + 5;
    this.updateBoundsY();
  }

  set y(y: number) {
    if (this._verticalScroller == 0) {
      if (y <= edge) {
        this._verticalScroller = setInterval(() => { this.scrollUp(); }, 16);
      } else if (y >= this._height - edge) {
        this._verticalScroller = setInterval(() => { this.scrollDown(); }, 16);
      }
    } else {
      clearInterval(this._verticalScroller);
      this._verticalScroller = 0;
    }
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
