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
        this._pivot = new Point(Math.floor(_width / 2), Math.floor(_height / 2));
    }
    set pivot(coord) { this._pivot = coord; }
    get pivot() { return this._pivot; }
    get min() { return new Point(this._lowerX, this._lowerY); }
    set x(x) {
        let dx = 0;
        if (x < this._pivot.x) {
            dx = Math.floor((this.pivot.x - x) / Camera.sensistivity);
        }
        else if (x > this._pivot.x) {
            dx = -Math.floor((x - this.pivot.x) / Camera.sensistivity);
        }
        else {
            return;
        }
        this._x += dx;
        this._lowerX += dx;
        this._upperX += dx;
    }
    set y(y) {
        let dy = 0;
        if (y < this._pivot.y) {
            dy = Math.floor((this.pivot.y - y) / Camera.sensistivity);
        }
        else if (y > this._pivot.y) {
            dy = -Math.floor((y - this.pivot.y) / Camera.sensistivity);
        }
        else {
            return;
        }
        this._y += dy;
        this._lowerY += dy;
        this._upperY += dy;
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
