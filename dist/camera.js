import { Point } from "./graphics.js";
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
        this._centre = new Point(Math.floor(_width / 2), Math.floor(_height / 2));
    }
    set centre(coord) {
        this._centre = coord;
    }
    get centre() {
        return this._centre;
    }
    set x(x) {
        if (x < this._centre.x) {
            this._x += Math.floor((this.centre.x - x) / Camera.sensistivity);
        }
        else if (x > this._centre.x) {
            this._x -= Math.floor((x - this.centre.x) / Camera.sensistivity);
        }
        else {
            return;
        }
        this._lowerX = Math.floor(this._x - this._width);
        this._upperX = Math.floor(this._x + this._width);
    }
    set y(y) {
        if (y < this._centre.y) {
            this._y += Math.floor((this.centre.y - y) / Camera.sensistivity);
        }
        else if (y > this._centre.y) {
            this._y -= Math.floor((y - this.centre.y) / Camera.sensistivity);
        }
        else {
            return;
        }
        this._lowerY = Math.floor(this._y - this._height);
        this._upperY = Math.floor(this._y + this._height);
    }
    isOnScreen(coord, width, depth) {
        if (coord.x + width < this._lowerX || coord.y + depth < this._lowerY ||
            coord.x - width > this._upperX || coord.y - depth > this._upperY) {
            return false;
        }
        return true;
    }
    getDrawCoord(coord) {
        return new Point(coord.x - this._x, coord.y - this._y);
    }
}
Camera.sensistivity = 10;
