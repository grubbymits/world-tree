import { Location } from "./physics.js"
import { GraphicComponent } from "./graphics.js"

export class Entity {
  private static _ids: number = 0;

  private readonly _id: number;

  constructor(protected _location: Location,
              protected readonly _width: number,    // x-axis
              protected readonly _depth: number,    // y-axis
              protected readonly _height: number,   // z-axis
              protected readonly _blocking: boolean,
              protected _graphicsComponent: GraphicComponent) {
    this._id = Entity._ids;
    Entity._ids++;
  }
  
  get x(): number {
    return this._location.x;
  }

  get y(): number {
    return this._location.y;
  }

  get z(): number {
    return this._location.z;
  }

  get width(): number {
    return this._width;
  }

  get height(): number {
    return this._height;
  }

  get depth(): number {
    return this._depth;
  }

  get location(): Location {
    return this._location;
  }

  get blocking(): boolean {
    return this._blocking;
  }

  get id(): number {
    return this._id;
  }

  get graphicsComponent(): GraphicComponent {
    return this._graphicsComponent;
  }
}

export class Actor extends Entity {
  constructor(location: Location,
              width : number,     // x-axis
              depth: number,      // y-axis
              height: number,     // z-axis
              graphics: GraphicComponent) {
    super(location, width, depth, height, true, graphics);
  }
}
