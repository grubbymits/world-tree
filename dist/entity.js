import { BoundingCuboid } from "./physics.js";
import { Point3D, CuboidGeometry } from "./geometry.js";
import { EventHandler } from "./events.js";
export class PhysicalEntity {
    constructor(_context, minLocation, dimensions) {
        this._context = _context;
        this._visible = true;
        this._drawable = false;
        this._drawGeometry = false;
        this._id = PhysicalEntity._ids;
        PhysicalEntity._ids++;
        const centre = new Point3D(minLocation.x + Math.floor(dimensions.width / 2), minLocation.y + Math.floor(dimensions.depth / 2), minLocation.z + Math.floor(dimensions.height / 2));
        const bounds = new BoundingCuboid(centre, dimensions);
        this._geometry = new CuboidGeometry(bounds);
        this._context.addEntity(this);
    }
    updatePosition(d) {
        this.bounds.update(d);
        this.geometry.transform(d);
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
    get drawable() { return this._drawable; }
    get drawGeometry() { return this._drawGeometry; }
    set visible(visible) { this._visible = visible; }
}
PhysicalEntity._ids = 0;
export class GraphicalEntity extends PhysicalEntity {
    constructor(context, minLocation, dimensions, graphicComponent) {
        super(context, minLocation, dimensions);
        this._graphicComponents = new Array();
        this._graphicComponents.push(graphicComponent);
        this._drawable = true;
    }
    get graphics() {
        return this._graphicComponents;
    }
    get graphic() {
        return this._graphicComponents[0];
    }
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
export class EventableEntity extends GraphicalEntity {
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
            this._action = null;
        }
    }
    postEvent(event) {
        this._handler.post(event);
    }
    get direction() { return this._direction; }
    set direction(direction) {
        this._direction = direction;
    }
    set action(action) {
        this._action = action;
    }
}
