import { Location,
         Dimensions } from "./physics.js"
import { Entity } from "./entity.js"
import { Point,
         SpriteSheet,
         Sprite,
         GraphicComponent,
         StaticGraphicComponent } from "./graphics.js"
import { Context } from "./context.js"

export enum TerrainShape {
  Flat,
  Wall,
  FlatWest,
  FlatEast,
  FlatNorthWest,
  FlatNorth,
  FlatNorthEast,
  FlatSouthWest,
  FlatSouth,
  FlatSouthEast,
  FlatNorthOut,
  FlatEastOut,
  FlatWestOut,
  FlatSouthOut,
  FlatAloneOut,
  RampUpSouthEdge,
  RampUpWestEdge,
  RampUpEastEdge,
  RampUpNorthEdge,
  RampUpSouth,
  RampUpWest,
  RampUpEast,
  RampUpNorth,
  Max,
}

export enum TerrainType {
  Water,
  Sand,
  Mud,
  DryGrass,
  WetGrass,
  Rock,
}

export enum TerrainFeature {
  None,
  Shoreline = 1,
  ShorelineNorth = 1 << 1,
  ShorelineEast = 1 << 2,
  ShorelineSouth = 1 << 3,
  ShorelineWest = 1 << 4,
  DryGrass = 1 << 5,
  WetGrass = 1 << 6,
  Mud = 1 << 7,
}

function hasFeature(features: number, mask: TerrainFeature): boolean {
  return (features & <number>mask) == <number>mask;
}

function getFeatureName(feature: TerrainFeature): string {
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

export function getShapeName(terrain: TerrainShape): string {
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

export function getTypeName(terrain: TerrainType): string {
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

export function isFlat(terrain: TerrainShape): boolean {
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

export function isEdge(terrain: TerrainShape): boolean {
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

export class Terrain extends Entity {
  private static _dimensions: Dimensions;
  private static _featureGraphics = new Map<TerrainFeature, GraphicComponent>();
  private static _terrainGraphics =
    new Map<TerrainType, Map<TerrainShape, GraphicComponent>>();

  static graphics(terrainType: TerrainType,
                  shape: TerrainShape): GraphicComponent {
    console.assert(this._terrainGraphics.has(terrainType),
                   "undefined terrain graphic for TerrainType:",
                   getTypeName(terrainType));
    console.assert(this._terrainGraphics.get(terrainType)!.has(shape),
                   "undefined terrain graphic for:", getTypeName(terrainType),
                   getShapeName(shape));
    return this._terrainGraphics.get(terrainType)!.get(shape)!;
  }

  static featureGraphics(terrainFeature: TerrainFeature): GraphicComponent {
    console.assert(this._featureGraphics.has(terrainFeature),
                   "missing terrain feature", getFeatureName(terrainFeature));
    return this._featureGraphics.get(terrainFeature)!;
  }

  static addGraphic(terrainType: TerrainType,
                    terrainShape: TerrainShape,
                    sheet: SpriteSheet,
                    x: number, y: number,
                    width: number, height: number) {
    let sprite = new Sprite(sheet, x, y, width, height);
    let component = new StaticGraphicComponent(sprite.id); 
    if (!this._terrainGraphics.has(terrainType)) {
      this._terrainGraphics.set(terrainType, new Map<TerrainShape, GraphicComponent>());
    }
    this._terrainGraphics.get(terrainType)!.set(terrainShape, component);
  }

  static addFeatureGraphics(feature: TerrainFeature,
                            graphics: GraphicComponent) {
    this._featureGraphics.set(feature, graphics);
  }


  static isSupportedFeature(feature: TerrainFeature): boolean {
    return this._featureGraphics.has(feature);
  }

  static isSupportedType(type: TerrainType): boolean {
    return this._terrainGraphics.has(type);
  }

  static isSupportedShape(type: TerrainType, shape: TerrainShape): boolean {
    return this.isSupportedType(type) &&
           this._terrainGraphics.get(type)!.has(shape);
  }

  static init(dims: Dimensions) {
    this._dimensions = dims;
    console.log("intialised Terrain with dimensions (WxDxH):",
                this.width, this.depth, this.height);
  }

  static get width(): number { return this._dimensions.width; }
  static get depth(): number { return this._dimensions.depth; }
  static get height(): number { return this._dimensions.height; }

  static scaleLocation(loc: Location): Location {
    return new Location(Math.floor(loc.x / this.width),
                        Math.floor(loc.y / this.depth),
                        Math.floor(loc.z / this.height));
  }
  
  static create(context: Context,
                x: number, y: number, z: number,
                type: TerrainType, shape: TerrainShape,
                feature: TerrainFeature) : Terrain {
    return new Terrain(context, x, y, z, this._dimensions, type, shape, feature);
  }

  private readonly _tanTheta: number;

  constructor(context: Context,
              private readonly _gridX: number,
              private readonly _gridY: number,
              private readonly _gridZ: number,
              dimensions: Dimensions,
              private readonly _type: TerrainType,
              private readonly _shape: TerrainShape,
              features: number) {
    super(context,
          new Location(_gridX * dimensions.width,
                       _gridY * dimensions.depth,
                       _gridZ * dimensions.height),
          dimensions, true, Terrain.graphics(_type, _shape));

    // Pre-calculate the angle of the ramp.
    if (!isFlat(_shape)) {
      let theta = Math.atan(this.height / this.depth) * 180 / Math.PI;
      this._tanTheta = Math.tan(theta);
    } else {
      this._tanTheta = 0;
    }

    if (features == TerrainFeature.None) {
      return;
    }

    for (let key in TerrainFeature) {
      if (typeof TerrainFeature[key] === "number") {
        let feature = <TerrainFeature><any>TerrainFeature[key];
        if (Terrain.isSupportedFeature(feature) &&
            hasFeature(features, feature)) {
          this.addGraphic(Terrain.featureGraphics(feature));
        }
      }
    }
  }

  get gridX(): number { return this._gridX; }
  get gridY(): number { return this._gridY; }
  get gridZ(): number { return this._gridZ; }
  get shape(): TerrainShape { return this._shape; }
  get type(): TerrainType { return this._type; }

  heightAt(location: Location): number|null {
    // Given a world location, does this terrain define what the minimum z
    // coordinate?
    // If the locations is outside of the bounding cuboid, just return null.
    if (!this._bounds.contains(location)) {
      return null;
    }
    if (isFlat(this._shape)) {
      return this.z + this.height;
    }
    return this.z + (location.y * this._tanTheta);
  }
}

