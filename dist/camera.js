import { Point } from "./map.js";
const edge = 16;
export class Camera {
    constructor(_x, _y, _width, _height) {
        this._x = _x;
        this._y = _y;
        this._width = _width;
        this._height = _height;
        this._lowerX = _x;
        this._lowerY = _y;
        this._upperX = _x + _width;
        this._upperY = _y + _height;
        this._horizontalScroller = 0;
        this._verticalScroller = 0;
    }
    updateBoundsX() {
        this._lowerX = this._x - this._width;
        this._upperX = this._x + this._width;
    }
    scrollLeft() {
        this._x = this._x - 5;
        this.updateBoundsX();
    }
    scrollRight() {
        this._x = this._x + 5;
        this.updateBoundsX();
    }
    set x(x) {
        if (this._horizontalScroller == 0) {
            if (x <= edge) {
                this._horizontalScroller = setInterval(() => { this.scrollLeft(); }, 16);
            }
            else if (x >= this._width - edge) {
                this._horizontalScroller = setInterval(() => { this.scrollRight(); }, 16);
            }
        }
        else {
            clearInterval(this._horizontalScroller);
            this._horizontalScroller = 0;
        }
    }
    updateBoundsY() {
        this._lowerY = this._y - this._height;
        this._upperY = this._y + this._height;
    }
    scrollUp() {
        this._y = this._y - 5;
        this.updateBoundsY();
    }
    scrollDown() {
        this._y = this._y + 5;
        this.updateBoundsY();
    }
    set y(y) {
        if (this._verticalScroller == 0) {
            if (y <= edge) {
                this._verticalScroller = setInterval(() => { this.scrollUp(); }, 16);
            }
            else if (y >= this._height - edge) {
                this._verticalScroller = setInterval(() => { this.scrollDown(); }, 16);
            }
        }
        else {
            clearInterval(this._verticalScroller);
            this._verticalScroller = 0;
        }
    }
    isOnScreen(coord) {
        if (coord.x < this._lowerX || coord.y < this._lowerY ||
            coord.x > this._upperX || coord.y > this._upperY) {
            return false;
        }
        return true;
    }
    getDrawCoord(coord) {
        return new Point(coord.x - this._x, coord.y - this._y);
    }
}
