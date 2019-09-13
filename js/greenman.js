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
    constructor(_width, _height, _tileWidth, _tileHeight) {
        this._width = _width;
        this._height = _height;
        this._tileWidth = _tileWidth;
        this._tileHeight = _tileHeight;
        this._ids = 0;
        this._raisedLocations = new Array();
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
    constructor(width, height, tileWidth, tileHeight) {
        super(width, height, tileWidth, tileHeight);
        this._neighbourOffsets = [new Point(-1, -1), new Point(0, -1), new Point(1, -1),
            new Point(-1, 0), new Point(1, 0),
            new Point(-1, 1), new Point(0, 1), new Point(1, 1),];
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
    addRaisedLocation(x, y, z) {
        let location = new Location(false, x, y, z, this._ids);
        this._raisedLocations.push(location);
        this._ids++;
        // We're drawing a 2D map, so depth is being simulated by the position on
        // the Y axis and the order in which those elements are drawn. Insert
        // the new location and sort the array by draw order.
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
    getLocation(x, y) {
        return this._locations[x][y];
    }
    get raisedLocations() {
        return this._raisedLocations;
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
    getDrawCoord(x, y, z, sys) {
        let width = this._tileWidth;
        let height = this._tileHeight;
        switch (sys) {
            default:
                throw ("Unhandled coordinate system");
            case CoordSystem.Cartisan:
                return new Point(x * width, (y * height) - (z * height));
            case CoordSystem.Isometric:
                return SquareGrid.convertToIsometric(x, y, width, height);
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
export class SpriteSheet {
    constructor(name) {
        this._image = new Image();
        if (name) {
            this._image.src = name + ".png";
        }
        else {
            throw new Error("No filename passed");
        }
        console.log("load", name);
    }
    get image() {
        return this._image;
    }
}
export class Sprite {
    constructor(_sheet, _offsetX, _offsetY, _width, _height) {
        this._sheet = _sheet;
        this._offsetX = _offsetX;
        this._offsetY = _offsetY;
        this._width = _width;
        this._height = _height;
    }
    render(coord, ctx) {
        ctx.drawImage(this._sheet.image, this._offsetX, this._offsetY, this._width, this._height, coord.x, coord.y, this._width, this._height);
    }
}
export class Renderer {
    constructor(_ctx, _width, _height, _sprites) {
        this._ctx = _ctx;
        this._width = _width;
        this._height = _height;
        this._sprites = _sprites;
    }
    clear() {
        this._ctx.fillStyle = '#000000';
        this._ctx.fillRect(0, 0, this._width, this._height);
    }
    render(coord, id) {
        this._sprites[id].render(coord, this._ctx);
    }
}
export function renderRaised(gameMap, camera, sys, gfx) {
    let locations = gameMap.raisedLocations;
    if (sys == CoordSystem.Cartisan) {
        for (let i in locations) {
            let location = locations[i];
            let coord = gameMap.getDrawCoord(location.x, location.y, 0, sys);
            let newCoord = new Point(coord.x + camera.x, coord.y + camera.y);
            gfx.render(newCoord, location.spriteId);
        }
    }
}
export function renderFloor(gameMap, camera, sys, gfx) {
    if (sys == CoordSystem.Cartisan) {
        for (let y = 0; y < gameMap.height; y++) {
            for (let x = 0; x < gameMap.width; x++) {
                let location = gameMap.getLocation(x, y);
                let coord = gameMap.getDrawCoord(x, y, 0, sys);
                let newCoord = new Point(coord.x + camera.x, coord.y + camera.y);
                gfx.render(newCoord, location.spriteId);
            }
        }
    }
    else if (sys == CoordSystem.Isometric) {
        for (let y = 0; y < gameMap.height; y++) {
            for (let x = gameMap.width - 1; x >= 0; x--) {
                let location = gameMap.getLocation(x, y);
                let coord = gameMap.getDrawCoord(x, y, 0, sys);
                let newCoord = new Point(coord.x + camera.x, coord.y + camera.y);
                gfx.render(newCoord, location.spriteId);
            }
        }
    }
    else {
        throw ("invalid coordinate system");
    }
}
