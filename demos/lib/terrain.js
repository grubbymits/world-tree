import { Direction, Dimensions } from "./physics.js";
import { PhysicalEntity } from "./entity.js";
import { Sprite, StaticGraphicComponent } from "./graphics.js";
import { Point3D, RampUpWestGeometry, RampUpEastGeometry, RampUpSouthGeometry, RampUpNorthGeometry } from "./geometry.js";
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
    TerrainType[TerrainType["Lowland0"] = 1] = "Lowland0";
    TerrainType[TerrainType["Lowland1"] = 2] = "Lowland1";
    TerrainType[TerrainType["Lowland2"] = 3] = "Lowland2";
    TerrainType[TerrainType["Lowland3"] = 4] = "Lowland3";
    TerrainType[TerrainType["Lowland4"] = 5] = "Lowland4";
    TerrainType[TerrainType["Lowland5"] = 6] = "Lowland5";
    TerrainType[TerrainType["Upland0"] = 7] = "Upland0";
    TerrainType[TerrainType["Upland1"] = 8] = "Upland1";
    TerrainType[TerrainType["Upland2"] = 9] = "Upland2";
    TerrainType[TerrainType["Upland3"] = 10] = "Upland3";
    TerrainType[TerrainType["Upland4"] = 11] = "Upland4";
    TerrainType[TerrainType["Upland5"] = 12] = "Upland5";
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
        case TerrainType.Lowland0:
            return "lowland 0";
        case TerrainType.Lowland1:
            return "lowland 1";
        case TerrainType.Lowland2:
            return "lowland 2";
        case TerrainType.Lowland3:
            return "lowland 3";
        case TerrainType.Lowland4:
            return "lowland 4";
        case TerrainType.Lowland5:
            return "lowland 5";
        case TerrainType.Upland0:
            return "upland 0";
        case TerrainType.Upland1:
            return "upland 1";
        case TerrainType.Upland2:
            return "upland 2";
        case TerrainType.Upland3:
            return "upland 3";
        case TerrainType.Upland4:
            return "upland 4";
        case TerrainType.Upland5:
            return "upland 5";
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
export class Terrain extends PhysicalEntity {
    constructor(context, _gridX, _gridY, _gridZ, dimensions, _type, _shape, features) {
        super(context, new Point3D(_gridX * dimensions.width, _gridY * dimensions.depth, _gridZ * dimensions.height), dimensions);
        this._gridX = _gridX;
        this._gridY = _gridY;
        this._gridZ = _gridZ;
        this._type = _type;
        this._shape = _shape;
        this.addGraphic(Terrain.graphics(_type, _shape));
        if (!isFlat(_shape)) {
            let theta = Math.atan(this.height / this.depth) * 180 / Math.PI;
            this._tanTheta = Math.tan(theta);
        }
        else {
            this._tanTheta = 0;
        }
        if (this._shape == TerrainShape.RampUpWest) {
            this._geometry = new RampUpWestGeometry(this.geometry.bounds);
        }
        else if (this._shape == TerrainShape.RampUpEast) {
            this._geometry = new RampUpEastGeometry(this.geometry.bounds);
        }
        else if (this._shape == TerrainShape.RampUpSouth) {
            this._geometry = new RampUpSouthGeometry(this.geometry.bounds);
        }
        else if (this._shape == TerrainShape.RampUpNorth) {
            this._geometry = new RampUpNorthGeometry(this.geometry.bounds);
        }
        let x = this.bounds.centre.x;
        let y = this.bounds.centre.y;
        let z = this.heightAt(this.bounds.centre);
        this._surfaceLocation = new Point3D(x, y, z);
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
    static reset() {
        this._dimensions = new Dimensions(0, 0, 0);
        this._featureGraphics = new Map();
        this._terrainGraphics =
            new Map();
    }
    static getDimensions() {
        return this._dimensions;
    }
    static graphics(terrainType, shape) {
        if (!this._terrainGraphics.has(terrainType)) {
            console.error("missing graphics for TerrainType", getTypeName(terrainType));
        }
        if (!this._terrainGraphics.get(terrainType).has(shape)) {
            console.error("missing graphics for TerrainShape:", getShapeName(shape));
        }
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
    }
    static get width() { return this._dimensions.width; }
    static get depth() { return this._dimensions.depth; }
    static get height() { return this._dimensions.height; }
    static scaleLocation(loc) {
        return new Point3D(Math.floor(loc.x / this.width), Math.floor(loc.y / this.depth), Math.floor(loc.z / this.height));
    }
    static create(context, x, y, z, type, shape, feature) {
        return new Terrain(context, x, y, z, this._dimensions, type, shape, feature);
    }
    get gridX() { return this._gridX; }
    get gridY() { return this._gridY; }
    get gridZ() { return this._gridZ; }
    get shape() { return this._shape; }
    get type() { return this._type; }
    get surfaceLocation() { return this._surfaceLocation; }
    heightAt(location) {
        if (!this.bounds.contains(location)) {
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
