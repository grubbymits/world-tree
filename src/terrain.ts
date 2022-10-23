import { Direction } from "./navigation.js"
import { Dimensions } from "./physics.js"
import { PhysicalEntity } from "./entity.js"
import { SpriteSheet,
         Sprite,
         GraphicComponent,
         StaticGraphicComponent } from "./graphics.js"
import { ContextImpl } from "./context.js"
import { Point2D,
         Point3D,
         Geometry,
         CuboidGeometry,
         RampUpWestGeometry,
         RampUpEastGeometry,
         RampUpSouthGeometry,
         RampUpNorthGeometry } from "./geometry.js"

export enum TerrainShape {
  Flat,             // 0
  Wall,             // 1
  FlatWest,         // 2
  FlatEast,         // 3
  FlatNorthWest,    // 4
  FlatNorth,        // 5
  FlatNorthEast,    // 6
  FlatSouthWest,    // 7
  FlatSouth,        // 8
  FlatSouthEast,    // 9
  FlatNorthOut,     // 10
  FlatEastOut,      // 11
  FlatWestOut,      // 12
  FlatSouthOut,     // 13
  FlatAloneOut,     // 14
  RampUpSouthEdge,  // 15
  RampUpWestEdge,   // 16
  RampUpEastEdge,   // 17
  RampUpNorthEdge,  // 18
  RampUpSouth,      // 19
  RampUpWest,       // 20
  RampUpEast,       // 21
  RampUpNorth,      // 22
  Max,              // 23
}

export enum TerrainType {
  Water,
  Lowland0,
  Lowland1,
  Lowland2,
  Lowland3,
  Lowland4,
  Lowland5,
  Upland0,
  Upland1,
  Upland2,
  Upland3,
  Upland4,
  Upland5,
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

export class Terrain extends PhysicalEntity {
  private static _dimensions: Dimensions;
  private static _featureGraphics = new Map<TerrainFeature, GraphicComponent>();
  private static _terrainGraphics =
    new Map<TerrainType, Map<TerrainShape, GraphicComponent>>();

  static reset(): void {
    this._dimensions = new Dimensions(0, 0, 0);
    this._featureGraphics = new Map<TerrainFeature, GraphicComponent>();
    this._terrainGraphics =
      new Map<TerrainType, Map<TerrainShape, GraphicComponent>>();
  }

  static getDimensions(): Dimensions {
    return this._dimensions;
  }

  static graphics(terrainType: TerrainType,
                  shape: TerrainShape): GraphicComponent {
    if (!this._terrainGraphics.has(terrainType)) {
      console.error("missing graphics for TerrainType",
                    Terrain.getTypeName(terrainType));
    }
    if (!this._terrainGraphics.get(terrainType)!.has(shape)) {
      console.error("missing graphics for TerrainShape:",
                    Terrain.getShapeName(shape));
    }
    return this._terrainGraphics.get(terrainType)!.get(shape)!;
  }

  static featureGraphics(terrainFeature: TerrainFeature): GraphicComponent {
    console.assert(this._featureGraphics.has(terrainFeature),
                   "missing terrain feature",
                   Terrain.getFeatureName(terrainFeature));
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
  }

  static get width(): number { return this._dimensions.width; }
  static get depth(): number { return this._dimensions.depth; }
  static get height(): number { return this._dimensions.height; }

  static scaleLocation(loc: Point3D): Point3D {
    return new Point3D(Math.floor(loc.x / this.width),
                        Math.floor(loc.y / this.depth),
                        Math.floor(loc.z / this.height));
  }
  
  static create(context: ContextImpl,
                x: number, y: number, z: number,
                type: TerrainType, shape: TerrainShape,
                feature: TerrainFeature) : Terrain {
    return new Terrain(context, x, y, z, this._dimensions, type, shape, feature);
  }

