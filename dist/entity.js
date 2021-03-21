import { BoundingCuboid } from "./physics.js";
import { Point3D, CuboidGeometry } from "./geometry.js";
import { EventHandler } from "./events.js";
export class PhysicalEntity {
    constructor(_context, minLocation, dimensions) {
        this._context = _context;
        this._visible = true;
        this._drawable = false;
        this._drawGeometry = false;
        this._handler = new EventHandler();
        this._graphicComponents = new Array();
        this._id = PhysicalEntity._ids;
        PhysicalEntity._ids++;
        const centre = new Point3D(minLocation.x + Math.floor(dimensions.width / 2), minLocation.y + Math.floor(dimensions.depth / 2), minLocation.z + Math.floor(dimensions.height / 2));
        const bounds = new BoundingCuboid(centre, dimensions);
        this._geometry = new CuboidGeometry(bounds);
        this._context.addEntity(this);
    }
    set visible(visible) { this._visible = visible; }
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
    get graphics() {
        return this._graphicComponents;
    }
    get graphic() {
        return this._graphicComponents[0];
    }
    addGraphic(graphic) {
        this._drawable = true;
        this._graphicComponents.push(graphic);
    }
    updatePosition(d) {
        this.bounds.update(d);
        this.geometry.transform(d);
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
PhysicalEntity._ids = 0;
export class MovableEntity extends PhysicalEntity {
    constructor(context, location, dimensions) {
        super(context, location, dimensions);
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
    constructor(context, location, dimensions) {
        super(context, location, dimensions);
        context.addMovableEntity(this);
    }
    update() {
        this._handler.service();
        if (this._action != undefined && this._action.perform()) {
            console.log("completed action");
            this._action = null;
        }
    }
    set action(action) {
        this._action = action;
    }
}
export function createGraphicalEntity(context, location, dimensions, graphicComponent) {
    let entity = new PhysicalEntity(context, location, dimensions);
    entity.addGraphic(graphicComponent);
    return entity;
}
export function createGraphicalMovableEntity(context, location, dimensions, graphicComponent) {
    let entity = new MovableEntity(context, location, dimensions);
    entity.addGraphic(graphicComponent);
    return entity;
}
export function createGraphicalActor(context, location, dimensions, graphicComponent) {
    let actor = new Actor(context, location, dimensions);
    actor.addGraphic(graphicComponent);
    return actor;
}
