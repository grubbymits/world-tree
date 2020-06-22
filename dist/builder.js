import { SquareGrid } from "./map.js";
import { Terrain, TerrainShape, TerrainType, TerrainFeature, isFlat, isEdge, getTypeName, getShapeName } from "./terrain.js";
import { Rain } from "./weather.js";
import { Direction, getDirection, getDirectionName } from "./physics.js";
import { Point } from "./graphics.js";
export var Biome;
(function (Biome) {
    Biome[Biome["Water"] = 0] = "Water";
    Biome[Biome["Beach"] = 1] = "Beach";
    Biome[Biome["Marshland"] = 2] = "Marshland";
    Biome[Biome["Grassland"] = 3] = "Grassland";
    Biome[Biome["Woodland"] = 4] = "Woodland";
    Biome[Biome["Tundra"] = 5] = "Tundra";
    Biome[Biome["Desert"] = 6] = "Desert";
})(Biome || (Biome = {}));
function getBiomeName(biome) {
    switch (biome) {
        default:
            console.error("unhandled biome type:", biome);
        case Biome.Water:
            return "water";
        case Biome.Beach:
            return "beach";
        case Biome.Marshland:
            return "marshland";
        case Biome.Grassland:
            return "grassland";
        case Biome.Woodland:
            return "woodland";
        case Biome.Tundra:
            return "tundra";
        case Biome.Desert:
            return "desert";
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
    const offsets = [-2, -1, 0, 1, 2];
    const distancesSquared = [4, 1, 0, 1, 4];
    let result = new Array();
    for (let y = 0; y < 2; y++) {
        result[y] = grid[y];
    }
    for (let y = depth - 2; y < depth; y++) {
        result[y] = grid[y];
    }
    let filter = new Float32Array(5);
    for (let y = 2; y < depth - 2; y++) {
        result[y] = new Float32Array(width);
        for (let x = 0; x < 2; x++) {
            result[y][x] = grid[y][x];
        }
        for (let x = width - 2; x < width; x++) {
            result[y][x] = grid[y][x];
        }
        for (let x = 2; x < width - 2; x++) {
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
export class TerrainAttributes {
    constructor(_x, _y, _height) {
        this._x = _x;
        this._y = _y;
        this._height = _height;
        this._moisture = 0.0;
        this._biome = Biome.Water;
        this._terrace = 0;
        this._type = TerrainType.Water;
        this._shape = TerrainShape.Flat;
        this._features = TerrainFeature.None;
    }
    get x() { return this._x; }
    get y() { return this._y; }
    get pos() { return new Point(this._x, this._y); }
    get height() { return this._height; }
    get terrace() { return this._terrace; }
    get type() { return this._type; }
    get shape() { return this._shape; }
    get features() { return this._features; }
    get moisture() { return this._moisture; }
    get biome() { return this._biome; }
    set moisture(m) { this._moisture = m; }
    set terrace(t) { this._terrace = t; }
    set type(t) { this._type = t; }
    set shape(s) { this._shape = s; }
    set features(f) { this._features |= f; }
    set biome(b) { this._biome = b; }
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
        console.log("initialise surface");
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
export class TerrainBuilder {
    constructor(width, depth, heightMap, _numTerraces, _hasWater, _defaultFloor, _defaultWall, physicalDims) {
        this._numTerraces = _numTerraces;
        this._hasWater = _hasWater;
        this._defaultFloor = _defaultFloor;
        this._defaultWall = _defaultWall;
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
        console.log("min height:", minHeight);
        console.log("max height:", maxHeight);
        if (minHeight < 0) {
            minHeight = Math.abs(minHeight);
            console.log("adjusting to make all heights non-negative");
            for (let y = 0; y < depth; y++) {
                for (let x = 0; x < width; x++) {
                    heightMap[y][x] += minHeight;
                }
            }
            maxHeight += minHeight;
        }
        this._terraceSpacing = maxHeight / _numTerraces;
        console.log("Terrain builder", "- with a ceiling of:", maxHeight, "\n", "- ", _numTerraces, "terraces\n", "- ", this._terraceSpacing, "terrace spacing");
        console.log("Using default floor", getTypeName(this._defaultFloor));
        console.log("Using default wall", getTypeName(this._defaultWall));
        this._surface = new Surface(width, depth);
        this._surface.init(heightMap);
        console.log("calculating terraces");
        for (let y = 0; y < this._surface.depth; y++) {
            for (let x = 0; x < this._surface.width; x++) {
                let surface = this._surface.at(x, y);
                surface.terrace = Math.floor(surface.height / this._terraceSpacing);
                surface.shape = TerrainShape.Flat;
                surface.type = this._defaultFloor;
                console.assert(surface.terrace <= this._numTerraces && surface.terrace >= 0, "terrace out of range:", surface.terrace);
            }
        }
    }
    generateMap(context) {
        this.setEdges();
        let worldTerrain = new SquareGrid(context, this._surface.width, this._surface.depth);
        console.log("adding surface terrain entities");
        for (let y = 0; y < this._surface.depth; y++) {
            for (let x = 0; x < this._surface.width; x++) {
                let surface = this._surface.at(x, y);
                console.assert(surface.terrace <= this._numTerraces && surface.terrace >= 0, "terrace out-of-range", surface.terrace);
                worldTerrain.addRaisedTerrain(x, y, surface.terrace, surface.type, surface.shape, surface.features);
            }
        }
        console.log("adding subterranean entities");
        for (let y = 0; y < this._surface.depth; y++) {
            for (let x = 0; x < this._surface.width; x++) {
                let z = this._surface.at(x, y).terrace;
                let zStop = z - this.calcRelativeHeight(x, y);
                let terrain = worldTerrain.getTerrain(x, y, z);
                if (terrain == null) {
                    console.error("didn't find terrain in map at", x, y, z);
                }
                while (z > zStop) {
                    z--;
                    worldTerrain.addRaisedTerrain(x, y, z, terrain.type, TerrainShape.Flat, TerrainFeature.None);
                }
            }
        }
        return worldTerrain;
    }
    setFeatures() { }
    setShapes() {
        const rampUpFilters = [[-1, 0, 1],
            [1, 0, -1]];
        const rampsAxisY = [TerrainShape.RampUpNorth,
            TerrainShape.RampUpSouth];
        const rampsAxisX = [TerrainShape.RampUpEast,
            TerrainShape.RampUpWest];
        const coordOffsets = [new Point(0, -1),
            new Point(1, 0),
            new Point(0, 1),
            new Point(-1, 0)];
        const ramps = [TerrainShape.RampUpNorth,
            TerrainShape.RampUpEast,
            TerrainShape.RampUpSouth,
            TerrainShape.RampUpWest];
        for (let y = 1; y < this._surface.depth - 1; y++) {
            for (let x = 1; x < this._surface.width - 1; x++) {
                let centre = this._surface.at(x, y);
                console.log("centre terrace:", centre.terrace);
                console.log("centre height:", centre.height);
                let roundUpHeight = centre.height + (this._terraceSpacing / 2);
                console.log("rounded up height:", roundUpHeight);
                if (roundUpHeight != (centre.terrace + 1) * this._terraceSpacing) {
                    continue;
                }
                for (let i in coordOffsets) {
                    let offset = coordOffsets[i];
                    let neighbour = this._surface.at(centre.x + offset.x, centre.y + offset.y);
                    console.log("neighbour terrace:", neighbour.terrace);
                    if (neighbour.terrace == centre.terrace + 1) {
                        neighbour.shape = ramps[i];
                        console.log("adding", getShapeName(neighbour.shape), "at", centre.x + offset.x, centre.y + offset.y);
                    }
                }
            }
        }
    }
    setBiomes(waterLine, wetLimit, dryLimit, treeLimit) {
        console.log("setBiomes with\n", "- waterLine:", waterLine, "\n", "- wetLimit:", wetLimit, "\n", "- dryLimit:", dryLimit, "\n", "- treeLimit:", treeLimit, "\n");
        if (this._hasWater) {
            for (let y = 0; y < this._surface.depth; y++) {
                for (let x = 0; x < this._surface.width; x++) {
                    let surface = this._surface.at(x, y);
                    if (surface.height <= waterLine) {
                        surface.biome = Biome.Water;
                        surface.type = TerrainType.Water;
                    }
                }
            }
        }
    }
    setEdges() {
        for (let y = 0; y < this._surface.depth; y++) {
            for (let x = 0; x < this._surface.width; x++) {
                let centre = this._surface.at(x, y);
                if (centre.type == TerrainType.Water) {
                    continue;
                }
                let neighbours = this._surface.getNeighbours(x, y);
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
                    console.log("Defaulting edge tile to Wall");
                    shapeType = TerrainShape.Wall;
                }
                if (isFlat(shapeType) && isEdge(shapeType)) {
                    if (!Terrain.isSupportedShape(centre.type, shapeType)) {
                        centre.type = this._defaultWall;
                        shapeType = TerrainShape.Wall;
                        console.log("Trying default wall shape and type", getTypeName(this._defaultWall));
                    }
                }
                if (!Terrain.isSupportedShape(centre.type, shapeType)) {
                    console.log("unsupported shape for", getTypeName(centre.type), getShapeName(shapeType));
                    shapeType = TerrainShape.Flat;
                }
                centre.shape = shapeType;
            }
        }
    }
    calcRelativeHeight(x, y) {
        let neighbours = this._surface.getNeighbours(x, y);
        let relativeHeight = 0;
        let centre = this._surface.at(x, y);
        for (let neighbour of neighbours) {
            console.assert(neighbour.terrace >= 0, "Found neighbour with negative terrace!", neighbour.terrace);
            if (neighbour.terrace < centre.terrace) {
                if (centre.terrace - neighbour.terrace > relativeHeight) {
                    relativeHeight = centre.terrace - neighbour.terrace;
                }
            }
        }
        console.assert(relativeHeight <= this._numTerraces, "impossible relative height:", relativeHeight, "\ncentre:", centre);
        return relativeHeight;
    }
}
export class OpenTerrainBuilder extends TerrainBuilder {
    constructor(width, depth, heightMap, numTerraces, hasWater, defaultFloor, defaultWall, physicalDims) {
        super(width, depth, heightMap, numTerraces, hasWater, defaultFloor, defaultWall, physicalDims);
    }
    setShapes() {
        console.log("adding ramps");
        const filterDepth = 3;
        const coordOffsets = [new Point(0, -1),
            new Point(1, 0),
            new Point(0, 1),
            new Point(-1, 0)];
        const diagOffsets = [[new Point(-1, -1), new Point(1, -1)],
            [new Point(1, -1), new Point(1, 1)],
            [new Point(-1, 1), new Point(1, 1)],
            [new Point(-1, -1), new Point(-1, 1)]];
        const ramps = [TerrainShape.RampUpNorth,
            TerrainShape.RampUpEast,
            TerrainShape.RampUpSouth,
            TerrainShape.RampUpWest];
        const direction = ["north", "east", "south", "west"];
        const filterCoeffs = [0.15, 0.1];
        for (let y = filterDepth; y < this._surface.depth - filterDepth; y++) {
            for (let x = filterDepth; x < this._surface.width - filterDepth; x++) {
                let centre = this._surface.at(x, y);
                if (!isFlat(centre.shape) || centre.biome == Biome.Water) {
                    continue;
                }
                for (let i in coordOffsets) {
                    let offset = coordOffsets[i];
                    let neighbour = this._surface.at(x + offset.x, y + offset.y);
                    if (!isFlat(neighbour.shape)) {
                        continue;
                    }
                    if (centre.terrace == neighbour.terrace) {
                        continue;
                    }
                    let skip = false;
                    for (let diagNeighbourOffsets of diagOffsets[i]) {
                        let diagNeighbour = this._surface.at(x + diagNeighbourOffsets.x, y + diagNeighbourOffsets.y);
                        skip = skip || !isFlat(diagNeighbour.shape) ||
                            diagNeighbour.terrace != neighbour.terrace;
                    }
                    if (skip)
                        continue;
                    let result = centre.terrace * 0.45 + neighbour.terrace * 0.3;
                    let next = neighbour;
                    for (let d = 0; d < filterDepth - 1; d++) {
                        next = this._surface.at(next.x + offset.x, next.y + offset.y);
                        result += next.terrace * filterCoeffs[d];
                    }
                    result = Math.round(result);
                    if (result > centre.terrace) {
                        centre.shape = ramps[i];
                        centre.terrace = result;
                        if (centre.biome == Biome.Beach) {
                            centre.biome = neighbour.biome;
                        }
                        break;
                    }
                }
            }
        }
    }
    addRain(towards, water, waterLine) {
        console.log("adding rain towards", getDirectionName(towards));
        Rain.init(waterLine, this._surface);
        for (let x = 0; x < this._surface.width; x++) {
            Rain.add(x, this._surface.depth - 1, water, towards);
        }
        for (let i = 0; i < Rain.clouds.length; i++) {
            let cloud = Rain.clouds[i];
            while (!cloud.update()) { }
        }
        console.log("total clouds added:", Rain.totalClouds);
        let blurredMoisture = gaussianBlur(Rain.moistureGrid, this._surface.width, this._surface.depth);
        console.log("calculating terrain biomes");
        for (let y = 0; y < this._surface.depth; y++) {
            for (let x = 0; x < this._surface.width; x++) {
                let surface = this._surface.at(x, y);
                surface.moisture = blurredMoisture[y][x];
            }
        }
    }
    setBiomes(waterLine, wetLimit, dryLimit, treeLimit) {
        console.log("setBiomes with\n", "- waterLine:", waterLine, "\n", "- wetLimit:", wetLimit, "\n", "- dryLimit:", dryLimit, "\n", "- treeLimit:", treeLimit, "\n");
        for (let y = 0; y < this._surface.depth; y++) {
            for (let x = 0; x < this._surface.width; x++) {
                let surface = this._surface.at(x, y);
                let biome = Biome.Water;
                let terrain = TerrainType.Water;
                if (surface.height <= waterLine) {
                    biome = Biome.Water;
                    terrain = TerrainType.Water;
                }
                else if (surface.terrace < 1) {
                    biome = Biome.Beach;
                    terrain = TerrainType.Sand;
                }
                else if (surface.height > treeLimit) {
                    biome = surface.moisture > dryLimit ?
                        Biome.Grassland : Biome.Tundra;
                    terrain = surface.moisture > dryLimit ?
                        TerrainType.DryGrass : TerrainType.Rock;
                }
                else if (surface.moisture < dryLimit) {
                    biome = Biome.Desert;
                    terrain = TerrainType.Rock;
                }
                else if (surface.moisture > wetLimit) {
                    biome = Biome.Marshland;
                    terrain = TerrainType.WetGrass;
                }
                else {
                    biome = Biome.Woodland;
                    terrain = TerrainType.Mud;
                }
                if (Terrain.isSupportedType(terrain)) {
                    surface.type = terrain;
                }
                surface.biome = biome;
            }
        }
    }
    setFeatures() {
        for (let y = 0; y < this._surface.depth; y++) {
            for (let x = 0; x < this._surface.width; x++) {
                let surface = this._surface.at(x, y);
                if (isFlat(surface.shape)) {
                    if (surface.biome == Biome.Beach) {
                        let neighbours = this._surface.getNeighbours(surface.x, surface.y);
                        for (let neighbour of neighbours) {
                            if (neighbour.biome != Biome.Water) {
                                continue;
                            }
                            switch (getDirection(neighbour.pos, surface.pos)) {
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
                    }
                    else if (surface.biome == Biome.Marshland) {
                        surface.features |= TerrainFeature.Mud;
                        surface.features |= TerrainFeature.WetGrass;
                    }
                    else if (surface.biome == Biome.Grassland) {
                        surface.features |= TerrainFeature.DryGrass;
                    }
                    else if (surface.biome == Biome.Tundra) {
                        surface.features |= TerrainFeature.DryGrass;
                    }
                    else if (surface.biome == Biome.Woodland) {
                    }
                }
            }
        }
    }
}
