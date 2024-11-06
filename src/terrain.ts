import {
  GraphicComponent,
  Sprite,
  SpriteSheet,
  StaticGraphicComponent,
} from "./graphics.ts";
import { ContextImpl } from "./context.ts";

export const enum TerrainShape {
  Flat,                 // 0
  Wall,                 // 1
  NorthEdge,            // 2
  EastEdge,             // 3
  NorthEastCorner,      // 4
  SouthEdge,            // 5
  NorthSouthCorridor,   // 6
  SouthEastCorner,      // 7
  EastPeninsula,        // 8
  WestEdge,             // 9
  NorthWestCorner,      // 10
  EastWestCorridor,     // 11
  NorthPeninsula,       // 12
  SouthWestCorner,      // 13
  WestPeninsula,        // 14
  SouthPeninsula,       // 15
  Spire,                // 16
  RampNorth,            // 17
  RampEast,             // 18
  RampSouth,            // 19
  RampWest,             // 20
  Max,                  // 21
}

export const enum TerrainType {
  Water,
  Snow,
  Sand,
  Rock,
  Mud,
  DryGrass,
  WetGrass
}

export interface TerrainSpriteDescriptor {
  spriteWidth: number;
  spriteHeight: number;
  spriteSheetName: string;
  tileRowTypes: Array<TerrainType>;
  tileColumnShapes: Array<TerrainShape>;
};

export class Terrain {
  private static readonly defaultSupportedShapes_ = new Map<TerrainShape, boolean>([
    [ TerrainShape.Flat,               true ],
    [ TerrainShape.Wall,               false ],
    [ TerrainShape.NorthEdge,          false ],
    [ TerrainShape.EastEdge,           false ],
    [ TerrainShape.NorthEastCorner,    false ],
    [ TerrainShape.SouthEdge,          false ],
    [ TerrainShape.NorthSouthCorridor, false ],
    [ TerrainShape.SouthEastCorner,    false ],
    [ TerrainShape.EastPeninsula,      false ],
    [ TerrainShape.WestEdge,           false ],
    [ TerrainShape.NorthWestCorner,    false ],
    [ TerrainShape.EastWestCorridor,   false ],
    [ TerrainShape.NorthPeninsula,     false ],
    [ TerrainShape.SouthWestCorner,    false ],
    [ TerrainShape.WestPeninsula,      false ],
    [ TerrainShape.SouthPeninsula,     false ],
    [ TerrainShape.Spire,              false ],
    [ TerrainShape.RampNorth,          false ],
    [ TerrainShape.RampEast,           false ],
    [ TerrainShape.RampSouth,          false ],
    [ TerrainShape.RampWest,           false ],
  ]);
  private static _supportedShapes = new Map<TerrainShape, boolean>(this.defaultSupportedShapes_);
    
  private static _terrainGraphics = new Map<
    TerrainType,
    Map<TerrainShape, GraphicComponent>
  >();

  static reset(): void {
    this._terrainGraphics = new Map<
      TerrainType,
      Map<TerrainShape, GraphicComponent>
    >();
    this._supportedShapes = new Map<TerrainShape, boolean>(this.defaultSupportedShapes_);
  }

  static isSupportedShape(shape: TerrainShape): boolean {
    return this._supportedShapes.get(shape)!;
  }

  static setSupportedShape(shape: TerrainShape): void {
    this._supportedShapes.set(shape, true);
  }

  static isSupportedType(ty: TerrainType): boolean {
    return this._terrainGraphics.has(ty);
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
    this.setSupportedShape(terrainShape);
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

  static getShapeName(terrain: TerrainShape): string {
    switch (terrain) {
      default:
        console.error("unhandled terrain shape:", terrain);
        return "invalid shape";
      case TerrainShape.Flat:
        return "TerrainShape.Flat";
      case TerrainShape.Wall:
        return "TerrainShape.Wall";
      case TerrainShape.NorthEdge:
        return "TerrainShape.NorthEdge";
      case TerrainShape.EastEdge:
        return "TerrainShape.EastEdge";
      case TerrainShape.NorthEastCorner:
        return "TerrainShape.NorthEastCorner";
      case TerrainShape.SouthEdge:
        return "TerrainShape.SouthEdge";
      case TerrainShape.NorthSouthCorridor:
        return "TerrainShape.NorthSouthCorridor";
      case TerrainShape.SouthEastCorner:
        return "TerrainShape.SouthEastCorner";
      case TerrainShape.EastPeninsula:
        return "TerrainShape.EastPeninsula";
      case TerrainShape.WestEdge:
        return "TerrainShape.WestEdge";
      case TerrainShape.NorthWestCorner:
        return "TerrainShape.NorthWestCorner";
      case TerrainShape.EastWestCorridor:
        return "TerrainShape.EastWestCorridor";
      case TerrainShape.NorthPeninsula:
        return "TerrainShape.NorthPeninsula";
      case TerrainShape.SouthWestCorner:
        return "TerrainShape.SouthWestCorner";
      case TerrainShape.WestPeninsula:
        return "TerrainShape.WestPeninsula";
      case TerrainShape.SouthPeninsula:
        return "TerrainShape.SouthPeninsula";
      case TerrainShape.Spire:
        return "TerrainShape.Spire";
      case TerrainShape.RampNorth:
        return "TerrainShape.RampNorth";
      case TerrainShape.RampEast:
        return "TerrainShape.RampEast";
      case TerrainShape.RampSouth:
        return "TerrainShape.RampSouth";
      case TerrainShape.RampWest:
        return "TerrainShape.RampWest";
    }
  }

  static getTypeName(terrain: TerrainType): string {
    switch (terrain) {
      default:
        console.error("unhandled terrain type:", terrain);
        return "invalid terrain";
      case TerrainType.Water:
        return "TerrainType.Water";
      case TerrainType.Snow:
        return "TerrainType.Snow";
      case TerrainType.Sand:
        return "TerrainType.Sand";
      case TerrainType.Rock:
        return "TerrainType.Rock";
      case TerrainType.Mud:
        return "TerrainType.Mud";
      case TerrainType.DryGrass:
        return "TerrainType.DryGrass";
      case TerrainType.WetGrass:
        return "TerrainType.WetGrass";
    }
  }

  static isRamp(terrain: TerrainShape): boolean {
    switch (terrain) {
      default:
        break;
      case TerrainShape.RampNorth:
      case TerrainShape.RampEast:
      case TerrainShape.RampSouth:
      case TerrainShape.RampWest:
        return true;
    }
    return false;
  }

  static isEdge(terrain: TerrainShape): boolean {
    return !Terrain.isRamp(terrain) && terrain != TerrainShape.Flat;
  }
}
