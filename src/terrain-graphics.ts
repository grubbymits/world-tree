import {
  ContextImpl
} from './context.ts';
import {
  getTerrainShapeName,
  getTerrainTypeName,
  TerrainShape,
  TerrainType
} from './terraform.ts';
import {
  Sprite,
  SpriteSheet,
  GraphicComponent,
  StaticGraphicComponent,
} from './graphics.ts';

export interface TerrainSpriteDescriptor {
  spriteWidth: number;
  spriteHeight: number;
  spriteSheetName: string;
  tileRowTypes: Array<TerrainType>;
  tileColumnShapes: Array<TerrainShape>;
};

export class TerrainGraphics {
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
        getTerrainTypeName(terrainType)
      );
    } else if (!this._terrainGraphics.get(terrainType)!.has(shape)) {
      console.error(
        "missing graphics for TerrainShape:",
        getTerrainShapeName(shape)
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
}
