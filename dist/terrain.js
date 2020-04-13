import { Location, CartisanDimensionsFromSprite, IsometricDimensionsFromSprite, Direction } from "./physics.js";
import { Rain } from "./weather.js";
import { StaticEntity } from "./entity.js";
import { Point, CoordSystem } from "./graphics.js";
import { SquareGrid } from "./map.js";
export var TerrainShape;
(function (TerrainShape) {
    TerrainShape[TerrainShape["Flat"] = 0] = "Flat";
    TerrainShape[TerrainShape["FlatNorthEdge"] = 1] = "FlatNorthEdge";
    TerrainShape[TerrainShape["FlatNorthEastEdge"] = 2] = "FlatNorthEastEdge";
    TerrainShape[TerrainShape["FlatEastEdge"] = 3] = "FlatEastEdge";
    TerrainShape[TerrainShape["RampUpNorth"] = 4] = "RampUpNorth";
    TerrainShape[TerrainShape["RampUpNorthEdge"] = 5] = "RampUpNorthEdge";
    TerrainShape[TerrainShape["RampUpEast"] = 6] = "RampUpEast";
    TerrainShape[TerrainShape["RampUpEastEdge"] = 7] = "RampUpEastEdge";
    TerrainShape[TerrainShape["RampUpSouth"] = 8] = "RampUpSouth";
    TerrainShape[TerrainShape["RampUpSouthEdge"] = 9] = "RampUpSouthEdge";
    TerrainShape[TerrainShape["RampUpWest"] = 10] = "RampUpWest";
    TerrainShape[TerrainShape["RampUpWestEdge"] = 11] = "RampUpWestEdge";
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
function getShapeName(terrain) {
    switch (terrain) {
        default:
            console.error("unhandled terrain shape:", terrain);
        case TerrainShape.Flat:
            return "flat";
        case TerrainShape.FlatNorthEdge:
            return "flat north edge";
        case TerrainShape.FlatNorthEastEdge:
            return "flat north east edge";
        case TerrainShape.FlatEastEdge:
            return "flat east edge";
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
        case TerrainShape.Flat:
        case TerrainShape.FlatNorthEdge:
        case TerrainShape.FlatNorthEastEdge:
        case TerrainShape.FlatEastEdge:
            return true;
    }
    return false;
}
export class Terrain extends StaticEntity {
    constructor(_gridX, _gridY, _gridZ, dimensions, _type, _shape) {
        super(new Location(_gridX * dimensions.width, _gridY * dimensions.depth, _gridZ * dimensions.height), dimensions, true, Terrain.graphics(_type, _shape), Terrain.sys);
        this._gridX = _gridX;
        this._gridY = _gridY;
        this._gridZ = _gridZ;
        this._type = _type;
        this._shape = _shape;
    }
    static init(dims, sys) {
        this._dimensions = dims;
        this._sys = sys;
    }
    static addTerrainGraphics(terrainType, graphics) {
        console.log("adding graphics for", getTypeName(terrainType), graphics);
        this._terrainGraphics.set(terrainType, graphics);
    }
    static graphics(terrainType, shape) {
        console.assert(this._terrainGraphics.has(terrainType), "undefined terrain graphic for TerrainType:", getTypeName(terrainType));
        console.assert(shape < this._terrainGraphics.get(terrainType).length, "undefined terrain graphic for TerrainShape:", getShapeName(shape));
        return this._terrainGraphics.get(terrainType)[shape];
    }
    static get width() { return this._dimensions.width; }
    static get depth() { return this._dimensions.depth; }
    static get height() { return this._dimensions.height; }
    static get sys() { return this._sys; }
    static scaleLocation(loc) {
        return new Location(Math.floor(loc.x / this.width), Math.floor(loc.y / this.depth), Math.floor(loc.z / this.height));
    }
    static create(x, y, z, type, shape) {
        return new Terrain(x, y, z, this._dimensions, type, shape);
    }
    get gridX() { return this._gridX; }
    get gridY() { return this._gridY; }
    get gridZ() { return this._gridZ; }
    get shape() { return this._shape; }
    get type() { return this._type; }
}
Terrain._terrainGraphics = new Map();
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
    }
    get x() { return this._x; }
    get y() { return this._y; }
    get height() { return this._height; }
    get terrace() { return this._terrace; }
    get type() { return this._type; }
    get shape() { return this._shape; }
    get moisture() { return this._moisture; }
    get biome() { return this._biome; }
    set moisture(m) { this._moisture = m; }
    set terrace(t) { this._terrace = t; }
    set type(t) { this._type = t; }
    set shape(s) { this._shape = s; }
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
                neighbours.push(this._surface[y][x]);
            }
        }
        return neighbours;
    }
}
export class TerrainBuilder {
    constructor(width, depth, _terraces, _waterMultiplier, spriteWidth, spriteHeight, spriteHeightRatio, sys) {
        this._terraces = _terraces;
        this._waterMultiplier = _waterMultiplier;
        this._ceiling = 1.0;
        this._waterLevel = 0.0;
        this._landRange = this._ceiling - this._waterLevel;
        this._beachLimit = this._waterLevel + (this._landRange / 10);
        this._dryLimit = 0.02;
        this._wetLimit = 0.15;
        this._treeLimit = 0.6;
        let dims = sys == CoordSystem.Isometric ?
            new IsometricDimensionsFromSprite(spriteWidth, spriteHeight, spriteHeightRatio) :
            new CartisanDimensionsFromSprite(spriteWidth, spriteHeight, spriteHeightRatio);
        Terrain.init(dims, sys);
        this._surface = new Surface(width, depth);
        this._worldTerrain = new SquareGrid(width, depth);
        this._terraceSpacing = this._landRange / this._terraces;
        console.log("Terrain builder with", this._terraces, "terraces, and", this._terraceSpacing, "terrace spacing");
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
            case Biome.Desert:
                return TerrainType.Sand;
            case Biome.Marshland:
                return TerrainType.WetGrass;
            case Biome.Woodland:
                return TerrainType.Mud;
            case Biome.Grassland:
                return TerrainType.DryGrass;
            case Biome.Tundra:
                return TerrainType.Rock;
        }
        console.assert(surface.biome == Biome.Water);
        return TerrainType.Water;
    }
    addRamps() {
        console.log("adding ramps");
        const filterDepth = 3;
        const coordOffsets = [new Point(0, -1),
            new Point(1, 0),
            new Point(0, 1),
            new Point(0, -1)];
        const ramps = [TerrainShape.RampUpNorth,
            TerrainShape.RampUpEast,
            TerrainShape.RampUpSouth,
            TerrainShape.RampUpWest];
        const direction = ["north", "east", "south", "west"];
        const filterCoeffs = [0.15, 0.1];
        for (let y = filterDepth; y < this._surface.depth - filterDepth; y++) {
            for (let x = filterDepth; x < this._surface.width - filterDepth; x++) {
                let centre = this._surface.at(x, y);
                if (centre.shape != TerrainShape.Flat) {
                    continue;
                }
                let numDiffTerraces = 0;
                for (let i in coordOffsets) {
                    let offset = coordOffsets[i];
                    let neighbour = this._surface.at(x + offset.x, y + offset.y);
                    if (neighbour.terrace != centre.terrace) {
                        ++numDiffTerraces;
                    }
                }
                if (numDiffTerraces > 2) {
                    continue;
                }
                for (let i in coordOffsets) {
                    let offset = coordOffsets[i];
                    let neighbour = this._surface.at(x + offset.x, y + offset.y);
                    if (neighbour.shape != TerrainShape.Flat) {
                        break;
                    }
                    if (centre.terrace == neighbour.terrace) {
                        continue;
                    }
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
                        console.log("adding ramp at (x,y):", x, y);
                        console.log("direction:", direction[i]);
                        console.log("ramp shape:", getShapeName(centre.shape));
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
        let northEdge = false;
        let eastEdge = false;
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
            eastEdge = eastEdge || neighbour.x > centre.x;
            if (northEdge && eastEdge)
                break;
        }
        if (shapeType == TerrainShape.Flat) {
            if (northEdge && eastEdge) {
                shapeType = TerrainShape.FlatNorthEastEdge;
            }
            else if (northEdge) {
                shapeType = TerrainShape.FlatNorthEdge;
            }
            else if (eastEdge) {
                shapeType = TerrainShape.FlatEastEdge;
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
        this.addRamps();
        console.log("adding rain");
        let water = 3.0;
        for (let x = 0; x < this._surface.width; x++) {
            Rain.add(x, this._surface.depth - 1, water, this._waterLevel, this._waterMultiplier, Direction.North, this._surface);
        }
        for (let i = 0; i < Rain.clouds.length; i++) {
            let cloud = Rain.clouds[i];
            while (!cloud.update()) { }
        }
        console.log("calculating terrain biomes");
        for (let y = 0; y < this._surface.depth; y++) {
            for (let x = 0; x < this._surface.width; x++) {
                let biome = Biome.Water;
                let surface = this._surface.at(x, y);
                if (surface.height <= this._waterLevel) {
                    surface.biome = Biome.Water;
                }
                else if (surface.height <= this._beachLimit) {
                    surface.biome = Biome.Beach;
                }
                else {
                    if (surface.height > this._treeLimit) {
                        surface.biome = Biome.Tundra;
                    }
                    else {
                        surface.biome = surface.moisture > this._wetLimit ?
                            Biome.Marshland : surface.moisture > this._dryLimit ?
                            Biome.Grassland : Biome.Desert;
                    }
                }
                surface.type = this.calcType(x, y);
                surface.shape = this.calcEdge(x, y);
            }
        }
        console.log("adding surface terrain entities");
        for (let y = 0; y < this._surface.depth; y++) {
            for (let x = 0; x < this._surface.width; x++) {
                let surface = this._surface.at(x, y);
                console.assert(surface.terrace <= this._terraces && surface.terrace >= 0, "terrace out-of-range", surface.terrace);
                this._worldTerrain.addRaisedTerrain(x, y, surface.terrace, surface.type, surface.shape);
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
                    this._worldTerrain.addRaisedTerrain(x, y, z, terrain.type, TerrainShape.Flat);
                }
            }
        }
    }
}