  static getFeatureName(feature: TerrainFeature): string {
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
  
  static getShapeName(terrain: TerrainShape): string {
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
  
  static getTypeName(terrain: TerrainType): string {
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
  
  static isFlat(terrain: TerrainShape): boolean {
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
  
  static isEdge(terrain: TerrainShape): boolean {
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
  
  static isRampUp(shape: TerrainShape, direction: Direction): boolean {
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

  private readonly _tanTheta: number;
  private readonly _surfaceLocation: Point3D;

  constructor(context: ContextImpl,
              private readonly _gridX: number,
              private readonly _gridY: number,
              private readonly _gridZ: number,
              dimensions: Dimensions,
              private readonly _type: TerrainType,
              private readonly _shape: TerrainShape,
              features: number) {
    super(context,
          new Point3D(_gridX * dimensions.width,
                      _gridY * dimensions.depth,
                      _gridZ * dimensions.height),
          dimensions);
    this.addGraphic(Terrain.graphics(_type, _shape));

    // Pre-calculate the angle of the ramp.
    if (!Terrain.isFlat(_shape)) {
      let theta = Math.atan(this.height / this.depth) * 180 / Math.PI;
      this._tanTheta = Math.tan(theta);
    } else {
      this._tanTheta = 0;
    }

    if (this._shape == TerrainShape.RampUpWest) {
      this._geometry = new RampUpWestGeometry(this.geometry.bounds);
    } else if (this._shape == TerrainShape.RampUpEast) {
      this._geometry = new RampUpEastGeometry(this.geometry.bounds);
    } else if (this._shape == TerrainShape.RampUpSouth) {
      this._geometry = new RampUpSouthGeometry(this.geometry.bounds);
    } else if (this._shape == TerrainShape.RampUpNorth) {
      this._geometry = new RampUpNorthGeometry(this.geometry.bounds);
    }

    let x = this.bounds.centre.x;
    let y = this.bounds.centre.y;
    let z = this.heightAt(this.bounds.centre)!;
    this._surfaceLocation = new Point3D(x, y, z);

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
  get surfaceLocation(): Point3D { return this._surfaceLocation; }

  heightAt(location: Point3D): number|null {
    // Given a world location, does this terrain define what the minimum z
    // coordinate?
    // If the locations is outside of the bounding cuboid, just return null.
    if (!this.bounds.contains(location)) {
      return null;
    }
    if (Terrain.isFlat(this._shape)) {
      return this.z + this.height;
    }
    return this.z + (location.y * this._tanTheta);
  }
}

export class TerrainGrid {
  static readonly neighbourOffsets: Array<Point2D> =
    [ new Point2D(-1, -1), new Point2D(0, -1),  new Point2D(1, -1),
      new Point2D(-1, 0),                       new Point2D(1, 0),
      new Point2D(-1, 1),  new Point2D(0, 1),   new Point2D(1, 1), ];

  private _surfaceTerrain: Array<Array<Terrain>> = new Array();
  private _totalSurface: number = 0;
  private _totalSubSurface: number = 0;

  constructor(private readonly _context: ContextImpl,
              private readonly _width: number,
              private readonly _depth: number) {
    for (let y = 0; y < this.depth; ++y) {
      this.surfaceTerrain.push(new Array<Terrain>(this.width));
    }
  }

  get width(): number { return this._width; }
  get depth(): number { return this._depth; }
  get totalSurface(): number { return this._totalSurface; }
  get totalSubSurface(): number { return this._totalSubSurface; }
  get surfaceTerrain(): Array<Array<Terrain>> { return this._surfaceTerrain; }

  addSurfaceTerrain(x: number, y: number, z: number, ty: TerrainType,
                    shape: TerrainShape, feature: TerrainFeature): void {
    let terrain = Terrain.create(this._context, x, y, z, ty, shape, feature);
    this.surfaceTerrain[y][x] = terrain;
    this._totalSurface++;
  }

  addSubSurfaceTerrain(x: number, y: number, z: number, ty: TerrainType,
                       shape: TerrainShape): void {
    console.assert(this.getSurfaceTerrainAt(x, y)!.z > z,
                   "adding sub-surface terrain which is above surface!");
    Terrain.create(this._context, x, y, z, ty, shape, TerrainFeature.None);
    this._totalSubSurface++;
  }

  getSurfaceTerrainAt(x: number, y: number): Terrain|null {
    if ((x < 0 || x >= this.width) ||
        (y < 0 || y >= this.depth)) {
      return null;
    }
    return this.surfaceTerrain[y][x];
  }

  getNeighbours(centre: Terrain): Array<Terrain> {
    let neighbours = new Array<Terrain>();
   
    for (let offset of TerrainGrid.neighbourOffsets) {
      let neighbour = this.getSurfaceTerrainAt(centre.x + offset.x,
                                               centre.y + offset.y);
      if (!neighbour) {
        continue;
      }
      neighbours.push(neighbour);
    }
    return neighbours;
  }
}

