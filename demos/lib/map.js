import { Direction, getDirectionFromPoints, getOppositeDirection } from "./physics.js";
import { Point2D } from "./geometry.js";
import { Terrain, TerrainFeature, isFlat, isRampUp } from "./terrain.js";
export class SquareGrid {
    constructor(_context, _width, _depth) {
        this._context = _context;
        this._width = _width;
        this._depth = _depth;
        this._neighbourOffsets = [new Point2D(-1, -1), new Point2D(0, -1), new Point2D(1, -1),
            new Point2D(-1, 0), new Point2D(1, 0),
            new Point2D(-1, 1), new Point2D(0, 1), new Point2D(1, 1),];
        this._totalSurface = 0;
        this._totalSubSurface = 0;
        this._surfaceTerrain = new Array();
        for (let y = 0; y < _depth; ++y) {
            this._surfaceTerrain.push(new Array(_width));
        }
    }
    get width() { return this._width; }
    get depth() { return this._depth; }
    get totalSurface() { return this._totalSurface; }
    get totalSubSurface() { return this._totalSubSurface; }
    get surfaceTerrain() { return this._surfaceTerrain; }
    addSurfaceTerrain(x, y, z, ty, shape, feature) {
        let terrain = Terrain.create(this._context, x, y, z, ty, shape, feature);
        this.surfaceTerrain[y][x] = terrain;
        this._totalSurface++;
    }
    addSubSurfaceTerrain(x, y, z, ty, shape) {
        console.assert(this.getSurfaceTerrainAt(x, y).z > z, "adding sub-surface terrain which is above surface!");
        Terrain.create(this._context, x, y, z, ty, shape, TerrainFeature.None);
        this._totalSubSurface++;
    }
    getSurfaceTerrainAt(x, y) {
        if ((x < 0 || x >= this.width) ||
            (y < 0 || y >= this.depth)) {
            return null;
        }
        return this.surfaceTerrain[y][x];
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
        for (let offset of this._neighbourOffsets) {
            let neighbour = this.getSurfaceTerrainAt(centre.x + offset.x, centre.y + offset.y);
            if (!neighbour) {
                continue;
            }
            neighbours.push(neighbour);
        }
        return neighbours;
    }
    getAccessibleNeighbours(centre) {
        let neighbours = this.getNeighbours(centre);
        let centrePoint = new Point2D(centre.x, centre.y);
        return neighbours.filter(function (to) {
            console.assert(Math.abs(centre.z - to.z) <= 1, "can only handle neighbours separated by 1 terrace max");
            let toPoint = new Point2D(to.x, to.y);
            let direction = getDirectionFromPoints(centrePoint, toPoint);
            console.assert(direction == Direction.North ||
                direction == Direction.East ||
                direction == Direction.South ||
                direction == Direction.West);
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
}
