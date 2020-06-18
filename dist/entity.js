import { Location, BoundingCuboid } from "./physics.js";
import { Point } from "./graphics.js";
import { EntityEvent, EventHandler } from "./events.js";
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
    updateLocation(dx, dy, dz) {
        this.location.x += dx;
        this.location.y += dy;
        this.location.z += dz;
    }
}
Entity._ids = 0;
export class EventableEntity extends Entity {
    constructor(context, location, dimensions, blocking, graphicComponent) {
        super(context, location, dimensions, blocking, graphicComponent);
        this._handler = new EventHandler();
    }
    addEventListener(event, callback) {
        this._handler.addEventListener(event, callback);
    }
    removeEventListener(event, callback) {
        this._handler.removeEventListener(event, callback);
    }
    update() { this._handler.service(); }
}
export class Actor extends EventableEntity {
    constructor(context, location, dimensions, blocking, graphicComponent) {
        super(context, location, dimensions, blocking, graphicComponent);
        this._canSwim = false;
        this._canFly = false;
        context.addActor(this);
    }
    update() {
        this._handler.service();
        if (this._action != undefined && this._action.perform()) {
            console.log("completed action");
            this.postEvent(EntityEvent.ActionComplete);
            this._action = null;
        }
    }
    postEvent(event) {
        this._handler.post(event);
    }
    set action(action) {
        this._action = action;
    }
}
