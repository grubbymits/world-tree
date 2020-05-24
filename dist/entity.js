import { CoordSystem, CartisanRenderer, IsometricRenderer } from "./graphics.js";
export class Entity {
    constructor(_location, _dimensions, _blocking, graphicComponent, _static) {
        this._location = _location;
        this._dimensions = _dimensions;
        this._blocking = _blocking;
        this._static = _static;
        this._id = Entity._ids;
        Entity._ids++;
        this._graphicComponents = new Array();
        this._graphicComponents.push(graphicComponent);
    }
    get x() { return this._location.x; }
    get y() { return this._location.y; }
    get z() { return this._location.z; }
    get width() { return this._dimensions.width; }
    get depth() { return this._dimensions.depth; }
    get height() { return this._dimensions.height; }
    get location() { return this._location; }
    get dimensions() { return this._dimensions; }
    get blocking() { return this._blocking; }
    get id() { return this._id; }
    get static() { return this._static; }
    get graphics() {
        return this._graphicComponents;
    }
}
Entity._ids = 0;
export class StaticEntity extends Entity {
    constructor(location, dimensions, blocking, graphicsComponent, sys) {
        super(location, dimensions, blocking, graphicsComponent, true);
        this._drawCoord = sys == CoordSystem.Isometric ?
            IsometricRenderer.getDrawCoord(this) :
            CartisanRenderer.getDrawCoord(this);
    }
    get drawCoord() { return this._drawCoord; }
    addGraphic(graphic) {
        this._graphicComponents.push(graphic);
    }
}
