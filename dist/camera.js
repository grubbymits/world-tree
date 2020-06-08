import { Point } from "./graphics.js";
export class Camera {
    constructor(_x, _y, _width, _height) {
        this._x = _x;
        this._y = _y;
        this._width = _width;
        this._height = _height;
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
export class MouseCamera extends Camera {
    constructor(canvas, x, y, width, height) {
        super(x, y, width, height);
        this._primaryClicked = false;
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
    set primaryClicked(click) { this._primaryClicked = click; }
    set pivot(coord) { this._pivot = coord; }
    get pivot() { return this._pivot; }
    get min() { return new Point(this._lowerX, this._lowerY); }
    get primaryClicked() { return this._primaryClicked; }
    set x(x) {
        let dx = 0;
        if (x < this._pivot.x) {
            dx = Math.floor((this.pivot.x - x) / MouseCamera.sensistivity);
        }
        else if (x > this._pivot.x) {
            dx = -Math.floor((x - this.pivot.x) / MouseCamera.sensistivity);
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
            dy = Math.floor((this.pivot.y - y) / MouseCamera.sensistivity);
        }
        else if (y > this._pivot.y) {
            dy = -Math.floor((y - this.pivot.y) / MouseCamera.sensistivity);
        }
        else {
            return;
        }
        this._y += dy;
        this._lowerY += dy;
        this._upperY += dy;
    }
}
MouseCamera.sensistivity = 10;
