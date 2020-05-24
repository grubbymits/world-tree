import { Location, CartisanDimensionsFromSprite, IsometricDimensionsFromSprite, Direction, getDirection } from "./physics.js";
import { Rain } from "./weather.js";
import { StaticEntity } from "./entity.js";
import { Point, CoordSystem, Sprite, StaticGraphicComponent } from "./graphics.js";
import { SquareGrid } from "./map.js";
export var TerrainShape;
(function (TerrainShape) {
    TerrainShape[TerrainShape["Flat"] = 0] = "Flat";
    TerrainShape[TerrainShape["FlatWest"] = 1] = "FlatWest";
    TerrainShape[TerrainShape["FlatEast"] = 2] = "FlatEast";
    TerrainShape[TerrainShape["FlatNorthWest"] = 3] = "FlatNorthWest";
    TerrainShape[TerrainShape["FlatNorth"] = 4] = "FlatNorth";
    TerrainShape[TerrainShape["FlatNorthEast"] = 5] = "FlatNorthEast";
    TerrainShape[TerrainShape["FlatSouthWest"] = 6] = "FlatSouthWest";
    TerrainShape[TerrainShape["FlatSouth"] = 7] = "FlatSouth";
    TerrainShape[TerrainShape["FlatSouthEast"] = 8] = "FlatSouthEast";
    TerrainShape[TerrainShape["FlatNorthOut"] = 9] = "FlatNorthOut";
    TerrainShape[TerrainShape["FlatEastOut"] = 10] = "FlatEastOut";
    TerrainShape[TerrainShape["FlatWestOut"] = 11] = "FlatWestOut";
    TerrainShape[TerrainShape["FlatSouthOut"] = 12] = "FlatSouthOut";
    TerrainShape[TerrainShape["FlatAloneOut"] = 13] = "FlatAloneOut";
    TerrainShape[TerrainShape["RampUpSouthEdge"] = 14] = "RampUpSouthEdge";
    TerrainShape[TerrainShape["RampUpWestEdge"] = 15] = "RampUpWestEdge";
    TerrainShape[TerrainShape["RampUpEastEdge"] = 16] = "RampUpEastEdge";
    TerrainShape[TerrainShape["RampUpNorthEdge"] = 17] = "RampUpNorthEdge";
    TerrainShape[TerrainShape["RampUpSouth"] = 18] = "RampUpSouth";
    TerrainShape[TerrainShape["RampUpWest"] = 19] = "RampUpWest";
    TerrainShape[TerrainShape["RampUpEast"] = 20] = "RampUpEast";
    TerrainShape[TerrainShape["RampUpNorth"] = 21] = "RampUpNorth";
})(TerrainShape || (TerrainShape = {}));
export var TerrainType;
(function (TerrainType) {
    TerrainType[TerrainType["Water"] = 0] = "Water";
    TerrainType[TerrainType["Sand"] = 1] = "Sand";
    TerrainType[TerrainType["Mud"] = 2] = "Mud";
    TerrainType[TerrainType["DryGrass"] = 3] = "DryGrass";
    TerrainType[TerrainType["WetGrass"] = 4] = "WetGrass";
    TerrainType[TerrainType["Rock"] = 5] = "Rock";
})(TerrainType || (TerrainType = {}));
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
export var TerrainFeature;
(function (TerrainFeature) {
    TerrainFeature[TerrainFeature["None"] = 0] = "None";
    TerrainFeature[TerrainFeature["Shoreline"] = 1] = "Shoreline";
    TerrainFeature[TerrainFeature["ShorelineNorth"] = 2] = "ShorelineNorth";
    TerrainFeature[TerrainFeature["ShorelineEast"] = 4] = "ShorelineEast";
    TerrainFeature[TerrainFeature["ShorelineSouth"] = 8] = "ShorelineSouth";
    TerrainFeature[TerrainFeature["ShorelineWest"] = 16] = "ShorelineWest";
    TerrainFeature[TerrainFeature["Grass"] = 32] = "Grass";
})(TerrainFeature || (TerrainFeature = {}));
function hasFeature(features, mask) {
    return (features & mask) == mask;
}
function getFeatureName(feature) {
    switch (feature) {
        default:
            break;
        case TerrainFeature.Shoreline:
        case TerrainFeature.ShorelineNorth:
        case TerrainFeature.ShorelineEast:
        case TerrainFeature.ShorelineSouth:
        case TerrainFeature.ShorelineWest:
            return "Shoreline";
        case TerrainFeature.Grass:
            return "Grass";
    }
    return "None";
}
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
function getShapeName(terrain) {
    switch (terrain) {
        default:
            console.error("unhandled terrain shape:", terrain);
        case TerrainShape.Flat:
            return "flat";
        case TerrainShape.FlatNorth:
            return "flat north";
        case TerrainShape.FlatNorthEast:
            return "flat north east";
        case TerrainShape.FlatNorthWest:
            return "flat north west";
        case TerrainShape.FlatEast:
            return "flat east";
        case TerrainShape.FlatWest:
            return "flat west";
        case TerrainShape.FlatSouth:
            return "flat south";
        case TerrainShape.FlatSouthEast:
            return "flat south east";
        case TerrainShape.FlatSouthWest:
            return "flat south west";
        case TerrainShape.RampUpNorth:
            return "ramp up north";
        case TerrainShape.RampUpNorthEdge:
            return "ramp up north edge";
        case TerrainShape.RampUpEast:
            return "ramp up east";
        case TerrainShape.RampUpEastEdge:
            return "ramp up east edge";
        case TerrainShape.RampUpSouth:
            return "ramp up south";
        case TerrainShape.RampUpSouthEdge:
            return "ramp up south edge";
        case TerrainShape.RampUpWest:
            return "ramp up west";
        case TerrainShape.RampUpWestEdge:
            return "ramp up west edge";
        case TerrainShape.FlatNorthOut:
            return "flat north out";
        case TerrainShape.FlatEastOut:
            return "flat east out";
        case TerrainShape.FlatWestOut:
            return "flat west out";
        case TerrainShape.FlatSouthOut:
            return "flat south out";
        case TerrainShape.FlatAloneOut:
            return "flat alone out";
    }
}
function getTypeName(terrain) {
    switch (terrain) {
        default:
            console.error("unhandled terrain type:", terrain);
        case TerrainType.Water:
            return "water";
        case TerrainType.Sand:
            return "sand";
        case TerrainType.Mud:
            return "mud";
        case TerrainType.DryGrass:
            return "dry grass";
        case TerrainType.WetGrass:
            return "wet grass";
        case TerrainType.Rock:
            return "rock";
    }
}
function isFlat(terrain) {
    switch (terrain) {
        default:
            break;
        case TerrainShape.FlatNorthWest:
        case TerrainShape.FlatNorth:
        case TerrainShape.FlatNorthEast:
        case TerrainShape.FlatWest:
        case TerrainShape.Flat:
        case TerrainShape.FlatEast:
        case TerrainShape.FlatSouthWest:
        case TerrainShape.FlatSouth:
        case TerrainShape.FlatSouthEast:
        case TerrainShape.FlatNorthOut:
        case TerrainShape.FlatEastOut:
        case TerrainShape.FlatSouthOut:
        case TerrainShape.FlatWestOut:
        case TerrainShape.FlatAloneOut:
            return true;
    }
    return false;
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
export class Terrain extends StaticEntity {
    constructor(_gridX, _gridY, _gridZ, dimensions, _type, _shape, features) {
        super(new Location(_gridX * dimensions.width, _gridY * dimensions.depth, _gridZ * dimensions.height), dimensions, true, Terrain.graphics(_type, _shape), Terrain.sys);
        this._gridX = _gridX;
        this._gridY = _gridY;
        this._gridZ = _gridZ;
        this._type = _type;
        this._shape = _shape;
        if (features != TerrainFeature.None) {
            if (hasFeature(features, TerrainFeature.ShorelineNorth))
                this.addGraphic(Terrain.featureGraphics(TerrainFeature.ShorelineNorth));
            if (hasFeature(features, TerrainFeature.ShorelineSouth))
                this.addGraphic(Terrain.featureGraphics(TerrainFeature.ShorelineSouth));
            if (hasFeature(features, TerrainFeature.ShorelineEast))
                this.addGraphic(Terrain.featureGraphics(TerrainFeature.ShorelineEast));
            if (hasFeature(features, TerrainFeature.ShorelineWest))
                this.addGraphic(Terrain.featureGraphics(TerrainFeature.ShorelineWest));
        }
        if (_type == TerrainType.WetGrass && _shape == TerrainShape.Flat) {
            this.addGraphic(Terrain.featureGraphics(TerrainFeature.Grass));
        }
    }
    static init(dims, sys) {
        this._dimensions = dims;
        this._sys = sys;
    }
    static graphics(terrainType, shape) {
        console.assert(this._terrainGraphics.has(terrainType), "undefined terrain graphic for TerrainType:", getTypeName(terrainType));
        console.assert(shape < this._terrainGraphics.get(terrainType).length, "undefined terrain graphic for:", getTypeName(terrainType), getShapeName(shape));
        return this._terrainGraphics.get(terrainType)[shape];
    }
    static featureGraphics(terrainFeature) {
        console.assert(this._featureGraphics.has(terrainFeature), "missing terrain feature");
        return this._featureGraphics.get(terrainFeature);
    }
    static addGraphic(terrainType, sheet, width, height) {
        console.assert(terrainType == TerrainType.Water, "water is the only type supported");
        console.log("adding graphics for type:", getTypeName(terrainType));
        this._terrainGraphics.set(terrainType, new Array());
        let graphics = this._terrainGraphics.get(terrainType);
        let sprite = new Sprite(sheet, 0, 0, width, height);
        graphics.push(new StaticGraphicComponent(sprite.id));
        console.log("added sprite for shape: flat");
    }
    static addGraphics(terrainType, sheet, width, height) {
        console.log("adding graphics for type:", getTypeName(terrainType));
        this._terrainGraphics.set(terrainType, new Array());
        let graphics = this._terrainGraphics.get(terrainType);
        let shapeType = 0;
        let y = 0;
        for (; y < 7; y++) {
            for (let x = 0; x < 3; x++) {
                let sprite = new Sprite(sheet, x * width, y * height, width, height);
                graphics.push(new StaticGraphicComponent(sprite.id));
                console.log("added sprite for shape:", getShapeName(shapeType));
                shapeType++;
            }
        }
        let sprite = new Sprite(sheet, 0, y * height, width, height);
        graphics.push(new StaticGraphicComponent(sprite.id));
        console.log("added sprite for shape:", getShapeName(shapeType));
    }
    static addFeatureGraphics(feature, graphics) {
        console.log("adding feature graphics for", getFeatureName(feature));
        this._featureGraphics.set(feature, graphics);
    }
    static get width() { return this._dimensions.width; }
    static get depth() { return this._dimensions.depth; }
    static get height() { return this._dimensions.height; }
    static get sys() { return this._sys; }
    static scaleLocation(loc) {
        return new Location(Math.floor(loc.x / this.width), Math.floor(loc.y / this.depth), Math.floor(loc.z / this.height));
    }
    static create(x, y, z, type, shape, feature) {
        return new Terrain(x, y, z, this._dimensions, type, shape, feature);
    }
    get gridX() { return this._gridX; }
    get gridY() { return this._gridY; }
    get gridZ() { return this._gridZ; }
    get shape() { return this._shape; }
    get type() { return this._type; }
}
Terrain._terrainGraphics = new Map();
Terrain._featureGraphics = new Map();
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
    constructor(width, depth, _ceiling, _terraces, _water, _wetLimit, _dryLimit, spriteWidth, spriteHeight, spriteHeightRatio, sys) {
        this._ceiling = _ceiling;
        this._terraces = _terraces;
        this._water = _water;
        this._wetLimit = _wetLimit;
        this._dryLimit = _dryLimit;
        this._waterLevel = 0.0;
        this._landRange = this._ceiling - this._waterLevel;
        this._beachLimit = this._waterLevel + (this._landRange / 10);
        this._treeLimit = this._ceiling - (this._landRange / 20);
        let dims = sys == CoordSystem.Isometric ?
            new IsometricDimensionsFromSprite(spriteWidth, spriteHeight, spriteHeightRatio) :
            new CartisanDimensionsFromSprite(spriteWidth, spriteHeight, spriteHeightRatio);
        Terrain.init(dims, sys);
        this._surface = new Surface(width, depth);
        this._worldTerrain = new SquareGrid(width, depth);
        this._terraceSpacing = this._landRange / this._terraces;
        console.log("Terrain builder", "- with a ceiling of:", this._ceiling, "\n", "- ", this._terraces, "terraces\n", "- ", this._terraceSpacing, "terrace spacing");
    }
    get terrain() {
        return this._worldTerrain;
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
        console.assert(relativeHeight <= this._terraces, "impossible relative height:", relativeHeight, "\ncentre:", centre);
        return relativeHeight;
    }
    calcType(x, y) {
        let surface = this._surface.at(x, y);
        switch (surface.biome) {
            default:
                break;
            case Biome.Beach:
                return TerrainType.Sand;
            case Biome.Marshland:
                return TerrainType.WetGrass;
            case Biome.Woodland:
                return TerrainType.Mud;
            case Biome.Grassland:
                return TerrainType.DryGrass;
            case Biome.Tundra:
            case Biome.Desert:
                return TerrainType.Rock;
        }
        console.log("default biome:", getBiomeName(surface.biome));
        console.assert(surface.biome == Biome.Water);
        return TerrainType.Water;
    }
    calcShapes() {
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
    calcEdge(x, y) {
        let centre = this._surface.at(x, y);
        let neighbours = this._surface.getNeighbours(x, y);
        let shapeType = centre.shape;
        if (centre.type == TerrainType.Water) {
            return shapeType;
        }
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
            shapeType = TerrainShape.RampUpNorthEdge;
        }
        else if (shapeType == TerrainShape.RampUpEast && northEdge) {
            shapeType = TerrainShape.RampUpEastEdge;
        }
        else if (shapeType == TerrainShape.RampUpSouth && eastEdge) {
            shapeType = TerrainShape.RampUpSouthEdge;
        }
        else if (shapeType == TerrainShape.RampUpWest && northEdge) {
            shapeType = TerrainShape.RampUpWestEdge;
        }
        return shapeType;
    }
    addShoreline() {
        for (let y = 0; y < this._surface.depth; y++) {
            for (let x = 0; x < this._surface.width; x++) {
                let centre = this._surface.at(x, y);
                if (centre.biome != Biome.Beach) {
                    continue;
                }
                let neighbours = this._surface.getNeighbours(centre.x, centre.y);
                for (let neighbour of neighbours) {
                    if (neighbour.biome != Biome.Water) {
                        continue;
                    }
                    switch (getDirection(neighbour.pos, centre.pos)) {
                        default:
                            break;
                        case Direction.North:
                            centre.features |= TerrainFeature.ShorelineNorth;
                            break;
                        case Direction.East:
                            centre.features |= TerrainFeature.ShorelineEast;
                            break;
                        case Direction.South:
                            centre.features |= TerrainFeature.ShorelineSouth;
                            break;
                        case Direction.West:
                            centre.features |= TerrainFeature.ShorelineWest;
                            break;
                    }
                }
            }
        }
    }
    build(heightMap) {
        console.log("build terrain from height map");
        this._surface.init(heightMap);
        console.log("calculating terraces");
        for (let y = 0; y < this._surface.depth; y++) {
            for (let x = 0; x < this._surface.width; x++) {
                let surface = this._surface.at(x, y);
                let terrace = surface.height <= this._waterLevel ? 0 :
                    Math.floor((surface.height - this._waterLevel) / this._terraceSpacing);
                console.assert(terrace <= this._terraces && terrace >= 0, "terrace out of range:", terrace);
                surface.terrace = terrace;
            }
        }
        console.log("adding rain");
        Rain.init(this._waterLevel, this._surface);
        for (let x = 0; x < this._surface.width; x++) {
            Rain.add(x, this._surface.depth - 1, this._water, Direction.North);
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
                let biome = Biome.Water;
                if (surface.height <= this._waterLevel) {
                    biome = Biome.Water;
                }
                else if (surface.terrace < 1) {
                    biome = Biome.Beach;
                }
                else if (surface.height > this._treeLimit) {
                    biome = surface.moisture > this._dryLimit ?
                        Biome.Grassland : Biome.Tundra;
                }
                else if (surface.moisture < this._dryLimit) {
                    biome = Biome.Desert;
                }
                else if (surface.moisture > this._wetLimit) {
                    biome = Biome.Marshland;
                }
                else {
                    biome = Biome.Woodland;
                }
                surface.biome = biome;
            }
        }
        this.calcShapes();
        this.addShoreline();
        console.log("adding surface terrain entities");
        for (let y = 0; y < this._surface.depth; y++) {
            for (let x = 0; x < this._surface.width; x++) {
                let surface = this._surface.at(x, y);
                surface.type = this.calcType(x, y);
                surface.shape = this.calcEdge(x, y);
                console.assert(surface.terrace <= this._terraces && surface.terrace >= 0, "terrace out-of-range", surface.terrace);
                this._worldTerrain.addRaisedTerrain(x, y, surface.terrace, surface.type, surface.shape, surface.features);
            }
        }
        console.log("adding subterranean entities");
        for (let y = 0; y < this._surface.depth; y++) {
            for (let x = 0; x < this._surface.width; x++) {
                let z = this._surface.at(x, y).terrace;
                let zStop = z - this.calcRelativeHeight(x, y);
                let terrain = this._worldTerrain.getTerrain(x, y, z);
                if (terrain == null) {
                    console.error("didn't find terrain in map at", x, y, z);
                }
                while (z > zStop) {
                    z--;
                    this._worldTerrain.addRaisedTerrain(x, y, z, terrain.type, TerrainShape.Flat, TerrainFeature.None);
                }
            }
        }
    }
}
