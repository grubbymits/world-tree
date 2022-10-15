import { SquareGrid } from "./map.js";
import { Terrain, TerrainShape, TerrainType, TerrainFeature, isFlat, isEdge, getTypeName } from "./terrain.js";
import { Rain } from "./weather.js";
import { Direction, getDirectionFromPoints } from "./physics.js";
import { Point2D } from "./geometry.js";
export var Biome;
(function (Biome) {
    Biome[Biome["Water"] = 0] = "Water";
    Biome[Biome["Desert"] = 1] = "Desert";
    Biome[Biome["Grassland"] = 2] = "Grassland";
    Biome[Biome["Shrubland"] = 3] = "Shrubland";
    Biome[Biome["MoistForest"] = 4] = "MoistForest";
    Biome[Biome["WetForest"] = 5] = "WetForest";
    Biome[Biome["RainForest"] = 6] = "RainForest";
    Biome[Biome["Rock"] = 7] = "Rock";
    Biome[Biome["Tundra"] = 8] = "Tundra";
    Biome[Biome["AlpineGrassland"] = 9] = "AlpineGrassland";
    Biome[Biome["AlpineMeadow"] = 10] = "AlpineMeadow";
    Biome[Biome["AlpineForest"] = 11] = "AlpineForest";
    Biome[Biome["Taiga"] = 12] = "Taiga";
})(Biome || (Biome = {}));
export function getBiomeName(biome) {
    switch (biome) {
        default:
            console.error("unhandled biome type:", biome);
        case Biome.Water:
            return "water";
        case Biome.Desert:
            return "desert";
        case Biome.Grassland:
            return "grassland";
        case Biome.Shrubland:
            return "shrubland";
        case Biome.MoistForest:
            return "moist forest";
        case Biome.WetForest:
            return "wet forest";
        case Biome.RainForest:
            return "rain forest";
        case Biome.Tundra:
            return "tundra";
        case Biome.AlpineGrassland:
            return "alpine grassland";
        case Biome.AlpineMeadow:
            return "alpine meadow";
        case Biome.AlpineForest:
            return "alpine forest";
        case Biome.Taiga:
            return "taiga";
    }
}
function mean(grid) {
    let total = 0;
    let numElements = 0;
    for (let row of grid) {
        let acc = row.reduce(function (acc, value) {
            return acc + value;
        }, 0);
        total += acc;
        numElements += row.length;
    }
    return total / numElements;
}
function meanWindow(grid, centreX, centreY, offsets) {
    let total = 0;
    let numElements = offsets.length * offsets.length;
    for (let dy in offsets) {
        let y = centreY + offsets[dy];
        for (let dx in offsets) {
            let x = centreX + offsets[dx];
            total += grid[y][x];
        }
    }
    return total / numElements;
}
function standardDevWindow(grid, centreX, centreY, offsets) {
    let avg = meanWindow(grid, centreX, centreY, offsets);
    if (avg == 0) {
        return 0;
    }
    let total = 0;
    let diffsSquared = new Array();
    let size = offsets.length;
    for (let dy in offsets) {
        let y = centreY + offsets[dy];
        let row = new Float32Array(size);
        let wx = 0;
        for (let dx in offsets) {
            let x = centreX + offsets[dx];
            let diff = grid[y][x] - avg;
            row[wx] = diff * diff;
            wx++;
        }
        diffsSquared.push(row);
    }
    return Math.sqrt(mean(diffsSquared));
}
function gaussianBlur(grid, width, depth) {
    const filterSize = 5;
    const halfSize = Math.floor(filterSize / 2);
    const offsets = [-2, -1, 0, 1, 2];
    const distancesSquared = [4, 1, 0, 1, 4];
    let result = new Array();
    for (let y = 0; y < halfSize; y++) {
        result[y] = grid[y];
    }
    for (let y = depth - halfSize; y < depth; y++) {
        result[y] = grid[y];
    }
    let filter = new Float32Array(filterSize);
    for (let y = halfSize; y < depth - halfSize; y++) {
        result[y] = new Float32Array(width);
        for (let x = 0; x < halfSize; x++) {
            result[y][x] = grid[y][x];
        }
        for (let x = width - halfSize; x < width; x++) {
            result[y][x] = grid[y][x];
        }
        for (let x = halfSize; x < width - halfSize; x++) {
            let sigma = standardDevWindow(grid, x, y, offsets);
            if (sigma == 0) {
                continue;
            }
            let sigmaSquared = sigma * sigma;
            const denominator = Math.sqrt(2 * Math.PI * sigmaSquared);
            let sum = 0;
            for (let i in distancesSquared) {
                let numerator = Math.exp(-(distancesSquared[i] / (2 * sigmaSquared)));
                filter[i] = numerator / denominator;
                sum += filter[i];
            }
            for (let coeff of filter) {
                coeff /= sum;
            }
            let blurred = 0;
            for (let i in offsets) {
                let dx = offsets[i];
                blurred += grid[y][x + dx] * filter[i];
            }
            for (let i in offsets) {
                let dy = offsets[i];
                blurred += grid[y + dy][x] * filter[i];
            }
            result[y][x] = blurred;
        }
    }
    return result;
}
class TerrainAttributes {
    constructor(_x, _y, _height) {
        this._x = _x;
        this._y = _y;
        this._height = _height;
        this._fixed = false;
        this._moisture = 0.0;
        this._biome = Biome.Water;
        this._terrace = 0;
        this._type = TerrainType.Water;
        this._shape = TerrainShape.Flat;
        this._features = TerrainFeature.None;
    }
    get x() { return this._x; }
    get y() { return this._y; }
    get pos() { return new Point2D(this._x, this._y); }
    get height() { return this._height; }
    get terrace() { return this._terrace; }
    get type() { return this._type; }
    get shape() { return this._shape; }
    get features() { return this._features; }
    get moisture() { return this._moisture; }
    get biome() { return this._biome; }
    get fixed() { return this._fixed; }
    set moisture(m) { this._moisture = m; }
    set terrace(t) { this._terrace = t; }
    set type(t) { this._type = t; }
    set shape(s) { this._shape = s; }
    set features(f) { this._features |= f; }
    set biome(b) { this._biome = b; }
    set fixed(f) { this._fixed = f; }
}
export class Surface {
    constructor(_width, _depth) {
        this._width = _width;
        this._depth = _depth;
        this._surface = new Array();
    }
    get width() { return this._width; }
    get depth() { return this._depth; }
    init(heightMap) {
        for (let y = 0; y < this._depth; y++) {
            this._surface.push(new Array());
            for (let x = 0; x < this._width; x++) {
                let height = heightMap[y][x];
                this._surface[y].push(new TerrainAttributes(x, y, height));
            }
        }
    }
    inbounds(coord) {
        if (coord.x < 0 || coord.x >= this._width ||
            coord.y < 0 || coord.y >= this._depth)
            return false;
        return true;
    }
    at(x, y) {
        return this._surface[y][x];
    }
    getNeighbours(centreX, centreY) {
        let neighbours = new Array();
        for (let yDiff = -1; yDiff < 2; yDiff++) {
            let y = centreY + yDiff;
            if (y < 0 || y >= this._depth) {
                continue;
            }
            for (let xDiff = -1; xDiff < 2; xDiff++) {
                let x = centreX + xDiff;
                if (x < 0 || x >= this._width) {
                    continue;
                }
                if (x == centreX && y == centreY) {
                    continue;
                }
                neighbours.push(this._surface[y][x]);
            }
        }
        return neighbours;
    }
}
export class TerrainBuilderConfig {
    constructor(_numTerraces, _defaultFloor, _defaultWall) {
        this._numTerraces = _numTerraces;
        this._defaultFloor = _defaultFloor;
        this._defaultWall = _defaultWall;
        this._waterLine = 0;
        this._wetLimit = 0;
        this._dryLimit = 0;
        this._uplandThreshold = 0;
        this._hasWater = false;
        this._hasRamps = false;
        this._hasBiomes = false;
        this._rainfall = 0;
        this._rainDirection = Direction.North;
        console.assert(_numTerraces > 0);
    }
    set waterLine(level) { this._waterLine = level; }
    set wetLimit(level) { this._wetLimit = level; }
    set rainfall(level) { this._rainfall = level; }
    set uplandThreshold(level) { this._uplandThreshold = level; }
    set rainDirection(direction) { this._rainDirection = direction; }
    set dryLimit(level) { this._dryLimit = level; }
    set hasWater(enable) { this._hasWater = enable; }
    set hasRamps(enable) { this._hasRamps = enable; }
    set hasBiomes(enable) { this._hasBiomes = enable; }
    get numTerraces() { return this._numTerraces; }
    get uplandThreshold() { return this._uplandThreshold; }
    get hasWater() { return this._hasWater; }
    get floor() { return this._defaultFloor; }
    get wall() { return this._defaultWall; }
    get waterLine() { return this._waterLine; }
    get wetLimit() { return this._wetLimit; }
    get dryLimit() { return this._dryLimit; }
    get ramps() { return this._hasRamps; }
    get biomes() { return this._hasBiomes; }
    get rainfall() { return this._rainfall; }
    get rainDirection() { return this._rainDirection; }
}
export class TerrainBuilder {
    constructor(width, depth, heightMap, _config, physicalDims) {
        this._config = _config;
        Terrain.init(physicalDims);
        let minHeight = 0;
        let maxHeight = 0;
        for (let y = 0; y < depth; y++) {
            let row = heightMap[y];
            let max = row.reduce(function (a, b) {
                return Math.max(a, b);
            });
            let min = row.reduce(function (a, b) {
                return Math.min(a, b);
            });
            minHeight = Math.min(minHeight, min);
            maxHeight = Math.max(maxHeight, max);
        }
        if (minHeight < 0) {
            minHeight = Math.abs(minHeight);
            for (let y = 0; y < depth; y++) {
                for (let x = 0; x < width; x++) {
                    heightMap[y][x] += minHeight;
                }
            }
            maxHeight += minHeight;
        }
        this._terraceSpacing = maxHeight / this.config.numTerraces;
        this._surface = new Surface(width, depth);
        this.surface.init(heightMap);
        for (let y = 0; y < this.surface.depth; y++) {
            for (let x = 0; x < this.surface.width; x++) {
                let surface = this.surface.at(x, y);
                surface.terrace = Math.floor(surface.height / this._terraceSpacing);
                surface.shape = TerrainShape.Flat;
                surface.type = this.config.floor;
                console.assert(surface.terrace <= this.config.numTerraces && surface.terrace >= 0, "terrace out of range:", surface.terrace);
            }
        }
    }
    get config() { return this._config; }
    get surface() { return this._surface; }
    get terraceSpacing() { return this._terraceSpacing; }
    hasFeature(x, y, feature) {
        console.assert(x >= 0 && x < this.surface.width &&
            y >= 0 && y < this.surface.depth);
        return (this.surface.at(x, y).features & feature) != 0;
    }
    terrainTypeAt(x, y) {
        console.assert(x >= 0 && x < this.surface.width &&
            y >= 0 && y < this.surface.depth);
        return this.surface.at(x, y).type;
    }
    terrainShapeAt(x, y) {
        console.assert(x >= 0 && x < this.surface.width &&
            y >= 0 && y < this.surface.depth);
        return this.surface.at(x, y).shape;
    }
    moistureAt(x, y) {
        console.assert(x >= 0 && x < this.surface.width &&
            y >= 0 && y < this.surface.depth);
        return this.surface.at(x, y).moisture;
    }
    isFlatAt(x, y) {
        console.assert(x >= 0 && x < this.surface.width &&
            y >= 0 && y < this.surface.depth);
        return isFlat(this.surface.at(x, y).shape);
    }
    biomeAt(x, y) {
        console.assert(x >= 0 && x < this.surface.width &&
            y >= 0 && y < this.surface.depth);
        return this.surface.at(x, y).biome;
    }
    relativeHeightAt(x, y) {
        console.assert(x >= 0 && x < this.surface.width &&
            y >= 0 && y < this.surface.depth);
        return this.surface.at(x, y).terrace;
    }
    generateMap(context) {
        if (this.config.ramps) {
            this.setShapes();
        }
        if (this.config.rainfall > 0) {
            this.addRain(this.config.rainDirection, this.config.rainfall, this.config.waterLine);
        }
        if (this.config.biomes || this.config.hasWater) {
            this.setBiomes();
        }
        this.setEdges();
        this.setFeatures();
        let map = new SquareGrid(context, this.surface.width, this.surface.depth);
        for (let y = 0; y < this.surface.depth; y++) {
            for (let x = 0; x < this.surface.width; x++) {
                let surface = this.surface.at(x, y);
                console.assert(surface.terrace <= this.config.numTerraces && surface.terrace >= 0, "terrace out-of-range", surface.terrace);
                map.addSurfaceTerrain(x, y, surface.terrace, surface.type, surface.shape, surface.features);
            }
        }
        for (let y = 0; y < this.surface.depth; y++) {
            for (let x = 0; x < this.surface.width; x++) {
                let z = this.surface.at(x, y).terrace;
                let zStop = z - this.calcRelativeHeight(x, y);
                let terrain = map.getSurfaceTerrainAt(x, y);
                if (terrain == null) {
                    console.error("didn't find terrain in map at", x, y, z);
                }
                const shape = isFlat(terrain.shape) ? terrain.shape : TerrainShape.Flat;
                while (z > zStop) {
                    z--;
                    map.addSubSurfaceTerrain(x, y, z, terrain.type, shape);
                }
            }
        }
    }
    setShapes() {
        const coordOffsets = [
            new Point2D(0, 1),
            new Point2D(-1, 0),
            new Point2D(0, -1),
            new Point2D(1, 0)
        ];
        const ramps = [
            TerrainShape.RampUpSouth,
            TerrainShape.RampUpWest,
            TerrainShape.RampUpNorth,
            TerrainShape.RampUpEast
        ];
        let totalRamps = 0;
        for (let y = this.surface.depth - 3; y > 1; y--) {
            for (let x = 2; x < this.surface.width - 2; x++) {
                let centre = this.surface.at(x, y);
                if (!isFlat(centre.shape)) {
                    continue;
                }
                let roundUpHeight = centre.height + (this.terraceSpacing / 2);
                if (roundUpHeight != (centre.terrace + 1) * this.terraceSpacing) {
                    continue;
                }
                for (let i in coordOffsets) {
                    let offset = coordOffsets[i];
                    let neighbour = this.surface.at(centre.x + offset.x, centre.y + offset.y);
                    let nextNeighbour = this.surface.at(neighbour.x + offset.x, neighbour.y + offset.y);
                    if (!neighbour.fixed && !nextNeighbour.fixed &&
                        neighbour.terrace == centre.terrace + 1 &&
                        neighbour.terrace == nextNeighbour.terrace) {
                        neighbour.shape = ramps[i];
                        neighbour.fixed = true;
                        nextNeighbour.fixed = true;
                        totalRamps++;
                    }
                }
            }
        }
    }
    setEdges() {
        for (let y = 0; y < this.surface.depth; y++) {
            for (let x = 0; x < this.surface.width; x++) {
                let centre = this.surface.at(x, y);
                if (centre.type == TerrainType.Water) {
                    continue;
                }
                let neighbours = this.surface.getNeighbours(x, y);
                let shapeType = centre.shape;
                let northEdge = false;
                let eastEdge = false;
                let southEdge = false;
                let westEdge = false;
                for (let neighbour of neighbours) {
                    if (neighbour.terrace > centre.terrace) {
                        continue;
                    }
                    if ((neighbour.x != centre.x) && (neighbour.y != centre.y)) {
                        continue;
                    }
                    if (neighbour.terrace == centre.terrace &&
                        (isFlat(centre.shape) == isFlat(neighbour.shape))) {
                        continue;
                    }
                    northEdge = northEdge || neighbour.y < centre.y;
                    southEdge = southEdge || neighbour.y > centre.y;
                    eastEdge = eastEdge || neighbour.x > centre.x;
                    westEdge = westEdge || neighbour.x < centre.x;
                    if (northEdge && eastEdge && southEdge && westEdge)
                        break;
                }
                if (shapeType == TerrainShape.Flat) {
                    if (northEdge && eastEdge && southEdge && westEdge) {
                        shapeType = TerrainShape.FlatAloneOut;
                    }
                    else if (northEdge && eastEdge && westEdge) {
                        shapeType = TerrainShape.FlatNorthOut;
                    }
                    else if (northEdge && eastEdge && southEdge) {
                        shapeType = TerrainShape.FlatEastOut;
                    }
                    else if (eastEdge && southEdge && westEdge) {
                        shapeType = TerrainShape.FlatSouthOut;
                    }
                    else if (southEdge && westEdge && northEdge) {
                        shapeType = TerrainShape.FlatWestOut;
                    }
                    else if (northEdge && eastEdge) {
                        shapeType = TerrainShape.FlatNorthEast;
                    }
                    else if (northEdge && westEdge) {
                        shapeType = TerrainShape.FlatNorthWest;
                    }
                    else if (northEdge) {
                        shapeType = TerrainShape.FlatNorth;
                    }
                    else if (southEdge && eastEdge) {
                        shapeType = TerrainShape.FlatSouthEast;
                    }
                    else if (southEdge && westEdge) {
                        shapeType = TerrainShape.FlatSouthWest;
                    }
                    else if (southEdge) {
                        shapeType = TerrainShape.FlatSouth;
                    }
                    else if (eastEdge) {
                        shapeType = TerrainShape.FlatEast;
                    }
                    else if (westEdge) {
                        shapeType = TerrainShape.FlatWest;
                    }
                }
                else if (shapeType == TerrainShape.RampUpNorth && eastEdge) {
                    if (Terrain.isSupportedShape(centre.type, TerrainShape.RampUpNorthEdge)) {
                        shapeType = TerrainShape.RampUpNorthEdge;
                    }
                }
                else if (shapeType == TerrainShape.RampUpEast && northEdge) {
                    if (Terrain.isSupportedShape(centre.type, TerrainShape.RampUpEastEdge)) {
                        shapeType = TerrainShape.RampUpEastEdge;
                    }
                }
                else if (shapeType == TerrainShape.RampUpSouth && eastEdge) {
                    if (Terrain.isSupportedShape(centre.type, TerrainShape.RampUpSouthEdge)) {
                        shapeType = TerrainShape.RampUpSouthEdge;
                    }
                }
                else if (shapeType == TerrainShape.RampUpWest && northEdge) {
                    if (Terrain.isSupportedShape(centre.type, TerrainShape.RampUpWestEdge)) {
                        shapeType = TerrainShape.RampUpWestEdge;
                    }
                }
                if (centre.terrace > 0 && shapeType == TerrainShape.Flat &&
                    neighbours.length != 8) {
                    shapeType = TerrainShape.Wall;
                }
                if (isFlat(shapeType) && isEdge(shapeType)) {
                    if (!this.config.biomes) {
                        centre.type = this.config.wall;
                    }
                    if (!Terrain.isSupportedShape(centre.type, shapeType)) {
                        switch (shapeType) {
                            default:
                                shapeType = TerrainShape.Wall;
                                break;
                            case TerrainShape.FlatNorthOut:
                                if (Terrain.isSupportedShape(centre.type, TerrainShape.FlatNorth)) {
                                    shapeType = TerrainShape.FlatNorth;
                                }
                                else {
                                    shapeType = TerrainShape.Wall;
                                }
                                break;
                            case TerrainShape.FlatNorthEast:
                            case TerrainShape.FlatSouthEast:
                                if (Terrain.isSupportedShape(centre.type, TerrainShape.FlatEast)) {
                                    shapeType = TerrainShape.FlatEast;
                                }
                                else {
                                    shapeType = TerrainShape.Wall;
                                }
                                break;
                            case TerrainShape.FlatNorthWest:
                                if (Terrain.isSupportedShape(centre.type, TerrainShape.FlatWestOut)) {
                                    shapeType = TerrainShape.FlatWestOut;
                                }
                                else {
                                    shapeType = TerrainShape.Wall;
                                }
                                break;
                            case TerrainShape.FlatSouthWest:
                                if (Terrain.isSupportedShape(centre.type, TerrainShape.FlatWest)) {
                                    shapeType = TerrainShape.FlatWest;
                                }
                                else {
                                    shapeType = TerrainShape.Wall;
                                }
                                break;
                        }
                    }
                }
                if (!isFlat(shapeType) && !Terrain.isSupportedShape(centre.type, shapeType)) {
                    if (Terrain.isSupportedShape(this.config.floor, shapeType)) {
                        centre.type = this.config.floor;
                    }
                    else if (Terrain.isSupportedShape(this.config.wall, shapeType)) {
                        centre.type = this.config.wall;
                    }
                }
                if (!Terrain.isSupportedShape(centre.type, shapeType)) {
                    shapeType = TerrainShape.Flat;
                }
                centre.shape = shapeType;
            }
        }
    }
    calcRelativeHeight(x, y) {
        let neighbours = this.surface.getNeighbours(x, y);
        let relativeHeight = 0;
        let centre = this.surface.at(x, y);
        for (let neighbour of neighbours) {
            console.assert(neighbour.terrace >= 0, "Found neighbour with negative terrace!", neighbour.terrace);
            const height = centre.terrace - neighbour.terrace;
            relativeHeight = Math.max(height, relativeHeight);
        }
        console.assert(relativeHeight <= this.config.numTerraces, "impossible relative height:", relativeHeight, "\ncentre:", centre);
        return relativeHeight;
    }
    addRain(towards, water, waterLine) {
        let rain = new Rain(this.surface, waterLine, water, towards);
        rain.run();
        let blurred = gaussianBlur(rain.moistureGrid, this.surface.width, this.surface.depth);
        for (let y = 0; y < this.surface.depth; y++) {
            for (let x = 0; x < this.surface.width; x++) {
                let surface = this.surface.at(x, y);
                surface.moisture = blurred[y][x];
            }
        }
    }
    setBiomes() {
        const moistureRange = 6;
        for (let y = 0; y < this.surface.depth; y++) {
            for (let x = 0; x < this.surface.width; x++) {
                let surface = this.surface.at(x, y);
                let biome = Biome.Water;
                let terrain = TerrainType.Water;
                let moisturePercent = Math.min(1, surface.moisture / moistureRange);
                let moistureScaled = Math.floor(5 * moisturePercent);
                if (surface.height <= this.config.waterLine) {
                    biome = Biome.Water;
                    terrain = TerrainType.Water;
                }
                else if (surface.height >= this.config.uplandThreshold) {
                    console.log("height, threshold", surface.height, this.config.uplandThreshold);
                    switch (moistureScaled) {
                        default:
                            console.error('unhandled moisture scale');
                            break;
                        case 0:
                            biome = Biome.Rock;
                            terrain = TerrainType.Upland0;
                            break;
                        case 1:
                            biome = Biome.Tundra;
                            terrain = TerrainType.Upland1;
                            break;
                        case 2:
                            biome = Biome.AlpineGrassland;
                            terrain = TerrainType.Upland2;
                            break;
                        case 3:
                            biome = Biome.AlpineMeadow;
                            terrain = TerrainType.Upland3;
                            break;
                        case 4:
                            biome = Biome.AlpineForest;
                            terrain = TerrainType.Upland4;
                            break;
                        case 5:
                            biome = Biome.Taiga;
                            terrain = TerrainType.Upland5;
                            break;
                    }
                }
                else {
                    switch (moistureScaled) {
                        default:
                            console.error('unhandled moisture scale');
                            break;
                        case 0:
                            biome = Biome.Desert;
                            terrain = TerrainType.Lowland0;
                            break;
                        case 1:
                            biome = Biome.Grassland;
                            terrain = TerrainType.Lowland1;
                            break;
                        case 2:
                            biome = Biome.Shrubland;
                            terrain = TerrainType.Lowland2;
                            break;
                        case 3:
                            biome = Biome.MoistForest;
                            terrain = TerrainType.Lowland3;
                            break;
                        case 4:
                            biome = Biome.WetForest;
                            terrain = TerrainType.Lowland4;
                            break;
                        case 5:
                            biome = Biome.RainForest;
                            terrain = TerrainType.Lowland5;
                            break;
                    }
                }
                if (Terrain.isSupportedType(terrain)) {
                    surface.type = terrain;
                }
                else {
                    console.log("unsupported biome terrain type:", getTypeName(terrain));
                }
                surface.biome = biome;
            }
        }
    }
    setFeatures() {
        for (let y = 0; y < this.surface.depth; y++) {
            for (let x = 0; x < this.surface.width; x++) {
                let surface = this.surface.at(x, y);
                if (isFlat(surface.shape)) {
                    let neighbours = this.surface.getNeighbours(surface.x, surface.y);
                    for (let neighbour of neighbours) {
                        if (neighbour.biome != Biome.Water) {
                            continue;
                        }
                        switch (getDirectionFromPoints(surface.pos, neighbour.pos)) {
                            default:
                                break;
                            case Direction.North:
                                surface.features |= TerrainFeature.ShorelineNorth;
                                break;
                            case Direction.East:
                                surface.features |= TerrainFeature.ShorelineEast;
                                break;
                            case Direction.South:
                                surface.features |= TerrainFeature.ShorelineSouth;
                                break;
                            case Direction.West:
                                surface.features |= TerrainFeature.ShorelineWest;
                                break;
                        }
                    }
                    if (surface.biome == Biome.Grassland) {
                        surface.features |= TerrainFeature.DryGrass;
                    }
                    else if (surface.biome == Biome.Tundra) {
                        surface.features |= TerrainFeature.DryGrass;
                    }
                }
            }
        }
    }
}
