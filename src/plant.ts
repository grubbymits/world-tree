export class Plant extends StaticEntity {
  private static _graphics = new Map<PlantType, GraphicComponent>();

  static addGraphics(plantType: PlantType,
                     graphic: GraphicComponent) {
    this._graphics.set(plantType, graphic);
  }

  constructor(location: Location,
              dimensions: Dimensions,
              blocking: boolean,
              plantType: PlantType) {
    super(location, dimensions, blocking, Plant.graphics.get(PlantType)!);
  }
}
