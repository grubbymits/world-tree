import { Location } from "./physics.js";
import { Entity } from "./entity.js";
import { SquareGrid } from "./map.js";
export var TerrainShape;
(function (TerrainShape) {
    TerrainShape[TerrainShape["Flat"] = 0] = "Flat";
    TerrainShape[TerrainShape["RampUpNorth"] = 1] = "RampUpNorth";
    TerrainShape[TerrainShape["RampUpEast"] = 2] = "RampUpEast";
    TerrainShape[TerrainShape["RampUpSouth"] = 3] = "RampUpSouth";
    TerrainShape[TerrainShape["RampUpWest"] = 4] = "RampUpWest";
})(TerrainShape || (TerrainShape = {}));
export var TerrainType;
(function (TerrainType) {
    TerrainType[TerrainType["Water"] = 0] = "Water";
    TerrainType[TerrainType["Sand"] = 1] = "Sand";
    TerrainType[TerrainType["Mud"] = 2] = "Mud";
    TerrainType[TerrainType["Grass"] = 3] = "Grass";
    TerrainType[TerrainType["Rock"] = 4] = "Rock";
})(TerrainType || (TerrainType = {}));
export var Biome;
(function (Biome) {
    Biome[Biome["Water"] = 0] = "Water";
    Biome[Biome["Beach"] = 1] = "Beach";
    Biome[Biome["Swamp"] = 2] = "Swamp";
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
        case TerrainShape.RampUpNorth:
            return "ramp up north";
        case TerrainShape.RampUpEast:
            return "ramp up east";
        case TerrainShape.RampUpSouth:
            return "ramp up south";
        case TerrainShape.RampUpWest:
            return "ramp up west";
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
        case TerrainType.Grass:
            return "grass";
        case TerrainType.Rock:
            return "rock";
    }
}
export class Terrain extends Entity {
    constructor(_gridX, _gridY, _gridZ, _type, _shape) {
        super(new Location(_gridX * Terrain.tileWidth, _gridY * Terrain.tileDepth, _gridZ * Terrain.tileHeight), Terrain.tileWidth, Terrain.tileDepth, Terrain.tileHeight, true, Terrain.graphics(_type, _shape));
        this._gridX = _gridX;
        this._gridY = _gridY;
        this._gridZ = _gridZ;
        this._type = _type;
        this._shape = _shape;
    }
    static init(width, depth, height) {
        this._tileWidth = width;
        this._tileDepth = depth;
        this._tileHeight = height;
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
    get shape() {
        return this._shape;
    }
    get type() {
        return this._type;
    }
}
Terrain._terrainGraphics = new Map();
class TerrainAttributes {
    constructor(_height, _terrace) {
        this._height = _height;
        this._terrace = _terrace;
        this._moisture = 0.0;
        this._biome = Biome.Water;
    }
    get terrace() { return this._terrace; }
    get height() { return this._height; }
    get moisture() { return this._moisture; }
    get biome() { return this._biome; }
    set biome(b) { this._biome = b; }
}
export class TerrainBuilder {
    constructor(_width, _depth, _terraces, _waterMultiplier, _waterLevel, tileWidth, tileHeight, tileDepth) {
        this._width = _width;
        this._depth = _depth;
        this._terraces = _terraces;
        this._waterMultiplier = _waterMultiplier;
        this._waterLevel = _waterLevel;
        Terrain.init(tileWidth, tileDepth, tileHeight);
        this._worldTerrain = new SquareGrid(_width, _depth);
        this._surface = new Array();
    }
    get terrain() {
        return this._worldTerrain;
    }
    calcTerrace(height) {
        if (height <= this._waterLevel) {
            return 0;
        }
        return Math.floor(height / ((1.0 - this._waterLevel) / this._terraces));
    }
    calcRelativeHeight(centreX, centreY) {
        let centre = this._surface[centreY][centreX];
        let relativeHeight = 0;
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
                let neighbour = this._surface[y][x];
                if (neighbour.terrace < centre.terrace) {
                    if (centre.terrace - neighbour.terrace > relativeHeight) {
                        relativeHeight = centre.terrace - neighbour.terrace;
                    }
                }
            }
        }
        return relativeHeight;
    }
    calcType(x, y) {
        let surface = this._surface[y][x];
        switch (surface.biome) {
            default:
                break;
            case Biome.Beach:
            case Biome.Desert:
                return TerrainType.Sand;
            case Biome.Swamp:
            case Biome.Woodland:
                return TerrainType.Mud;
            case Biome.Grassland:
                return TerrainType.Grass;
            case Biome.Tundra:
                return TerrainType.Rock;
        }
        console.assert(surface.biome == Biome.Water);
        return TerrainType.Water;
    }
    calcShape(x, y) {
        let shapeType = TerrainShape.Flat;
        return shapeType;
    }
    build(heightMap) {
        for (let y = 0; y < this._depth; y++) {
            this._surface.push(new Array());
            for (let x = 0; x < this._width; x++) {
                let height = heightMap[y][x];
                this._surface[y].push(new TerrainAttributes(height, this.calcTerrace(height)));
            }
        }
        let landRange = 1.0 - this._waterLevel;
        let terraceSpacing = landRange / this._terraces;
        let beachLimit = this._waterLevel + (landRange / 10);
        for (let y = 0; y < this._depth; y++) {
            for (let x = 0; x < this._width; x++) {
                let biome = Biome.Water;
                let surface = this._surface[y][x];
                if (surface.height <= this._waterLevel) {
                    surface.biome = Biome.Water;
                }
                else if (surface.height <= beachLimit) {
                    surface.biome = Biome.Beach;
                }
                else {
                    surface.biome = Biome.Grassland;
                }
            }
        }
        for (let y = 0; y < this._depth; y++) {
            for (let x = 0; x < this._width; x++) {
                let terrainType = this.calcType(x, y);
                let terrainShape = this.calcShape(x, y);
                let z = this._surface[y][x].terrace;
                this._worldTerrain.addRaisedTerrain(x, y, z, terrainType, terrainShape);
            }
        }
        for (let y = 0; y < this._depth; y++) {
            for (let x = 0; x < this._width; x++) {
                let z = this.calcRelativeHeight(x, y);
                let terrain = this._worldTerrain.getTerrain(x, y, z);
                while (z > 0) {
                    z--;
                    this._worldTerrain.addRaisedTerrain(x, y, z, terrain.type, TerrainShape.Flat);
                }
            }
        }
    }
}
