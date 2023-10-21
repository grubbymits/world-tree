import { Direction } from "./navigation.ts";
import { Dimensions } from "./physics.ts";
import { PhysicalEntity } from "./entity.ts";
import {
  GraphicComponent,
  Sprite,
  SpriteSheet,
  StaticGraphicComponent,
} from "./graphics.ts";
import { ContextImpl } from "./context.ts";
import {
  Point2D,
  Point3D,
  RampUpEastGeometry,
  RampUpNorthGeometry,
  RampUpSouthGeometry,
  RampUpWestGeometry,
} from "./geometry.ts";

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
  FlatNorthSouth,   // 15
  FlatEastWest,     // 16
  RampUpSouthEdge,  // 17
  RampUpWestEdge,   // 18
  RampUpEastEdge,   // 19
  RampUpNorthEdge,  // 20
  RampUpSouth,      // 21
  RampUpWest,       // 22
  RampUpEast,       // 23
  RampUpNorth,      // 24
  Max,              // 25
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
  return (features & (<number>mask)) == <number>mask;
}

export class Terrain extends PhysicalEntity {
  private static _dimensions: Dimensions;
  private static _featureGraphics = new Map<TerrainFeature, GraphicComponent>();
  private static _terrainGraphics = new Map<
    TerrainType,
    Map<TerrainShape, GraphicComponent>
  >();

  static reset(): void {
    this._dimensions = new Dimensions(0, 0, 0);
    this._featureGraphics = new Map<TerrainFeature, GraphicComponent>();
    this._terrainGraphics = new Map<
      TerrainType,
      Map<TerrainShape, GraphicComponent>
    >();
  }

  static getDimensions(): Dimensions {
    return this._dimensions;
  }

  static graphics(
    terrainType: TerrainType,
    shape: TerrainShape
  ): GraphicComponent {
    if (!this._terrainGraphics.has(terrainType)) {
      console.error(
        "missing graphics for TerrainType",
        Terrain.getTypeName(terrainType)
      );
    }
    if (!this._terrainGraphics.get(terrainType)!.has(shape)) {
      console.error(
        "missing graphics for TerrainShape:",
        Terrain.getShapeName(shape)
      );
    }
    return this._terrainGraphics.get(terrainType)!.get(shape)!;
  }

  static featureGraphics(terrainFeature: TerrainFeature): GraphicComponent {
    console.assert(
      this._featureGraphics.has(terrainFeature),
      "missing terrain feature",
      Terrain.getFeatureName(terrainFeature)
    );
    return this._featureGraphics.get(terrainFeature)!;
  }

  static addGraphic(
    terrainType: TerrainType,
    terrainShape: TerrainShape,
    sheet: SpriteSheet,
    x: number,
    y: number,
    width: number,
    height: number
  ) {
    const sprite = new Sprite(sheet, x, y, width, height);
    const component = new StaticGraphicComponent(sprite.id);
    if (!this._terrainGraphics.has(terrainType)) {
      this._terrainGraphics.set(
        terrainType,
        new Map<TerrainShape, GraphicComponent>()
      );
    }
    this._terrainGraphics.get(terrainType)!.set(terrainShape, component);
  }

  static addFeatureGraphics(
    feature: TerrainFeature,
    graphics: GraphicComponent
  ) {
    this._featureGraphics.set(feature, graphics);
  }

  static isSupportedFeature(feature: TerrainFeature): boolean {
    return this._featureGraphics.has(feature);
  }

  static isSupportedType(type: TerrainType): boolean {
    return this._terrainGraphics.has(type);
  }

  static isSupportedShape(type: TerrainType, shape: TerrainShape): boolean {
    return (
      this.isSupportedType(type) && this._terrainGraphics.get(type)!.has(shape)
    );
  }

  static init(dims: Dimensions) {
    this._dimensions = dims;
  }

  static get width(): number {
    return this._dimensions.width;
  }
  static get depth(): number {
    return this._dimensions.depth;
  }
  static get height(): number {
    return this._dimensions.height;
  }

  static scaleLocation(loc: Point3D): Point3D {
    // round down
    const x = loc.x - (loc.x % this.width);
    const y = loc.y - (loc.y % this.depth);
    const z = loc.z - (loc.z % this.height);
    // then scale to grid
    return new Point3D(
      Math.floor(x / this.width),
      Math.floor(y / this.depth),
      Math.floor(z / this.height)
    );
  }

