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
export class GameMap {
    constructor(_width, _height) {
        this._width = _width;
        this._height = _height;
        this._ids = 0;
    }
    findPath(begin, end) {
        let path = new Array();
        if (end.blocked)
            return path;
        // Adapted from:
        // http://www.redblobgames.com/pathfinding/a-star/introduction.html
        let frontier = new Array();
        let cameFrom = new Map();
        let costSoFar = new Map();
        cameFrom.set(begin, null);
        costSoFar.set(begin, 0);
        // frontier is a sorted list of locations with their lowest cost
        frontier.push(new LocationCost(begin, 0));
        let current = frontier[0];
        // breadth-first search
        while (frontier.length > 0) {
            current = frontier.shift();
            // Found!
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
        // Search has ended...
        if (current.id != end.id) {
            console.log("Could not find a path...");
            return path;
        }
        // finalise the path.
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
export class SquareGrid extends GameMap {
    constructor(width, height) {
        super(width, height);
        this._neighbourOffsets = [new Point(-1, -1), new Point(0, -1), new Point(1, -1),
            new Point(-1, 0), new Point(1, 0),
            new Point(-1, 1), new Point(0, 1), new Point(1, 1),];
        // The key is the location id on one of the floor tiles. The value is
        // another map, indexed by the height 'z' and returns a location.
        this._depthMap = new Map();
        this._locations = new Array();
        for (let x = 0; x < this._width; x++) {
            this._locations[x] = new Array();
            for (let y = 0; y < this._height; y++) {
                this._locations[x].push(new Location(false, x, y, 0, this._ids));
                this._ids++;
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
    getOrAddRaisedLocation(x, y, z) {
        let location = this.getLocation(x, y);
        if (this._depthMap.has(location.id)) {
            let locationMap = this._depthMap[location.id];
            if (locationMap.has(z)) {
                return locationMap[z];
            }
            else {
                locationMap[z] = new Location(false, x, y, z, this._ids);
                this._ids++;
                return locationMap[z];
            }
        }
        // Create new entry.
        this._depthMap[location.id] = new Map();
        this._depthMap[location.id][z] = new Location(false, x, y, z, this._ids);
        this._ids++;
        return this._depthMap[location.id][z];
    }
    getLocation(x, y) {
        return this._locations[x][y];
    }
    getNeighbourCost(centre, to) {
        // If a horizontal, or vertical, move cost 1 then a diagonal move would be
        // 1.444... So scale by 2 and round.
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
    getDrawCoord(cellX, cellY, cellZ, width, height, sys) {
        switch (sys) {
            default:
                throw ("Unhandled coordinate system");
            case CoordSystem.Cartisan:
                return new Point(cellX * width, (cellY * height) - (cellZ * height));
            case CoordSystem.Isometric:
                return SquareGrid.convertToIsometric(cellX, cellY, width, height);
        }
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
