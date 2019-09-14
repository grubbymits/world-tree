export class Point {
    constructor(_x, _y) {
        this._x = _x;
        this._y = _y;
    }
    get x() { return this._x; }
    get y() { return this._y; }
}
export class Location {
    constructor(_blocking, _x, _y, _z, _id) {
        this._blocking = _blocking;
        this._x = _x;
        this._y = _y;
        this._z = _z;
        this._id = _id;
        this._spriteId = 0;
    }
    get x() {
        return this._x;
    }
    get y() {
        return this._y;
    }
    get z() {
        return this._z;
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
class LocationCost {
    constructor(_location, _cost) {
        this._location = _location;
        this._cost = _cost;
    }
    get location() { return this._location; }
    get id() { return this._location.id; }
    get cost() { return this._cost; }
}
export class SquareGrid {
    constructor(_width, _height, _tileWidth, _tileHeight) {
        this._width = _width;
        this._height = _height;
        this._tileWidth = _tileWidth;
        this._tileHeight = _tileHeight;
        this._neighbourOffsets = [new Point(-1, -1), new Point(0, -1), new Point(1, -1),
            new Point(-1, 0), new Point(1, 0),
            new Point(-1, 1), new Point(0, 1), new Point(1, 1),];
        this._ids = 0;
        this._raisedLocations = new Array();
        this._locations = new Array();
        for (let x = 0; x < this._width; x++) {
            this._locations[x] = new Array();
            for (let y = 0; y < this._height; y++) {
                this._locations[x].push(new Location(false, x, y, 0, this._ids));
                this._ids++;
            }
        }
    }
    get width() {
        return this._width;
    }
    get height() {
        return this._height;
    }
    get raisedLocations() {
        return this._raisedLocations;
    }
    getLocation(x, y) {
        return this._locations[x][y];
    }
    getNeighbourCost(centre, to) {
        if ((centre.x == to.x) || (centre.y == to.y)) {
            return 2;
        }
        return 3;
    }
    getNeighbours(centre) {
        let neighbours = new Array();
        for (let offset of this._neighbourOffsets) {
            let neighbour = this.getLocation(centre.x + offset.x, centre.y + offset.y);
            neighbours.push(neighbour);
        }
        return neighbours;
    }
    findPath(begin, end) {
        let path = new Array();
        if (end.blocked)
            return path;
        let frontier = new Array();
        let cameFrom = new Map();
        let costSoFar = new Map();
        cameFrom.set(begin, null);
        costSoFar.set(begin, 0);
        frontier.push(new LocationCost(begin, 0));
        let current = frontier[0];
        while (frontier.length > 0) {
            current = frontier.shift();
            if (current.id == end.id) {
                break;
            }
            let neighbours = this.getNeighbours(current.location);
            for (let next of neighbours) {
                let newCost = costSoFar.get(current.id) +
                    this.getNeighbourCost(current.location, next);
                if (!costSoFar.has(next) || newCost < costSoFar.get(next)) {
                    frontier.push(new LocationCost(next, newCost));
                    costSoFar.set(next, newCost);
                    frontier.sort((a, b) => {
                        if (a.cost > b.cost) {
                            return 1;
                        }
                        else if (a.cost < b.cost) {
                            return -1;
                        }
                        else {
                            return 0;
                        }
                    });
                    cameFrom.set(next, current);
                }
            }
        }
        if (current.id != end.id) {
            console.log("Could not find a path...");
            return path;
        }
        let step = end;
        path.push(step);
        while (step.id != begin.id) {
            step = cameFrom.get(step);
            path.push(step);
        }
        path.reverse();
        return path.splice(1);
    }
    renderRaised(camera, gfx) {
        for (let i in this._raisedLocations) {
            let location = this._raisedLocations[i];
            let coord = this.getDrawCoord(location.x, location.y, 0);
            let newCoord = new Point(coord.x + camera.x, coord.y + camera.y);
            gfx.render(newCoord, location.spriteId);
        }
    }
}
export class IsometricGrid extends SquareGrid {
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
    getDrawCoord(x, y, z) {
        let width = this._tileWidth;
        let height = this._tileHeight;
        return IsometricGrid.convertToIsometric(x, y, width, height);
    }
    renderFloor(camera, gfx) {
        for (let y = 0; y < this._height; y++) {
            for (let x = this._width - 1; x >= 0; x--) {
                let location = this.getLocation(x, y);
                let coord = this.getDrawCoord(x, y, 0);
                let newCoord = new Point(coord.x + camera.x, coord.y + camera.y);
                gfx.render(newCoord, location.spriteId);
            }
        }
    }
    addRaisedLocation(x, y, z) {
        let location = new Location(false, x, y, z, this._ids);
        this._ids++;
        this._raisedLocations.push(location);
        this._raisedLocations.sort((a, b) => {
            if (a.z < b.z) {
                return 1;
            }
            else if (b.z < a.z) {
                return -1;
            }
            if (a.x < b.x) {
                return 1;
            }
            else if (b.x < a.x) {
                return -1;
            }
            return 0;
        });
        return location;
    }
}
export class CartisanGrid extends SquareGrid {
    getDrawCoord(x, y, z) {
        let width = this._tileWidth;
        let height = this._tileHeight;
        return new Point(x * width, (y * height) - (z * height));
    }
    renderFloor(camera, gfx) {
        for (let y = 0; y < this._height; y++) {
            for (let x = 0; x < this._width; x++) {
                let location = this.getLocation(x, y);
                let coord = this.getDrawCoord(x, y, 0);
                let newCoord = new Point(coord.x + camera.x, coord.y + camera.y);
                gfx.render(newCoord, location.spriteId);
            }
        }
    }
    addRaisedLocation(x, y, z) {
        let location = new Location(false, x, y, z, this._ids);
        this._ids++;
        this._raisedLocations.push(location);
        this._raisedLocations.sort((a, b) => {
            if (a.z < b.z) {
                return 1;
            }
            else if (b.z < a.z) {
                return -1;
            }
            if (a.y < b.y) {
                return 1;
            }
            else if (b.y < a.y) {
                return -1;
            }
            return 0;
        });
        return location;
    }
}
