import { BoundingCuboid } from "./physics.js";
import { CuboidGeometry } from "./geometry.js";
import { Point } from "./graphics.js";
import { EntityEvent, EventHandler } from "./events.js";
export class Entity {
    constructor(_context, centre, dimensions, graphicComponent) {
        this._context = _context;
        this._hasMoved = false;
        this._drawCoord = new Point(0, 0);
        this._visible = true;
        this._drawGeometry = false;
        this._id = Entity._ids;
        Entity._ids++;
        this._graphicComponents = new Array();
        this._graphicComponents.push(graphicComponent);
        this._bounds = new BoundingCuboid(centre, dimensions);
        this._geometry = new CuboidGeometry(this._bounds);
        this._context.addEntity(this);
    }
    get x() { return this._bounds.minX; }
    get y() { return this._bounds.minY; }
    get z() { return this._bounds.minZ; }
    get width() { return this._bounds.width; }
    get depth() { return this._bounds.depth; }
    get height() { return this._bounds.height; }
    get geometry() { return this._geometry; }
    get dimensions() { return this._bounds.dimensions; }
    get bounds() { return this._bounds; }
    get centre() { return this._bounds.centre; }
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
    get drawGeometry() { return this._drawGeometry; }
    set drawCoord(coord) { this._drawCoord = coord; }
    set visible(visible) { this._visible = visible; }
    addGraphic(graphic) {
        this._graphicComponents.push(graphic);
    }
    heightAt(location) {
        if (!this._bounds.contains(location)) {
            return null;
        }
        return this.z + this.height;
    }
    updatePosition(d) {
        this.bounds.update(d);
        this.geometry.transform(d);
    }
}
Entity._ids = 0;
export class EventableEntity extends Entity {
    constructor(context, location, dimensions, graphicComponent) {
        super(context, location, dimensions, graphicComponent);
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
    constructor(context, location, dimensions, graphicComponent) {
        super(context, location, dimensions, graphicComponent);
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
