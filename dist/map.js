import { Terrain } from "./entity.js";
export class Point {
    constructor(_x, _y) {
        this._x = _x;
        this._y = _y;
    }
    get x() { return this._x; }
    get y() { return this._y; }
}
class LocationCost {
    constructor(_location, _cost) {
        this._location = _location;
        this._cost = _cost;
    }
    get location() { return this._location; }
    get cost() { return this._cost; }
}
export class SquareGrid {
    constructor(_width, _height, tileWidth, tileDepth, tileHeight, component) {
        this._width = _width;
        this._height = _height;
        this._neighbourOffsets = [new Point(-1, -1), new Point(0, -1), new Point(1, -1),
            new Point(-1, 0), new Point(1, 0),
            new Point(-1, 1), new Point(0, 1), new Point(1, 1),];
        this._raisedTerrain = new Array();
        this._floor = new Array();
        Terrain.init(tileWidth, tileDepth, tileHeight);
        console.log("creating map", _width, _height);
        for (let x = 0; x < this._width; x++) {
            this._floor[x] = new Array();
            for (let y = 0; y < this._height; y++) {
                this._floor[x].push(new Terrain(x, y, 0, component));
            }
        }
    }
    get width() {
        return this._width;
    }
    get height() {
        return this._height;
    }
    get raisedTerrain() {
        return this._raisedTerrain;
    }
    addRaisedTerrain(x, y, z, component) {
        let terrain = new Terrain(x, y, z, component);
        this._raisedTerrain.push(terrain);
        return terrain;
    }
    getFloor(x, y) {
        return this._floor[x][y];
    }
    getLocation(x, y) {
        return this._floor[x][y].location;
    }
    getNeighbourCost(centre, to) {
        if ((centre.x == to.x) || (centre.y == to.y)) {
            return centre.z == to.z ? 2 : 4;
        }
        return centre.z == to.z ? 3 : 6;
    }
    getNeighbours(centre) {
        let neighbours = new Array();
        for (let offset of this._neighbourOffsets) {
            let neighbour = this.getLocation(centre.x + offset.x, centre.y + offset.y);
            neighbours.push(neighbour);
        }
        return neighbours;
    }
    isBlocked(loc) {
        return this._floor[loc.x][loc.y].blocking;
    }
    objectId(loc) {
        return this._floor[loc.x][loc.y].id;
    }
    findPath(begin, end) {
        let path = new Array();
        if (this.isBlocked(end))
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
            if (this.objectId(current.location) == this.objectId(end)) {
                break;
            }
            let neighbours = this.getNeighbours(current.location);
            for (let next of neighbours) {
                let newCost = costSoFar.get(this.objectId(current.location)) +
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
        if (this.objectId(current.location) != this.objectId(end)) {
            console.log("Could not find a path...");
            return path;
        }
        let step = end;
        path.push(step);
        while (this.objectId(step) != this.objectId(begin)) {
            step = cameFrom.get(step);
            path.push(step);
        }
        path.reverse();
        return path.splice(1);
    }
}