  static create(
    context: ContextImpl,
    x: number,
    y: number,
    z: number,
    type: TerrainType,
    shape: TerrainShape,
    feature: TerrainFeature
  ): Terrain {
    return new Terrain(
      context,
      x,
      y,
      z,
      this._dimensions,
      type,
      shape,
      feature
    );
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
        return "invalid shape";
      case TerrainShape.Flat:
        return "TerrainShape.Flat";
      case TerrainShape.Wall:
        return "TerrainShape.Wall";
      case TerrainShape.FlatNorth:
        return "TerrainShape.FlatNorth";
      case TerrainShape.FlatNorthEast:
        return "TerrainShape.FlatNorthRast";
      case TerrainShape.FlatNorthWest:
        return "TerrainShape.FlatNorthWest";
      case TerrainShape.FlatEast:
        return "TerrainShape.FlatEast";
      case TerrainShape.FlatWest:
        return "TerrainShape.FlatWest";
      case TerrainShape.FlatSouth:
        return "TerrainShape.FlatSouth";
      case TerrainShape.FlatSouthEast:
        return "TerrainShape.FlatSouthEast";
      case TerrainShape.FlatSouthWest:
        return "TerrainShape.FlatSouthWest";
      case TerrainShape.RampUpNorth:
        return "TerrainShape.RampUporth";
      case TerrainShape.RampUpNorthEdge:
        return "TerrainShape.RampUpNorthEdge";
      case TerrainShape.RampUpEast:
        return "TerrainShape.RampUpEast";
      case TerrainShape.RampUpEastEdge:
        return "TerrainShape.RampUpEastEdge";
      case TerrainShape.RampUpSouth:
        return "TerrainShape.RampUpSouth";
      case TerrainShape.RampUpSouthEdge:
        return "TerrainShape.RampUpSouthEdge";
      case TerrainShape.RampUpWest:
        return "TerrainShape.RampUpWest";
      case TerrainShape.RampUpWestEdge:
        return "TerrainShape.RampUpWestEdge";
      case TerrainShape.FlatNorthOut:
        return "TerrainShape.FlatNorthOut";
      case TerrainShape.FlatEastOut:
        return "TerrainShape.FlatEastOut";
      case TerrainShape.FlatWestOut:
        return "TerrainShape.FlatWestOut";
      case TerrainShape.FlatSouthOut:
        return "TerrainShape.FlatSouthOut";
      case TerrainShape.FlatAloneOut:
        return "TerrainShape.FlatAloneOut";
    }
  }

  static getTypeName(terrain: TerrainType): string {
    switch (terrain) {
      default:
        console.error("unhandled terrain type:", terrain);
        return "invalid terrain";
      case TerrainType.Water:
        return "TerrainType.Water";
      case TerrainType.Lowland0:
        return "TerrainType.Lowland0";
      case TerrainType.Lowland1:
        return "TerrainType.Lowland1";
      case TerrainType.Lowland2:
        return "TerrainType.Lowland2";
      case TerrainType.Lowland3:
        return "TerrainType.Lowland3";
      case TerrainType.Lowland4:
        return "TerrainType.Lowland4";
      case TerrainType.Lowland5:
        return "TerrainType.Lowland5";
      case TerrainType.Upland0:
        return "TerrainType.Upland0";
      case TerrainType.Upland1:
        return "TerrainType.Upland1";
      case TerrainType.Upland2:
        return "TerrainType.Upland2";
      case TerrainType.Upland3:
        return "TerrainType.Upland3";
      case TerrainType.Upland4:
        return "TerrainType.Upland4";
      case TerrainType.Upland5:
        return "TerrainType.Upland5";
    }
  }

  static isFlat(terrain: TerrainShape): boolean {
    switch (terrain) {
      default:
        break;
      case TerrainShape.FlatNorthWest:
      case TerrainShape.FlatNorth:
      case TerrainShape.FlatNorthEast:
      case TerrainShape.FlatNorthSouth:
      case TerrainShape.FlatWest:
      case TerrainShape.Flat:
      case TerrainShape.Wall:
      case TerrainShape.FlatEast:
      case TerrainShape.FlatEastWest:
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
      case TerrainShape.FlatNorthSouth:
      case TerrainShape.FlatEastWest:
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

  static isRamp(shape: TerrainShape): boolean {
    switch (shape) {
      default:
        break;
      case TerrainShape.RampUpSouthEdge:
      case TerrainShape.RampUpWestEdge:
      case TerrainShape.RampUpEastEdge:
      case TerrainShape.RampUpNorthEdge:
      case TerrainShape.RampUpSouth:
      case TerrainShape.RampUpWest:
      case TerrainShape.RampUpEast:
      case TerrainShape.RampUpNorth:
        return true;
    }
    return false;
  }

  static isRampUp(shape: TerrainShape, direction: Direction): boolean {
    switch (direction) {
      default:
        break;
      case Direction.North:
        return (
          shape == TerrainShape.RampUpNorthEdge ||
          shape == TerrainShape.RampUpNorth
        );
      case Direction.East:
        return (
          shape == TerrainShape.RampUpEastEdge ||
          shape == TerrainShape.RampUpEast
        );
      case Direction.South:
        return (
          shape == TerrainShape.RampUpSouthEdge ||
          shape == TerrainShape.RampUpSouth
        );
      case Direction.West:
        return (
          shape == TerrainShape.RampUpWestEdge ||
          shape == TerrainShape.RampUpWest
        );
    }
    return false;
  }

  private readonly _tanTheta: number;
  private readonly _surfaceLocation: Point3D;

  constructor(
    context: ContextImpl,
    private readonly _gridX: number,
    private readonly _gridY: number,
    private readonly _gridZ: number,
    dimensions: Dimensions,
    private readonly _type: TerrainType,
    private readonly _shape: TerrainShape,
    features: number
  ) {
    super(
      context,
      new Point3D(
        _gridX * dimensions.width,
        _gridY * dimensions.depth,
        _gridZ * dimensions.height
      ),
      dimensions
    );
    this.addGraphic(Terrain.graphics(_type, _shape));

    // Pre-calculate the angle of the ramp.
    if (!Terrain.isFlat(_shape)) {
      const theta = (Math.atan(this.height / this.depth) * 180) / Math.PI;
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

    const x = this.bounds.centre.x;
    const y = this.bounds.centre.y;
    const z = this.heightAt(this.bounds.centre)!;
    this._surfaceLocation = new Point3D(x, y, z);

    if (features == TerrainFeature.None) {
      return;
    }

    for (const value of Object.values(TerrainFeature)) {
      const feature = <TerrainFeature>value;
      if (
        Terrain.isSupportedFeature(feature) &&
        hasFeature(features, feature)
      ) {
        this.addGraphic(Terrain.featureGraphics(feature));
      }
    }
  }

  get gridX(): number {
    return this._gridX;
  }
  get gridY(): number {
    return this._gridY;
  }
  get gridZ(): number {
    return this._gridZ;
  }
  get shape(): TerrainShape {
    return this._shape;
  }
  get type(): TerrainType {
    return this._type;
  }
  get surfaceLocation(): Point3D {
    return this._surfaceLocation;
  }

  heightAt(location: Point3D): number | null {
    // Given a world location, does this terrain define what the minimum z
    // coordinate?
    // If the locations is outside of the bounding cuboid, just return null.
    if (!this.bounds.contains(location)) {
      return null;
    }
    if (Terrain.isFlat(this._shape)) {
      return this.z + this.height;
    }
    return this.z + location.y * this._tanTheta;
  }
}

export class TerrainGrid {
  static readonly neighbourOffsets: Array<Point2D> = [
    new Point2D(-1, -1),
    new Point2D(0, -1),
    new Point2D(1, -1),
    new Point2D(-1, 0),
    new Point2D(1, 0),
    new Point2D(-1, 1),
    new Point2D(0, 1),
    new Point2D(1, 1),
  ];

  private _surfaceTerrain: Array<Array<Terrain>> = new Array<Array<Terrain>>();
  private _totalSurface = 0;
  private _totalSubSurface = 0;

  constructor(
    private readonly _context: ContextImpl,
    private readonly _width: number,
    private readonly _depth: number
  ) {
    for (let y = 0; y < this.depth; ++y) {
      this.surfaceTerrain.push(new Array<Terrain>(this.width));
    }
  }

  get width(): number {
    return this._width;
  }
  get depth(): number {
    return this._depth;
  }
  get totalSurface(): number {
    return this._totalSurface;
  }
  get totalSubSurface(): number {
    return this._totalSubSurface;
  }
  get surfaceTerrain(): Array<Array<Terrain>> {
    return this._surfaceTerrain;
  }

  addSurfaceTerrain(
    x: number,
    y: number,
    z: number,
    ty: TerrainType,
    shape: TerrainShape,
    feature: TerrainFeature
  ): void {
    const terrain = Terrain.create(this._context, x, y, z, ty, shape, feature);
    this.surfaceTerrain[y][x] = terrain;
    this._totalSurface++;
  }

  addSubSurfaceTerrain(
    x: number,
    y: number,
    z: number,
    ty: TerrainType,
    shape: TerrainShape
  ): void {
    console.assert(
      this.getSurfaceTerrainAt(x, y)!.z > z,
      "adding sub-surface terrain which is above surface!"
    );
    Terrain.create(this._context, x, y, z, ty, shape, TerrainFeature.None);
    this._totalSubSurface++;
  }

  getSurfaceTerrainAt(x: number, y: number): Terrain | null {
    if (x < 0 || x >= this.width || y < 0 || y >= this.depth) {
      return null;
    }
    return this.surfaceTerrain[y][x];
  }

  getSurfaceTerrainAtPoint(loc: Point3D): Terrain | null {
    const scaled: Point3D = Terrain.scaleLocation(loc);
    const terrain = this.getSurfaceTerrainAt(scaled.x, scaled.y);
    if (terrain != null) {
      if (terrain.surfaceLocation.z == loc.z) {
        return terrain;
      }
    }
    return null;
  }

  getNeighbours(centre: Terrain): Array<Terrain> {
    const neighbours = new Array<Terrain>();

    for (const offset of TerrainGrid.neighbourOffsets) {
      const scaled: Point3D = Terrain.scaleLocation(centre.surfaceLocation);
      const neighbour = this.getSurfaceTerrainAt(
        scaled.x + offset.x,
        scaled.y + offset.y
      );
      if (!neighbour) {
        continue;
      }
      neighbours.push(neighbour);
    }
    return neighbours;
  }
}
