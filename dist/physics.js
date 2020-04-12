import { TerrainShape, Terrain } from "./terrain.js";
import { Point } from "./graphics.js";
export var Direction;
(function (Direction) {
    Direction[Direction["North"] = 0] = "North";
    Direction[Direction["NorthEast"] = 1] = "NorthEast";
    Direction[Direction["East"] = 2] = "East";
    Direction[Direction["SouthEast"] = 3] = "SouthEast";
    Direction[Direction["South"] = 4] = "South";
    Direction[Direction["SouthWest"] = 5] = "SouthWest";
    Direction[Direction["West"] = 6] = "West";
    Direction[Direction["NorthWest"] = 7] = "NorthWest";
    Direction[Direction["Max"] = 8] = "Max";
})(Direction || (Direction = {}));
export function getDirectionName(direction) {
    switch (direction) {
        default:
            break;
        case Direction.North:
            return "north";
        case Direction.NorthEast:
            return "north east";
        case Direction.East:
            return "east";
        case Direction.SouthEast:
            return "south east";
        case Direction.South:
            return "south";
        case Direction.SouthWest:
            return "south west";
        case Direction.West:
            return "west";
        case Direction.NorthWest:
            return "north west";
    }
    console.error("unhandled direction when getting name");
    return "";
}
export function getDirectionCoords(x, y, direction) {
    let xDiff = 0;
    let yDiff = 0;
    switch (direction) {
        default:
            console.error("unhandled cloud direction");
            break;
        case Direction.North:
            yDiff = -1;
            break;
        case Direction.NorthEast:
            xDiff = 1;
            yDiff = -1;
            break;
        case Direction.East:
            xDiff = 1;
            break;
        case Direction.SouthEast:
            xDiff = 1;
            yDiff = 1;
            break;
        case Direction.South:
            yDiff = 1;
            break;
        case Direction.SouthWest:
            xDiff = -1;
            yDiff = 1;
            break;
        case Direction.West:
            xDiff = -1;
            break;
        case Direction.NorthWest:
            xDiff = -1;
            yDiff = -1;
            break;
    }
    return new Point(x + xDiff, y + yDiff);
}
export class Location {
    constructor(_x, _y, _z) {
        this._x = _x;
        this._y = _y;
        this._z = _z;
    }
    get x() { return this._x; }
    get y() { return this._y; }
    get z() { return this._z; }
}
export class Dimensions {
    constructor(_width, _depth, _height) {
        this._width = _width;
        this._depth = _depth;
        this._height = _height;
    }
    get width() { return this._width; }
    get depth() { return this._depth; }
    get height() { return this._height; }
}
export class CartisanDimensionsFromSprite extends Dimensions {
    constructor(spriteWidth, spriteHeight, heightRatio) {
        let height = spriteHeight * heightRatio;
        let depth = spriteHeight - height;
        super(spriteWidth, depth, height);
    }
}
export class IsometricDimensionsFromSprite extends Dimensions {
    constructor(spriteWidth, spriteHeight, heightRatio) {
        let widthRatio = Math.sqrt(3);
        let width = Math.floor(spriteWidth / widthRatio);
        let depth = width;
        let height = Math.floor((spriteWidth / widthRatio) * heightRatio);
        super(width, depth, height);
    }
}
class MovementCost {
    constructor(_terrain, _cost) {
        this._terrain = _terrain;
        this._cost = _cost;
    }
    get terrain() { return this._terrain; }
    get location() { return this._terrain.location; }
    get cost() { return this._cost; }
}
export class PathFinder {
    constructor(_map, _objects) {
        this._map = _map;
        this._objects = _objects;
    }
    static isBlocked(toTerrain, fromTerrain) {
        let toLoc = Terrain.scaleLocation(toTerrain.location);
        let fromLoc = Terrain.scaleLocation(fromTerrain.location);
        if ((toTerrain.shape == fromTerrain.shape) &&
            (toTerrain.shape == TerrainShape.Flat)) {
            return fromLoc.z == toLoc.z;
        }
        else if (fromLoc.z == toLoc.z || Math.abs(fromLoc.z - toLoc.z) > 1) {
            return false;
        }
        switch (toTerrain.shape) {
            case TerrainShape.RampUpNorth:
            case TerrainShape.RampUpSouth:
                return fromLoc.x == toLoc.x && Math.abs(fromLoc.y - toLoc.y) == 1;
            case TerrainShape.RampUpEast:
            case TerrainShape.RampUpWest:
                return fromLoc.y == toLoc.y && Math.abs(fromLoc.x - toLoc.x) == 1;
        }
        return false;
    }
    findPath(begin, end) {
        let path = new Array();
        let frontier = new Array();
        let cameFrom = new Map();
        let costSoFar = new Map();
        cameFrom.set(begin.id, 0);
        costSoFar.set(begin.id, 0);
        frontier.push(new MovementCost(begin, 0));
        let current = frontier[0];
        while (frontier.length > 0) {
            current = frontier.shift();
            if (current.terrain.id == end.id) {
                break;
            }
            let neighbours = this._map.getNeighbours(current.terrain);
            for (let next of neighbours) {
                let newCost = costSoFar.get(current.terrain.id) +
                    this._map.getNeighbourCost(current.terrain, next);
                if (!costSoFar.has(next.id) || newCost < costSoFar.get(next.id)) {
                    frontier.push(new MovementCost(next, newCost));
                    costSoFar.set(next.id, newCost);
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
                    cameFrom.set(next.id, current.terrain.id);
                }
            }
        }
        if (current.terrain.id != end.id) {
            console.log("Could not find a path...");
            return path;
        }
        let step = end;
        path.push(step);
        while (step.id != begin.id) {
            step = this._map.getTerrainFromId(cameFrom.get(step.id));
            path.push(step);
        }
        path.reverse();
        return path.splice(1);
    }
}
