import { EventHandler, EntityEvent, InputEvent } from "./events.js";
import { Point2D } from "./geometry.js";
export class Camera {
    constructor(_scene, _width, _height) {
        this._scene = _scene;
        this._width = _width;
        this._height = _height;
        this._lowerX = 0;
        this._lowerY = 0;
        this._handler = new EventHandler();
        this._x = 0;
        this._y = 0;
        this._upperX = _width;
        this._upperY = _height;
        console.log("initialising camera at (x,y):", this._x, this._y);
        this._surfaceLocation = _scene.getLocationAt(this._x, this._y, this);
    }
    isOnScreen(coord, width, depth) {
        if (coord.x + width < this._lowerX || coord.y + depth < this._lowerY ||
            coord.x - width > this._upperX || coord.y - depth > this._upperY) {
            return false;
        }
        return true;
    }
    get x() { return this._x; }
    get y() { return this._y; }
    get min() { return new Point2D(this._lowerX, this._lowerY); }
    get width() { return this._width; }
    get height() { return this._height; }
    get location() { return this._surfaceLocation; }
    set x(x) {
        this._x = x;
        this._lowerX = x - Math.floor(this.width / 2);
        this._upperX = x + Math.floor(this.width / 2);
    }
    set y(y) {
        this._y = y;
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
        console.log("updating camera to centre on (x,y,z):", newLocation.x, newLocation.y, newLocation.z);
        let newPoint = this._scene.getDrawCoord(newLocation);
        this.x = newPoint.x;
        this.y = newPoint.y;
        this._handler.post(InputEvent.CameraMove);
        this._surfaceLocation = newLocation;
    }
}
export class MouseCamera extends Camera {
    constructor(scene, canvas, width, height) {
        super(scene, width, height);
        var camera = this;
        canvas.addEventListener('mousedown', e => {
            if (e.button == 0) {
                camera.location = scene.getLocationAt(e.clientX, e.clientY, this);
            }
        });
    }
}
export class TrackerCamera extends Camera {
    constructor(scene, width, height, actor) {
        super(scene, width, height);
        var camera = this;
        actor.addEventListener(EntityEvent.Move, function () {
            camera.location = actor.centre;
        });
    }
}
