import { Location, Direction } from "./physics.js";
import { Entity } from "./entity.js";
import { Sprite, StaticGraphicComponent } from "./graphics.js";
export var TerrainShape;
(function (TerrainShape) {
    TerrainShape[TerrainShape["Flat"] = 0] = "Flat";
    TerrainShape[TerrainShape["Wall"] = 1] = "Wall";
    TerrainShape[TerrainShape["FlatWest"] = 2] = "FlatWest";
    TerrainShape[TerrainShape["FlatEast"] = 3] = "FlatEast";
    TerrainShape[TerrainShape["FlatNorthWest"] = 4] = "FlatNorthWest";
    TerrainShape[TerrainShape["FlatNorth"] = 5] = "FlatNorth";
    TerrainShape[TerrainShape["FlatNorthEast"] = 6] = "FlatNorthEast";
    TerrainShape[TerrainShape["FlatSouthWest"] = 7] = "FlatSouthWest";
    TerrainShape[TerrainShape["FlatSouth"] = 8] = "FlatSouth";
    TerrainShape[TerrainShape["FlatSouthEast"] = 9] = "FlatSouthEast";
    TerrainShape[TerrainShape["FlatNorthOut"] = 10] = "FlatNorthOut";
    TerrainShape[TerrainShape["FlatEastOut"] = 11] = "FlatEastOut";
    TerrainShape[TerrainShape["FlatWestOut"] = 12] = "FlatWestOut";
    TerrainShape[TerrainShape["FlatSouthOut"] = 13] = "FlatSouthOut";
    TerrainShape[TerrainShape["FlatAloneOut"] = 14] = "FlatAloneOut";
    TerrainShape[TerrainShape["RampUpSouthEdge"] = 15] = "RampUpSouthEdge";
    TerrainShape[TerrainShape["RampUpWestEdge"] = 16] = "RampUpWestEdge";
    TerrainShape[TerrainShape["RampUpEastEdge"] = 17] = "RampUpEastEdge";
    TerrainShape[TerrainShape["RampUpNorthEdge"] = 18] = "RampUpNorthEdge";
    TerrainShape[TerrainShape["RampUpSouth"] = 19] = "RampUpSouth";
    TerrainShape[TerrainShape["RampUpWest"] = 20] = "RampUpWest";
    TerrainShape[TerrainShape["RampUpEast"] = 21] = "RampUpEast";
    TerrainShape[TerrainShape["RampUpNorth"] = 22] = "RampUpNorth";
    TerrainShape[TerrainShape["Max"] = 23] = "Max";
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
export var TerrainFeature;
(function (TerrainFeature) {
    TerrainFeature[TerrainFeature["None"] = 0] = "None";
    TerrainFeature[TerrainFeature["Shoreline"] = 1] = "Shoreline";
    TerrainFeature[TerrainFeature["ShorelineNorth"] = 2] = "ShorelineNorth";
    TerrainFeature[TerrainFeature["ShorelineEast"] = 4] = "ShorelineEast";
    TerrainFeature[TerrainFeature["ShorelineSouth"] = 8] = "ShorelineSouth";
    TerrainFeature[TerrainFeature["ShorelineWest"] = 16] = "ShorelineWest";
    TerrainFeature[TerrainFeature["DryGrass"] = 32] = "DryGrass";
    TerrainFeature[TerrainFeature["WetGrass"] = 64] = "WetGrass";
    TerrainFeature[TerrainFeature["Mud"] = 128] = "Mud";
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
        case TerrainFeature.DryGrass:
            return "Dry Grass";
        case TerrainFeature.WetGrass:
            return "Wet Grass";
        case TerrainFeature.Mud:
            return "Mud";
    }
    return "None";
}
export function getShapeName(terrain) {
    switch (terrain) {
        default:
            console.error("unhandled terrain shape:", terrain);
        case TerrainShape.Flat:
            return "flat";
        case TerrainShape.Wall:
            return "wall";
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
export function getTypeName(terrain) {
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
export function isFlat(terrain) {
    switch (terrain) {
        default:
            break;
        case TerrainShape.FlatNorthWest:
        case TerrainShape.FlatNorth:
        case TerrainShape.FlatNorthEast:
        case TerrainShape.FlatWest:
        case TerrainShape.Flat:
        case TerrainShape.Wall:
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
export function isEdge(terrain) {
    switch (terrain) {
        default:
            break;
        case TerrainShape.FlatNorthWest:
        case TerrainShape.FlatNorth:
        case TerrainShape.FlatNorthEast:
        case TerrainShape.FlatWest:
        case TerrainShape.Wall:
        case TerrainShape.FlatEast:
        case TerrainShape.FlatSouthWest:
        case TerrainShape.FlatSouth:
        case TerrainShape.FlatSouthEast:
        case TerrainShape.FlatNorthOut:
        case TerrainShape.FlatEastOut:
        case TerrainShape.FlatSouthOut:
        case TerrainShape.FlatWestOut:
        case TerrainShape.FlatAloneOut:
        case TerrainShape.RampUpSouthEdge:
        case TerrainShape.RampUpWestEdge:
        case TerrainShape.RampUpEastEdge:
        case TerrainShape.RampUpNorthEdge:
            return true;
    }
    return false;
}
export function isRampUp(shape, direction) {
    switch (direction) {
        default:
            break;
        case Direction.North:
            return shape == TerrainShape.RampUpNorthEdge ||
                shape == TerrainShape.RampUpNorth;
        case Direction.East:
            return shape == TerrainShape.RampUpEastEdge ||
                shape == TerrainShape.RampUpEast;
        case Direction.South:
            return shape == TerrainShape.RampUpSouthEdge ||
                shape == TerrainShape.RampUpSouth;
        case Direction.West:
            return shape == TerrainShape.RampUpWestEdge ||
                shape == TerrainShape.RampUpWest;
    }
    return false;
}
export class Terrain extends Entity {
    constructor(context, _gridX, _gridY, _gridZ, dimensions, _type, _shape, features) {
        super(context, new Location(_gridX * dimensions.width, _gridY * dimensions.depth, _gridZ * dimensions.height), dimensions, true, Terrain.graphics(_type, _shape));
        this._gridX = _gridX;
        this._gridY = _gridY;
        this._gridZ = _gridZ;
        this._type = _type;
        this._shape = _shape;
        if (!isFlat(_shape)) {
            let theta = Math.atan(this.height / this.depth) * 180 / Math.PI;
            this._tanTheta = Math.tan(theta);
        }
        else {
            this._tanTheta = 0;
        }
        if (features == TerrainFeature.None) {
            return;
        }
        for (let key in TerrainFeature) {
            if (typeof TerrainFeature[key] === "number") {
                let feature = TerrainFeature[key];
                if (Terrain.isSupportedFeature(feature) &&
                    hasFeature(features, feature)) {
                    this.addGraphic(Terrain.featureGraphics(feature));
                }
            }
        }
    }
    static graphics(terrainType, shape) {
        console.assert(this._terrainGraphics.has(terrainType), "undefined terrain graphic for TerrainType:", getTypeName(terrainType));
        console.assert(this._terrainGraphics.get(terrainType).has(shape), "undefined terrain graphic for:", getTypeName(terrainType), getShapeName(shape));
        return this._terrainGraphics.get(terrainType).get(shape);
    }
    static featureGraphics(terrainFeature) {
        console.assert(this._featureGraphics.has(terrainFeature), "missing terrain feature", getFeatureName(terrainFeature));
        return this._featureGraphics.get(terrainFeature);
    }
    static addGraphic(terrainType, terrainShape, sheet, x, y, width, height) {
        let sprite = new Sprite(sheet, x, y, width, height);
        let component = new StaticGraphicComponent(sprite.id);
        if (!this._terrainGraphics.has(terrainType)) {
            this._terrainGraphics.set(terrainType, new Map());
        }
        this._terrainGraphics.get(terrainType).set(terrainShape, component);
    }
    static addFeatureGraphics(feature, graphics) {
        this._featureGraphics.set(feature, graphics);
    }
    static isSupportedFeature(feature) {
        return this._featureGraphics.has(feature);
    }
    static isSupportedType(type) {
        return this._terrainGraphics.has(type);
    }
    static isSupportedShape(type, shape) {
        return this.isSupportedType(type) &&
            this._terrainGraphics.get(type).has(shape);
    }
    static init(dims) {
        this._dimensions = dims;
        console.log("intialised Terrain with dimensions (WxDxH):", this.width, this.depth, this.height);
    }
    static get width() { return this._dimensions.width; }
    static get depth() { return this._dimensions.depth; }
    static get height() { return this._dimensions.height; }
    static scaleLocation(loc) {
        return new Location(Math.floor(loc.x / this.width), Math.floor(loc.y / this.depth), Math.floor(loc.z / this.height));
    }
    static create(context, x, y, z, type, shape, feature) {
        return new Terrain(context, x, y, z, this._dimensions, type, shape, feature);
    }
    get gridX() { return this._gridX; }
    get gridY() { return this._gridY; }
    get gridZ() { return this._gridZ; }
    get shape() { return this._shape; }
    get type() { return this._type; }
    heightAt(location) {
        if (!this._bounds.contains(location)) {
            return null;
        }
        if (isFlat(this._shape)) {
            return this.z + this.height;
        }
        return this.z + (location.y * this._tanTheta);
    }
}
Terrain._featureGraphics = new Map();
Terrain._terrainGraphics = new Map();
