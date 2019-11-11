import { TerrainShape, Terrain } from "./terrain.js";
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
