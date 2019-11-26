export class Entity {
    constructor(_location, _width, _depth, _height, _blocking, _graphicsComponent) {
        this._location = _location;
        this._width = _width;
        this._depth = _depth;
        this._height = _height;
        this._blocking = _blocking;
        this._graphicsComponent = _graphicsComponent;
        this._id = Entity._ids;
        Entity._ids++;
    }
    get x() { return this._location.x; }
    get y() { return this._location.y; }
    get z() { return this._location.z; }
    get width() { return this._width; }
    get height() { return this._height; }
    get depth() { return this._depth; }
    get location() { return this._location; }
    get blocking() { return this._blocking; }
    get id() { return this._id; }
    get graphicsComponent() {
        return this._graphicsComponent;
    }
}
Entity._ids = 0;
export class Actor extends Entity {
    constructor(location, width, depth, height, graphics) {
        super(location, width, depth, height, true, graphics);
    }
}
