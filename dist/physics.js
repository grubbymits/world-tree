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
    return "error";
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
export function getDirection(from, to) {
    let xDiff = from.x - to.x;
    let yDiff = from.y - to.y;
    if (xDiff < 0 && yDiff < 0) {
        return Direction.NorthWest;
    }
    else if (xDiff == 0 && yDiff < 0) {
        return Direction.North;
    }
    else if (xDiff > 0 && yDiff < 0) {
        return Direction.NorthEast;
    }
    else if (xDiff < 0 && yDiff == 0) {
        return Direction.West;
    }
    else if (xDiff > 0 && yDiff == 0) {
        return Direction.East;
    }
    else if (xDiff < 0 && yDiff > 0) {
        return Direction.SouthWest;
    }
    else if (xDiff == 0 && yDiff > 0) {
        return Direction.South;
    }
    console.assert(xDiff > 0 && yDiff > 0, "unhandled direction", xDiff, yDiff);
    return Direction.SouthEast;
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
export class IsometricPhysicalDimensions extends Dimensions {
    constructor(spriteWidth, relativeDims) {
        let width = IsometricPhysicalDimensions.physicalWidth(spriteWidth);
        let depth = IsometricPhysicalDimensions.physicalDepth(width, relativeDims);
        let height = IsometricPhysicalDimensions.physicalHeight(width, relativeDims);
        super(width, depth, height);
    }
    static physicalWidth(spriteWidth) {
        return Math.floor(spriteWidth * this._widthRatio);
    }
    static physicalDepth(physicalWidth, relativeDims) {
        let depthRatio = relativeDims.depth / relativeDims.width;
        return Math.floor(physicalWidth * depthRatio);
    }
    static physicalHeight(physicalWidth, relativeDims) {
        let heightRatio = relativeDims.height / relativeDims.width;
        return Math.floor(physicalWidth * heightRatio);
    }
}
IsometricPhysicalDimensions._widthRatio = 1 / Math.sqrt(3);
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
export class BoundingCuboid {
    constructor(_centre, _dimensions) {
        this._centre = _centre;
        this._dimensions = _dimensions;
        this.updateLocation(_centre);
    }
    get minLocation() { return this._minLocation; }
    get maxLocation() { return this._maxLocation; }
    get centre() { return this._centre; }
    get width() { return this._dimensions.width; }
    get depth() { return this._dimensions.depth; }
    get height() { return this._dimensions.height; }
    updateLocation(centre) {
        this._centre = centre;
        let width = Math.floor(this.width / 2);
        let depth = Math.floor(this.depth / 2);
        let height = Math.floor(this.height / 2);
        let x = centre.x - width;
        let y = centre.y - depth;
        let z = centre.z - height;
        this._minLocation = new Location(x, y, z);
        x = centre.x + width;
        y = centre.y + depth;
        z = centre.z + height;
        this._maxLocation = new Location(x, y, z);
    }
    contains(location) {
        if (location.x < this._minLocation.x ||
            location.y < this._minLocation.y ||
            location.z < this._minLocation.z)
            return false;
        if (location.x > this._maxLocation.x ||
            location.y > this._maxLocation.y ||
            location.z > this._maxLocation.z)
            return false;
        return true;
    }
    containsBounds(other) {
        return this.contains(other.minLocation) &&
            this.contains(other.maxLocation);
    }
    intersects(other) {
        if (other.minLocation.x > this.maxLocation.x ||
            other.maxLocation.x < this.minLocation.x)
            return false;
        if (other.minLocation.y > this.maxLocation.y ||
            other.maxLocation.y < this.minLocation.y)
            return false;
        if (other.minLocation.z > this.maxLocation.z ||
            other.maxLocation.z < this.minLocation.z)
            return false;
        return true;
    }
    insert(other) {
        if (this.containsBounds(other)) {
            return;
        }
        let minX = other.minLocation.x < this.minLocation.x ?
            other.minLocation.x : this.minLocation.x;
        let minY = other.minLocation.y < this.minLocation.y ?
            other.minLocation.y : this.minLocation.y;
        let minZ = other.minLocation.z < this.minLocation.z ?
            other.minLocation.z : this.minLocation.z;
        let maxX = other.maxLocation.x > this.maxLocation.x ?
            other.maxLocation.x : this.maxLocation.x;
        let maxY = other.maxLocation.y > this.maxLocation.y ?
            other.maxLocation.y : this.maxLocation.y;
        let maxZ = other.maxLocation.z > this.maxLocation.z ?
            other.maxLocation.z : this.maxLocation.z;
        this._dimensions =
            new Dimensions(maxX - minX, maxY - minY, maxZ - minZ);
        let min = new Location(minX, minY, minZ);
        let max = new Location(maxX, maxY, maxZ);
        let width = Math.floor((max.x - min.x) / 2);
        let depth = Math.floor((max.y - min.y) / 2);
        let height = Math.floor((max.z - min.z) / 2);
        this._centre = new Location(min.x + width, min.y + depth, min.z + height);
        this._minLocation = min;
        this._maxLocation = max;
    }
    dump() {
        console.log("BoundingCuboid");
        console.log(" - min (x,y,z):", this.minLocation.x, this.minLocation.y, this.minLocation.z);
        console.log(" - max (x,y,z):", this.maxLocation.x, this.maxLocation.y, this.maxLocation.z);
        console.log(" - centre (x,y,z):", this.centre.x, this.centre.y, this.centre.z);
        console.log(" - dimensions (WxDxH):", this.width, this.depth, this.height);
    }
}
