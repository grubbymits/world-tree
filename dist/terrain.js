import { Location, GameObject } from "./entity.js";
export var TerrainType;
(function (TerrainType) {
    TerrainType[TerrainType["Flat"] = 0] = "Flat";
    TerrainType[TerrainType["RampUpNorth"] = 1] = "RampUpNorth";
    TerrainType[TerrainType["RampUpEast"] = 2] = "RampUpEast";
    TerrainType[TerrainType["RampUpSouth"] = 3] = "RampUpSouth";
    TerrainType[TerrainType["RampUpWest"] = 4] = "RampUpWest";
})(TerrainType || (TerrainType = {}));
class MovementCost {
    constructor(_terrain, _cost) {
        this._terrain = _terrain;
        this._cost = _cost;
    }
    get terrain() { return this._terrain; }
    get location() { return this._terrain.location; }
    get cost() { return this._cost; }
}
export class Terrain extends GameObject {
    constructor(_gridX, _gridY, _gridZ, _type, graphics) {
        super(new Location(_gridX * Terrain.tileWidth, _gridY * Terrain.tileDepth, _gridZ * Terrain.tileHeight), Terrain._tileWidth, Terrain._tileDepth, Terrain._tileHeight, true, graphics);
        this._gridX = _gridX;
        this._gridY = _gridY;
        this._gridZ = _gridZ;
        this._type = _type;
    }
    static init(width, depth, height) {
        this._tileWidth = width;
        this._tileDepth = depth;
        this._tileHeight = height;
    }
    static get tileWidth() {
        return this._tileWidth;
    }
    static get tileHeight() {
        return this._tileHeight;
    }
    static get tileDepth() {
        return this._tileDepth;
    }
    static scaleLocation(loc) {
        return new Location(Math.floor(loc.x / this.tileWidth), Math.floor(loc.y / this.tileDepth), Math.floor(loc.z / this.tileHeight));
    }
    static isBlocked(toTerrain, fromTerrain) {
        let toLoc = Terrain.scaleLocation(toTerrain.location);
        let fromLoc = Terrain.scaleLocation(fromTerrain.location);
        if ((toTerrain.type == fromTerrain.type) &&
            (toTerrain.type == TerrainType.Flat)) {
            return fromLoc.z == toLoc.z;
        }
        else if (fromLoc.z == toLoc.z || Math.abs(fromLoc.z - toLoc.z) > 1) {
            return false;
        }
        switch (toTerrain.type) {
            case TerrainType.RampUpNorth:
            case TerrainType.RampUpSouth:
                return fromLoc.x == toLoc.x && Math.abs(fromLoc.y - toLoc.y) == 1;
            case TerrainType.RampUpEast:
            case TerrainType.RampUpWest:
                return fromLoc.y == toLoc.y && Math.abs(fromLoc.x - toLoc.x) == 1;
        }
        return false;
    }
    static findPath(begin, end, map) {
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
            let neighbours = map.getNeighbours(current.terrain);
            for (let next of neighbours) {
                let newCost = costSoFar.get(current.terrain.id) +
                    map.getNeighbourCost(current.terrain, next);
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
            step = map.getTerrainFromId(cameFrom.get(step.id));
            path.push(step);
        }
        path.reverse();
        return path.splice(1);
    }
    get type() {
        return this._type;
    }
}
