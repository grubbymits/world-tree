import { Location, GameObject } from "./entity.js";
export var TerrainType;
(function (TerrainType) {
    TerrainType[TerrainType["Flat"] = 0] = "Flat";
    TerrainType[TerrainType["RampUpNorth"] = 1] = "RampUpNorth";
    TerrainType[TerrainType["RampUpEast"] = 2] = "RampUpEast";
    TerrainType[TerrainType["RampUpSouth"] = 3] = "RampUpSouth";
    TerrainType[TerrainType["RampUpWest"] = 4] = "RampUpWest";
})(TerrainType || (TerrainType = {}));
export class Terrain extends GameObject {
    constructor(_gridX, _gridY, _gridZ, _type, graphics) {
        super(new Location(_gridX * Terrain.tileWidth, _gridY * Terrain.tileDepth, _gridZ * Terrain.tileHeight), Terrain._tileWidth, Terrain._tileDepth, Terrain._tileHeight, true, graphics);
        this._gridX = _gridX;
        this._gridY = _gridY;
        this._gridZ = _gridZ;
        this._type = _type;
    }
    static init(width, depth, height) {
        this._tileWidth = width;
        this._tileDepth = depth;
        this._tileHeight = height;
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
    get type() {
        return this._type;
    }
}
