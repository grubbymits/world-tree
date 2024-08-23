import { Direction } from "./utils/navigation.ts";
import { Dimensions } from "./physics.ts";
import { PhysicalEntity } from "./entity.ts";
import {
  GraphicComponent,
  Sprite,
  SpriteSheet,
  StaticGraphicComponent,
} from "./graphics.ts";
import { ContextImpl } from "./context.ts";
import { Point3D } from "./utils/geometry3d.ts";
import { EntityBounds } from "./bounds.ts";


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
  Inside,
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
  spriteSheetName: string;
  tileRowTypes: Array<TerrainType>;
  tileColumnShapes: Array<TerrainShape>;
};

export class Terrain {
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
        "missing graphics for TerrainType:",
        Terrain.getTypeName(terrainType)
      );
    } else if (!this._terrainGraphics.get(terrainType)!.has(shape)) {
      console.error(
        "missing graphics for TerrainShape:",
        Terrain.getShapeName(shape)
      );
    }
    return this._terrainGraphics.get(terrainType)!.get(shape)!;
  }

  private static addGraphic(
    terrainType: TerrainType,
    terrainShape: TerrainShape,
    sheet: SpriteSheet,
    x: number,
    y: number,
    width: number,
    height: number
  ) {
    const spriteId = Sprite.create(sheet, x, y, width, height);
    const component = new StaticGraphicComponent(spriteId);
    if (!this._terrainGraphics.has(terrainType)) {
      this._terrainGraphics.set(
        terrainType,
        new Map<TerrainShape, GraphicComponent>()
      );
    }
    this._terrainGraphics.get(terrainType)!.set(terrainShape, component);
  }

  static async generateSprites(desc: TerrainSpriteDescriptor,
                               context: ContextImpl): Promise<void> {
    console.log('generateSprites');
    await SpriteSheet.create(desc.spriteSheetName, context).then((sheet) => {
      const width = desc.spriteWidth;
      const height = desc.spriteHeight;
      const columns = desc.tileColumnShapes.length;
      const rows = desc.tileRowTypes.length;
      for (let row = 0; row < rows; ++row) {
        const terrainType = desc.tileRowTypes[row];
        for (let column = 0; column < columns; ++column) {
          const terrainShape = desc.tileColumnShapes[column];
          this.addGraphic(
            terrainType,
            terrainShape,
            sheet,
            width * column,
            height * row,
            width,
            height
          );
        }
      }
    });
  }

  static isSupportedType(ty: TerrainType): boolean {
    return this._terrainGraphics.has(ty);
  }

  static isSupportedShape(ty: TerrainType, shape: TerrainShape): boolean {
    return (
      this.isSupportedType(ty) && this._terrainGraphics.get(ty)!.has(shape)
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
      case TerrainShape.FlatNorthSouth:
        return "TerrainShape.FlatNorthSouth";
      case TerrainShape.FlatEastWest:
        return "TerrainShape.FlatEastWest";
    }
  }

  static getTypeName(terrain: TerrainType): string {
    switch (terrain) {
      default:
        console.error("unhandled terrain type:", terrain);
        return "invalid terrain";
      case TerrainType.Water:
        return "TerrainType.Water";
      case TerrainType.Inside:
        return "TerrainType.Inside";
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
    private _entity: PhysicalEntity,
    private readonly _type: TerrainType,
    private readonly _shape: TerrainShape
  ) {
    this.entity.addGraphic(Terrain.graphics(_type, _shape));

    // Pre-calculate the angle of the ramp.
    if (!Terrain.isFlat(_shape)) {
      const theta = (Math.atan(this.entity.height / this.entity.depth) * 180) / Math.PI;
      this._tanTheta = Math.tan(theta);
    } else {
      this._tanTheta = 0;
    }

    const x = EntityBounds.centreX(this.entity.id);
    const y = EntityBounds.centreY(this.entity.id);
    const z = this.heightAt(EntityBounds.centre(this.entity.id))!;
    this._surfaceLocation = new Point3D(x, y, z);
  }

  get entity(): PhysicalEntity {
    return this._entity;
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
    if (!EntityBounds.contains(this.entity.id, location)) {
      return null;
    }
    if (Terrain.isFlat(this.shape)) {
      return this.entity.z + this.entity.height;
    }
    return this.entity.z + location.y * this._tanTheta;
  }
}

