import { Location,
         Dimensions } from "./physics.js"
import { Point,
         CoordSystem,
         GraphicComponent,
         CartisanRenderer,
         IsometricRenderer } from "./graphics.js"

export class Entity {
  private static _ids: number = 0;

  private readonly _id: number;

  protected _graphicComponents: Array<GraphicComponent>;

  constructor(protected _location: Location,
              protected readonly _dimensions: Dimensions,
              protected readonly _blocking: boolean,
              graphicComponent: GraphicComponent,
              protected readonly _static: boolean) {
    this._id = Entity._ids;
    Entity._ids++;
    this._graphicComponents = new Array<GraphicComponent>();
    this._graphicComponents.push(graphicComponent);
  }
  
  get x(): number { return this._location.x; }
  get y(): number { return this._location.y; }
  get z(): number { return this._location.z; }
  get width(): number { return this._dimensions.width; }
  get depth(): number { return this._dimensions.depth; }
  get height(): number { return this._dimensions.height; }
  get location(): Location { return this._location; }
  get dimensions(): Dimensions { return this._dimensions; }
  get blocking(): boolean { return this._blocking; }
  get id(): number { return this._id; }
  get static(): boolean { return this._static; }
  get graphics(): Array<GraphicComponent> {
    return this._graphicComponents;
  }
}

// An entity which will not change location, which allows the us to calculate
// its render coordinates on construction.
export class StaticEntity extends Entity {
  protected readonly _drawCoord: Point;

  constructor(location: Location,
              dimensions: Dimensions,
              blocking: boolean,
              graphicsComponent: GraphicComponent,
              sys: CoordSystem) {
    super(location, dimensions, blocking, graphicsComponent, true);

    this._drawCoord = sys == CoordSystem.Isometric ?
      IsometricRenderer.getDrawCoord(this) :
      CartisanRenderer.getDrawCoord(this);
  }

  get drawCoord(): Point { return this._drawCoord; }

  addGraphic(graphic: GraphicComponent): void {
    this._graphicComponents.push(graphic);
  }
}

