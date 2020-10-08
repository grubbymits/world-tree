import { Point } from "./graphics.js";
import { Point3D } from "./geometry.js";
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
export function getOppositeDirection(direction) {
    switch (direction) {
        default:
            break;
        case Direction.NorthEast:
            return Direction.SouthWest;
        case Direction.East:
            return Direction.West;
        case Direction.SouthEast:
            return Direction.NorthWest;
        case Direction.South:
            return Direction.North;
        case Direction.SouthWest:
            return Direction.NorthEast;
        case Direction.West:
            return Direction.East;
        case Direction.NorthWest:
            return Direction.SouthEast;
    }
    console.assert(direction == Direction.North, "unhandled direction");
    return Direction.North;
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
export class BoundingCuboid {
    constructor(_centre, _dimensions) {
        this._centre = _centre;
        this._dimensions = _dimensions;
        this.centre = _centre;
    }
    get minLocation() { return this._minLocation; }
    get minX() { return this.minLocation.x; }
    get minY() { return this.minLocation.y; }
    get minZ() { return this.minLocation.z; }
    get maxLocation() { return this._maxLocation; }
    get maxX() { return this.maxLocation.x; }
    get maxY() { return this.maxLocation.y; }
    get maxZ() { return this.maxLocation.z; }
    get centre() { return this._centre; }
    get bottomCentre() { return this._bottomCentre; }
    get width() { return this._dimensions.width; }
    get depth() { return this._dimensions.depth; }
    get height() { return this._dimensions.height; }
    get dimensions() { return this._dimensions; }
    set centre(centre) {
        this._centre = centre;
        let width = Math.floor(this.width / 2);
        let depth = Math.floor(this.depth / 2);
        let height = Math.floor(this.height / 2);
        let x = centre.x - width;
        let y = centre.y - depth;
        let z = centre.z - height;
        this._bottomCentre = new Point3D(centre.x, centre.y, z);
        this._minLocation = new Point3D(x, y, z);
        x = centre.x + width;
        y = centre.y + depth;
        z = centre.z + height;
        this._maxLocation = new Point3D(x, y, z);
    }
    update(d) {
        this._centre = this._centre.add(d);
        this._minLocation = this._minLocation.add(d);
        this._maxLocation = this._maxLocation.add(d);
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
        let min = new Point3D(minX, minY, minZ);
        let max = new Point3D(maxX, maxY, maxZ);
        let width = Math.floor((max.x - min.x) / 2);
        let depth = Math.floor((max.y - min.y) / 2);
        let height = Math.floor((max.z - min.z) / 2);
        this._centre = new Point3D(min.x + width, min.y + depth, min.z + height);
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
export class CollisionDetector {
    constructor(_spatialInfo) {
        this._spatialInfo = _spatialInfo;
    }
    detectInArea(actor, path, area) {
        let bounds = actor.bounds;
        const endMinLocation = bounds.minLocation.add(path);
        const endMaxLocation = bounds.maxLocation.add(path);
        let entities = this._spatialInfo.getEntities(area);
        for (let entity of entities) {
            if (entity.id == actor.id) {
                continue;
            }
            const geometry = entity.geometry;
            if (geometry.obstructs(actor.bounds.minLocation, endMinLocation) ||
                geometry.obstructs(actor.bounds.minLocation, endMaxLocation) ||
                geometry.obstructs(actor.bounds.maxLocation, endMaxLocation) ||
                geometry.obstructs(actor.bounds.maxLocation, endMinLocation)) {
                console.log("actor at", actor.bounds.minLocation);
                console.log("obstructed by entity at", entity.bounds.minLocation);
                return true;
            }
        }
        return false;
    }
}
