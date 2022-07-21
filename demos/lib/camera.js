import { EventHandler, EntityEvent, InputEvent } from "./events.js";
import { Point2D } from "./geometry.js";
export class Camera {
    constructor(_scene, width, height) {
        this._scene = _scene;
        this._lowerX = 0;
        this._lowerY = 0;
        this._handler = new EventHandler();
        this._width = Math.floor(width);
        this._height = Math.floor(height);
        this._upperX = Math.floor(width);
        this._upperY = Math.floor(height);
        this._surfaceLocation = _scene.getLocationAt(this._lowerX, this._lowerY, this);
    }
    isOnScreen(coord, width, depth) {
        if (coord.x + width < this._lowerX || coord.y + depth < this._lowerY ||
            coord.x - width > this._upperX || coord.y - depth > this._upperY) {
            return false;
        }
        return true;
    }
    get min() { return new Point2D(this._lowerX, this._lowerY); }
    get max() { return new Point2D(this._upperX, this._upperY); }
    get width() { return this._width; }
    get height() { return this._height; }
    get location() { return this._surfaceLocation; }
    set x(x) {
        this._lowerX = x - Math.floor(this.width / 2);
        this._upperX = x + Math.floor(this.width / 2);
    }
    set y(y) {
        this._lowerY = y - Math.floor(this.height / 2);
        this._upperY = y + Math.floor(this.height / 2);
    }
    getDrawCoord(coord) {
        return new Point2D(coord.x - this._lowerX, coord.y - this._lowerY);
    }
    update() {
        this._handler.service();
    }
    addEventListener(event, callback) {
        this._handler.addEventListener(event, callback);
    }
    removeEventListener(event, callback) {
        this._handler.removeEventListener(event, callback);
    }
    set location(newLocation) {
        if (newLocation == undefined) {
            console.log("undefined camera surface location");
            return;
        }
        const newPoint = this._scene.graph.getDrawCoord(newLocation);
        this.x = newPoint.x;
        this.y = newPoint.y;
        this._handler.post(InputEvent.CameraMove);
        this._surfaceLocation = newLocation;
    }
}
export class MouseCamera extends Camera {
    constructor(scene, canvas, width, height) {
        super(scene, width, height);
        canvas.addEventListener('mousedown', e => {
            if (e.button == 0) {
                this.location = scene.getLocationAt(e.offsetX, e.offsetY, this);
            }
        });
        canvas.addEventListener('touchstart', e => {
            let touch = e.touches[0];
            this.location = scene.getLocationAt(touch.pageX, touch.pageY, this);
        });
    }
}
export class TrackerCamera extends Camera {
    constructor(scene, width, height, movable) {
        super(scene, width, height);
        this.location = movable.centre;
        var camera = this;
        movable.addEventListener(EntityEvent.Moving, function () {
            camera.location = movable.centre;
        });
    }
}
