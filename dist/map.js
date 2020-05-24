import { Terrain } from "./terrain.js";
import { Point } from "./graphics.js";
export class SquareGrid {
    constructor(_width, _height) {
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
        let terrain = Terrain.create(x, y, z, type, shape, feature);
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
