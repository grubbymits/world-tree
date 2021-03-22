import { BoundingCuboid } from "./physics.js";
import { Point3D, CuboidGeometry } from "./geometry.js";
import { EventHandler } from "./events.js";
export class Entity {
    constructor(_context, minLocation, dimensions, graphicComponent) {
        this._context = _context;
        this._graphicComponents = new Array();
        this._visible = true;
        this._drawGeometry = false;
        this._id = Entity._ids;
        Entity._ids++;
        this._graphicComponents.push(graphicComponent);
        let centre = new Point3D(minLocation.x + (dimensions.width / 2), minLocation.y + (dimensions.depth / 2), minLocation.z + (dimensions.height / 2));
        const bounds = new BoundingCuboid(centre, dimensions);
        this._geometry = new CuboidGeometry(bounds);
        this._context.addEntity(this);
    }
    get context() { return this._context; }
    get geometry() { return this._geometry; }
    get bounds() { return this._geometry.bounds; }
    get dimensions() { return this.bounds.dimensions; }
    get x() { return this.bounds.minX; }
    get y() { return this.bounds.minY; }
    get z() { return this.bounds.minZ; }
    get width() { return this.bounds.width; }
    get depth() { return this.bounds.depth; }
    get height() { return this.bounds.height; }
    get centre() { return this.bounds.centre; }
    get id() { return this._id; }
    get visible() { return this._visible; }
    get graphics() {
        return this._graphicComponents;
    }
    get graphic() {
        return this._graphicComponents[0];
    }
    get drawGeometry() { return this._drawGeometry; }
    set visible(visible) { this._visible = visible; }
    addGraphic(graphic) {
        this._graphicComponents.push(graphic);
    }
    heightAt(location) {
        if (!this.bounds.contains(location)) {
            return null;
        }
        return this.z + this.height;
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
    postEvent(event) {
        this._handler.post(event);
    }
    update() { this._handler.service(); }
}
export class MovableEntity extends EventableEntity {
    constructor(context, location, dimensions, graphicComponent) {
        super(context, location, dimensions, graphicComponent);
        this._lift = 0;
        this._canSwim = false;
        context.addMovableEntity(this);
    }
    updatePosition(d) {
        this.bounds.update(d);
        this.geometry.transform(d);
    }
    get lift() { return this._lift; }
    get direction() { return this._direction; }
    set direction(direction) {
        this._direction = direction;
    }
}
export class Actor extends MovableEntity {
    constructor(context, location, dimensions, graphicComponent) {
        super(context, location, dimensions, graphicComponent);
    }
    update() {
        this._handler.service();
        if (this._action != undefined && this._action.perform()) {
            this._action = null;
        }
    }
    set action(action) {
        this._action = action;
    }
}
