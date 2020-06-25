import { getDirection, getOppositeDirection } from "./physics.js";
import { Terrain, isFlat, isRampUp } from "./terrain.js";
import { Point } from "./graphics.js";
class MovementCost {
    constructor(_terrain, _cost) {
        this._terrain = _terrain;
        this._cost = _cost;
    }
    get terrain() { return this._terrain; }
    get location() { return this._terrain.location; }
    get cost() { return this._cost; }
}
export class SquareGrid {
    constructor(_context, _width, _height) {
        this._context = _context;
        this._width = _width;
        this._height = _height;
        this._neighbourOffsets = [new Point(-1, -1), new Point(0, -1), new Point(1, -1),
            new Point(-1, 0), new Point(1, 0),
            new Point(-1, 1), new Point(0, 1), new Point(1, 1),];
        this._raisedTerrain = new Map();
        this._allTerrain = new Map();
        console.log("creating map", _width, _height);
    }
    get width() { return this._width; }
    get height() { return this._height; }
    addRaisedTerrain(x, y, z, type, shape, feature) {
        let terrain = Terrain.create(this._context, x, y, z, type, shape, feature);
        if (!this._raisedTerrain.has(x)) {
            this._raisedTerrain.set(x, new Map());
            this._raisedTerrain.get(x).set(y, new Array());
            this._raisedTerrain.get(x).get(y).push(terrain);
        }
        else {
            if (this._raisedTerrain.get(x).has(y)) {
                this._raisedTerrain.get(x).get(y).push(terrain);
            }
            else {
                this._raisedTerrain.get(x).set(y, new Array());
                this._raisedTerrain.get(x).get(y).push(terrain);
            }
        }
        this._allTerrain.set(terrain.id, terrain);
    }
    get allTerrain() {
        return this._allTerrain;
    }
    getTerrain(x, y, z) {
        if ((x < 0 || x >= this.width) ||
            (y < 0 || y >= this.height) ||
            (z < 0)) {
            console.log("SquareGrid: terrain coordinates out-of-range");
            return null;
        }
        let raised = this._raisedTerrain.get(x).get(y);
        for (let terrain of raised) {
            if (terrain.gridZ == z) {
                return terrain;
            }
        }
        return null;
    }
    getTerrainFromId(id) {
        return this._allTerrain.get(id);
    }
    getNeighbourCost(centre, to) {
        let cost = centre.x == to.x || centre.y == to.y ? 2 : 3;
        if (isFlat(centre.shape) && isFlat(to.shape)) {
            return cost;
        }
        return centre.z == to.z ? cost : cost * 2;
    }
    getNeighbours(centre) {
        let neighbours = new Array();
        for (let z of [-1, 0, 1]) {
            for (let offset of this._neighbourOffsets) {
                let neighbour = this.getTerrain(centre.x + offset.x, centre.y + offset.y, centre.z + z);
                if (!neighbour) {
                    continue;
                }
                neighbours.push(neighbour);
            }
        }
        return neighbours;
    }
    getAccessibleNeighbours(centre) {
        let neighbours = this.getNeighbours(centre);
        let centrePoint = new Point(centre.x, centre.y);
        return neighbours.filter(function (to) {
            console.assert(Math.abs(centre.z - to.z) <= 1, "can only handle neighbours separated by 1 terrace max");
            let toPoint = new Point(to.x, to.y);
            let direction = getDirection(centrePoint, toPoint);
            let oppositeDir = getOppositeDirection(direction);
            if (to.z == centre.z) {
                return true;
            }
            else if (to.z > centre.z) {
                return !isRampUp(centre.shape, direction) && isRampUp(to.shape, direction);
            }
            else if (to.z < centre.z) {
                return !isRampUp(centre.shape, oppositeDir) && isRampUp(to.shape, oppositeDir);
            }
            return false;
        });
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
            let neighbours = this.getAccessibleNeighbours(current.terrain);
            for (let next of neighbours) {
                let newCost = costSoFar.get(current.terrain.id) +
                    this.getNeighbourCost(current.terrain, next);
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
            step = this.getTerrainFromId(cameFrom.get(step.id));
            path.push(step);
        }
        path.reverse();
        return path.splice(1);
    }
}
