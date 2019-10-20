import { GraphicsComponent } from "./gfx.js"

export class Location {
  constructor(private _x: number,
              private _y: number,
              private _z: number) { }

  get x(): number {
    return this._x;
  }

  get y(): number {
    return this._y;
  }

  get z(): number {
    return this._z;
  }
}

export class GameObject {
  private static _ids: number = 0;

  private readonly _id: number;

  constructor(protected _location: Location,
              protected readonly _width: number,    // x-axis
              protected readonly _depth: number,    // y-axis
              protected readonly _height: number,   // z-axis
              protected readonly _blocking: boolean,
              protected _graphicsComponent: GraphicsComponent) {
    this._id = GameObject._ids;
    GameObject._ids++;
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

  get graphicsComponent(): GraphicsComponent {
    return this._graphicsComponent;
  }
}

export class GameActor extends GameObject {
  constructor(location: Location,
              width : number,     // x-axis
              depth: number,      // y-axis
              height: number,     // z-axis
              graphics: GraphicsComponent) {
    super(location, width, depth, height, true, graphics);
  }
}
