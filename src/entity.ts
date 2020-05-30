import { Location,
         Dimensions } from "./physics.js"
import { Point,
         GraphicComponent,
         IsometricRenderer } from "./graphics.js"

export class Entity {
  private static _ids: number = 0;

  private readonly _id: number;

  protected readonly _hasMoved: boolean = false;
  protected _drawCoord: Point = new Point(0, 0);
  protected _graphicComponents: Array<GraphicComponent>;

  constructor(protected _location: Location,
              protected readonly _dimensions: Dimensions,
              protected readonly _blocking: boolean,
              graphicComponent: GraphicComponent) {
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
  get hasMoved(): boolean { return this._hasMoved; }
  get drawCoord(): Point { return this._drawCoord; }
  get graphics(): Array<GraphicComponent> {
    return this._graphicComponents;
  }

  set drawCoord(coord: Point) { this._drawCoord = coord; }

  addGraphic(graphic: GraphicComponent): void {
    this._graphicComponents.push(graphic);
  }
}
