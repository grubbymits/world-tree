import { Direction } from "./navigation.ts";
import { Dimensions } from "./physics.ts";
import { PhysicalEntity } from "./entity.ts";
import { Navigation } from "./navigation.ts";
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

export interface TerrainSpriteDescriptor {
  spriteWidth: number;
  spriteHeight: number;
  spriteSheet: SpriteSheet;
  tileRows: Array<TerrainType>;
  tileColumns: Array<TerrainShape>;
};

export class Terrain extends PhysicalEntity {
  private static _terrainGraphics = new Map<
    TerrainType,
    Map<TerrainShape, GraphicComponent>
  >();

  static reset(): void {
    this._terrainGraphics = new Map<
      TerrainType,
      Map<TerrainShape, GraphicComponent>
    >();
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

  static generateSprites(descriptor: TerrainSpriteDescriptor): void {
    for (let y = 0; y < descriptor.tileRows.length; ++y) {
      const terrainType = descriptor.tileRows[y];
      for (let x = 0; x < descriptor.tileColumns.length; ++x) {
        const terrainShape = descriptor.tileColumns[x];
        this.addGraphic(terrainType, terrainShape, descriptor.spriteSheet, x, y,
                        descriptor.spriteWidth, descriptor.spriteHeight);
      }
    }
  }

  static isSupportedType(type: TerrainType): boolean {
    return this._terrainGraphics.has(type);
  }

  static isSupportedShape(type: TerrainType, shape: TerrainShape): boolean {
    return (
      this.isSupportedType(type) && this._terrainGraphics.get(type)!.has(shape)
    );
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
    position: Point3D,
    dimensions: Dimensions,
    private readonly _type: TerrainType,
    private readonly _shape: TerrainShape
  ) {
    super(
      context,
      position,
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
  }

  get width(): number {
    return this.dimensions.width;
  }
  get depth(): number {
    return this.dimensions.depth;
  }
  get height(): number {
    return this.dimensions.height;
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

export interface TerrainGridDescriptor {
  cellHeightGrid: Array<Array<number>>;
  typeGrid: Array<Array<TerrainType>>;
  shapeGrid: Array<Array<TerrainShape>>;
  tileDimensions: Dimensions;
  cellsX: number;
  cellsY: number;
  cellsZ: number;
}

export class TerrainGridDescriptorImpl implements TerrainGridDescriptor {
  constructor (private readonly _cellHeightGrid: Array<Array<number>>,
               private readonly _typeGrid: Array<Array<TerrainType>>,
               private readonly _shapeGrid: Array<Array<TerrainShape>>,
               private readonly _tileDimensions: Dimensions,
               private readonly _cellsX: number,
               private readonly _cellsY: number,
               private readonly _cellsZ: number) { }
  get cellHeightGrid(): Array<Array<number>> {
    return this._cellHeightGrid;
  }
  get typeGrid(): Array<Array<TerrainType>> {
    return this._typeGrid;
  }
  get shapeGrid(): Array<Array<TerrainShape>> {
    return this._shapeGrid;
  }
  get tileDimensions(): Dimensions {
    return this._tileDimensions;
  }
  get cellsX(): number {
    return this._cellsX;
  }
  get cellsY(): number {
    return this._cellsY;
  }
  get cellsZ(): number {
    return this._cellsZ;
  }
}

export class TerrainGrid {
  private _surfaceTerrain: Array<Array<Terrain>> = new Array<Array<Terrain>>();
  private readonly _cellsX: number;
  private readonly _cellsY: number;
  private readonly _dimensions: Dimensions;
  private _totalSurface = 0;
  private _totalSubSurface = 0;

  constructor(
    private readonly _context: ContextImpl,
    descriptor: TerrainGridDescriptor,
  ) {
    this._cellsX = descriptor.cellsX;
    this._cellsY = descriptor.cellsY;
    this._dimensions  = descriptor.tileDimensions;
    for (let y = 0; y < descriptor.cellsY; ++y) {
      this.surfaceTerrain.push(new Array<Terrain>(descriptor.cellsX));
      for (let x = 0; x < descriptor.cellsX; ++x) {
        let z = descriptor.cellHeightGrid[y][x];
        const terrainShape = descriptor.shapeGrid[y][x];
        const terrainType = descriptor.typeGrid[y][x];
        const position = this.scaleGridToWorld(x, y, z);
        const terrain = new Terrain(this._context, position, this.dimensions, terrainType, terrainShape);
        this.surfaceTerrain[y][x] = terrain;
        this._totalSurface++;

        const zStop = z - this.calcRelativeHeight(x, y, descriptor);
        const shape = Terrain.isFlat(terrainShape)
          ? terrainShape
          : TerrainShape.Flat;
        while (z > zStop) {
          z--;
          const subSurfacePosition = this.scaleGridToWorld(x, y, z);
          new Terrain(this._context, subSurfacePosition, this.dimensions, terrainType, shape);
          this._totalSubSurface++;
        }
      }
    }
  }

  get cellsX(): number {
    return this._cellsX;
  }
  get cellsY(): number {
    return this._cellsY;
  }
  get dimensions(): Dimensions {
    return this._dimensions;
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

  scaleGridToWorld(x: number, y: number, z: number): Point3D {
    return new Point3D(x * this.dimensions.width,
                       y * this.dimensions.depth,
                       z * this.dimensions.height);
  }

  scaleWorldToGrid(loc: Point3D): Point3D {
    // round down
    const width = this.dimensions.width;
    const depth = this.dimensions.depth;
    const height = this.dimensions.height;
    const x = loc.x - (loc.x % width);
    const y = loc.y - (loc.y % depth);
    const z = loc.z - (loc.z % height);
    // then scale to grid
    return new Point3D(
      Math.floor(x / width),
      Math.floor(y / depth),
      Math.floor(z / height)
    );
  }

  calcRelativeHeight(x: number, y: number, descriptor: TerrainGridDescriptor): number {
    let relativeHeight = 0;
    const centreTerrace = descriptor.cellHeightGrid[y][x];

    for (let offset of Navigation.neighbourOffsets) {
      const neighbourX = x + offset.x;
      const neighbourY = y + offset.y;
      if (!this.inbounds(neighbourX, neighbourY)) {
        continue;
      }
      const neighbourTerrace = descriptor.cellHeightGrid[neighbourY][neighbourX];
      console.assert(
        neighbourTerrace >= 0,
        "Found neighbour with negative terrace!",
        neighbourTerrace
      );
      const height = centreTerrace - neighbourTerrace;
      relativeHeight = Math.max(height, relativeHeight);
    }
    return relativeHeight;
  }

  inbounds(x: number, y: number): boolean {
    return x >= 0 && x < this.cellsX &&
           y >= 0 && y < this.cellsY;
  }

  getSurfaceTerrainAt(x: number, y: number): Terrain | null {
    if (!this.inbounds(x, y)) {
      return null;
    }
    return this.surfaceTerrain[y][x];
  }

  getSurfaceTerrainAtPoint(loc: Point3D): Terrain | null {
    const scaled: Point3D = this.scaleWorldToGrid(loc);
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

    for (const offset of Navigation.neighbourOffsets) {
      const scaled: Point3D = this.scaleWorldToGrid(centre.surfaceLocation);
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
