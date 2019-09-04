export class Point {
    constructor(_x, _y) {
        this._x = _x;
        this._y = _y;
    }
    get x() { return this._x; }
    get y() { return this._y; }
}
export class Location {
    constructor(_blocking, _x, _y, _id) {
        this._blocking = _blocking;
        this._x = _x;
        this._y = _y;
        this._id = _id;
        this._spriteId = 0;
    }
    get x() {
        return this._x;
    }
    get y() {
        return this._y;
    }
    get id() {
        return this._id;
    }
    get blocked() {
        return this._blocking;
    }
    get spriteId() {
        return this._spriteId;
    }
    set spriteId(id) {
        this._spriteId = id;
    }
}
export var CoordSystem;
(function (CoordSystem) {
    CoordSystem[CoordSystem["Cartisan"] = 0] = "Cartisan";
    CoordSystem[CoordSystem["Isometric"] = 1] = "Isometric";
})(CoordSystem || (CoordSystem = {}));
export class GameMap {
    constructor(_width, _height) {
        this._width = _width;
        this._height = _height;
    }
}
export class SquareGrid extends GameMap {
    constructor(width, height) {
        super(width, height);
        this._neighbourOffsets = [new Point(-1, -1), new Point(0, -1), new Point(1, -1),
            new Point(-1, 0), new Point(1, 0),
            new Point(-1, 1), new Point(0, 1), new Point(1, 1),];
        let id = 0;
        this._locations = new Array();
        for (let x = 0; x < this._width; x++) {
            this._locations[x] = new Array();
            for (let y = 0; y < this._height; y++) {
                this._locations[x].push(new Location(false, x, y, id));
                ++id;
            }
        }
    }
    static convertToIsometric(x, y, width, height) {
        let drawX = Math.floor(x * width / 2) + Math.floor(y * width / 2);
        let drawY = Math.floor(y * height / 2) - Math.floor(x * height / 2);
        return new Point(drawX, drawY);
    }
    static convertToCartisan(coord) {
        let x = Math.floor((2 * coord.y + coord.x) / 2);
        let y = Math.floor((2 * coord.y - coord.x) / 2);
        return new Point(x, y);
    }
    getLocation(x, y) {
        return this._locations[x][y];
    }
    getNeighbours(centre) {
        let neighbours = new Array();
        for (let offset of this._neighbourOffsets) {
            let neighbour = this.getLocation(centre.x + offset.x, centre.y + offset.y);
            neighbours.push(neighbour);
        }
        return neighbours;
    }
    getDrawCoord(cellX, cellY, width, height, sys) {
        switch (sys) {
            default:
                throw ("Unhandled coordinate system");
            case CoordSystem.Cartisan:
                return new Point(cellX * width, cellY * height);
            case CoordSystem.Isometric:
                return SquareGrid.convertToIsometric(cellX, cellY, width, height);
        }
    }
}
