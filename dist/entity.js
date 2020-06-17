import { Location, BoundingCuboid } from "./physics.js";
import { Point } from "./graphics.js";
export class Entity {
    constructor(_context, _location, _dimensions, _blocking, graphicComponent) {
        this._context = _context;
        this._location = _location;
        this._dimensions = _dimensions;
        this._blocking = _blocking;
        this._hasMoved = false;
        this._drawCoord = new Point(0, 0);
        this._visible = true;
        this._id = Entity._ids;
        Entity._ids++;
        this._graphicComponents = new Array();
        this._graphicComponents.push(graphicComponent);
        let centre = new Location(this.x + Math.floor(this.width / 2), this.y + Math.floor(this.depth / 2), this.z + Math.floor(this.height / 2));
        this._bounds = new BoundingCuboid(centre, _dimensions);
        this._context.addEntity(this);
    }
    get x() { return this._location.x; }
    get y() { return this._location.y; }
    get z() { return this._location.z; }
    get width() { return this._dimensions.width; }
    get depth() { return this._dimensions.depth; }
    get height() { return this._dimensions.height; }
    get location() { return this._location; }
    get dimensions() { return this._dimensions; }
    get bounds() { return this._bounds; }
    get centre() { return this._bounds.centre; }
    get blocking() { return this._blocking; }
    get id() { return this._id; }
    get hasMoved() { return this._hasMoved; }
    get drawCoord() { return this._drawCoord; }
    get visible() { return this._visible; }
    get graphics() {
        return this._graphicComponents;
    }
    get graphic() {
        return this._graphicComponents[0];
    }
    set drawCoord(coord) { this._drawCoord = coord; }
    set visible(visible) { this._visible = visible; }
    set location(location) { this._location = location; }
    addGraphic(graphic) {
        this._graphicComponents.push(graphic);
    }
    heightAt(location) {
        if (!this._bounds.contains(location)) {
            return null;
        }
        return this.z + this.height;
    }
}
Entity._ids = 0;
export var EntityEvent;
(function (EntityEvent) {
    EntityEvent["Move"] = "move";
    EntityEvent["ActionComplete"] = "actionComplete";
})(EntityEvent || (EntityEvent = {}));
export class EventableEntity extends Entity {
    constructor(context, location, dimensions, blocking, graphicComponent) {
        super(context, location, dimensions, blocking, graphicComponent);
        this._listeners = new Map();
        this._events = new Array();
    }
    update() { this.serviceEvents(); }
    serviceEvents() {
        for (let event of this._events) {
            if (!this._listeners.has(event)) {
                continue;
            }
            let callbacks = this._listeners.get(event);
            for (let callback of callbacks) {
                callback();
            }
        }
        this._events = [];
    }
    addEventListener(event, callback) {
        if (!this._listeners.has(event)) {
            this._listeners.set(event, new Array());
        }
        else {
            let callbacks = this._listeners.get(event);
            for (let i in callbacks) {
                if (callbacks[i] === callback) {
                    return;
                }
            }
        }
        this._listeners.get(event).push(callback);
    }
    removeEventListener(event, callback) {
        if (!this._listeners.has(event)) {
            return;
        }
        let callbacks = this._listeners.get(event);
        const index = callbacks.indexOf(callback, 0);
        if (index > -1) {
            callbacks.splice(index, 1);
        }
    }
}
export class Actor extends EventableEntity {
    constructor(context, location, dimensions, blocking, graphicComponent) {
        super(context, location, dimensions, blocking, graphicComponent);
        this._canSwim = false;
        this._canFly = false;
        context.addActor(this);
    }
    update() {
        this.serviceEvents();
        if (this._action != undefined && this._action.perform()) {
            this._events.push(EntityEvent.ActionComplete);
        }
    }
}
