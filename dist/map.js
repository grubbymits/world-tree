import { Terrain } from "./terrain.js";
export class Point {
    constructor(_x, _y) {
        this._x = _x;
        this._y = _y;
    }
    get x() { return this._x; }
    get y() { return this._y; }
}
export class SquareGrid {
    constructor(_width, _height) {
        this._width = _width;
        this._height = _height;
        this._neighbourOffsets = [new Point(-1, -1), new Point(0, -1), new Point(1, -1),
            new Point(-1, 0), new Point(1, 0),
            new Point(-1, 1), new Point(0, 1), new Point(1, 1),];
        this._raisedTerrain = new Map();
        this._floor = new Array();
        this._allTerrain = new Map();
        console.log("creating map", _width, _height);
        for (let x = 0; x < this._width; x++) {
            this._floor[x] = new Array();
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
    addRaisedTerrain(x, y, z, type, shape) {
        let terrain = new Terrain(x, y, z, type, shape);
        if (!this._raisedTerrain.has(x)) {
            this._raisedTerrain[x] = new Map();
            this._raisedTerrain[x][y] = new Array();
            this._raisedTerrain[x][y].push(terrain);
        }
        else {
            if (this._raisedTerrain[x].has(y)) {
                this._raisedTerrain[x][y].push(terrain);
            }
            else {
                this._raisedTerrain[x][y] = new Array();
                this._raisedTerrain[x][y].push(terrain);
            }
        }
        this._allTerrain.set(terrain.id, terrain);
    }
    getFloor(x, y) {
        return this._floor[x][y];
    }
    getTerrain(x, y, z) {
        if (x < 0 || x >= this.width) {
            return null;
        }
        if (y < 0 || y >= this.height) {
            return null;
        }
        if (z == 0) {
            return this.getFloor(x, y);
        }
        if (z < 0) {
            return null;
        }
        let raised = this._raisedTerrain[x][y];
        for (let i in raised) {
            if (raised[i].z == z) {
                return raised[i];
            }
        }
        return null;
    }
    getTerrainFromId(id) {
        return this._allTerrain.get(id);
    }
    getNeighbourCost(centre, to) {
        if ((centre.x == to.x) || (centre.y == to.y)) {
            return centre.z == to.z ? 2 : 4;
        }
        return centre.z == to.z ? 3 : 6;
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
}
