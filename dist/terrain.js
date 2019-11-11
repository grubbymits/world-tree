import { Location, GameObject } from "./entity.js";
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
    TerrainType[TerrainType["WATER"] = 0] = "WATER";
    TerrainType[TerrainType["SAND"] = 1] = "SAND";
    TerrainType[TerrainType["MUD"] = 2] = "MUD";
    TerrainType[TerrainType["GRASS"] = 3] = "GRASS";
    TerrainType[TerrainType["ROCK"] = 4] = "ROCK";
})(TerrainType || (TerrainType = {}));
export var Biome;
(function (Biome) {
    Biome[Biome["BEACH"] = 0] = "BEACH";
    Biome[Biome["SWAMP"] = 1] = "SWAMP";
    Biome[Biome["GRASSLAND"] = 2] = "GRASSLAND";
    Biome[Biome["WOODLAND"] = 3] = "WOODLAND";
    Biome[Biome["DESERT"] = 4] = "DESERT";
})(Biome || (Biome = {}));
export class Terrain extends GameObject {
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
        this._terrainGraphics = new Map();
    }
    static addTerrainSprites(type, graphics) {
        this._terrainGraphics.set(type, graphics);
    }
    static graphics(type, shape) {
        console.assert(this._terrainGraphics.has(type));
        return this._terrainGraphics.get(type)[shape];
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
export class TerrainBuilder {
    constructor(_width, _depth, _terraces, _waterLevel, tileWidth, tileHeight, tileDepth) {
        this._width = _width;
        this._depth = _depth;
        this._terraces = _terraces;
        this._waterLevel = _waterLevel;
        Terrain.init(tileWidth, tileDepth, tileHeight);
        this._worldTerrain = new SquareGrid(_width, _depth);
    }
    build(heightMap) {
    }
}
