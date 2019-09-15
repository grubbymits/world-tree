import { Drawable } from "./gfx.js";
export var CoordSystem;
(function (CoordSystem) {
    CoordSystem[CoordSystem["Cartisan"] = 0] = "Cartisan";
    CoordSystem[CoordSystem["Isometric"] = 1] = "Isometric";
})(CoordSystem || (CoordSystem = {}));
export class Point {
    constructor(_x, _y) {
        this._x = _x;
        this._y = _y;
    }
    get x() { return this._x; }
    get y() { return this._y; }
}
export class Location extends Drawable {
    constructor(_blocking, x, y, z, _id) {
        super(x, y, z);
        this._blocking = _blocking;
        this._id = _id;
        this._spriteId = 0;
    }
    get id() {
        return this._id;
    }
    get blocked() {
        return this._blocking;
    }
}
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
    constructor(_width, _height) {
        this._width = _width;
        this._height = _height;
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
    addRaisedLocation(x, y, z) {
        let location = new Location(false, x, y, z, this._ids);
        this._ids++;
        this._raisedLocations.push(location);
        return location;
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
}
