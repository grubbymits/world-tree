class Location {
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
  constructor(protected _location: Location,
              protected readonly _width: number,    // x-axis
              protected readonly _height: number,   // z-axis
              protected readonly _depth: number,    // y-axis
              protected readonly _blocking: boolean,
              protected readonly _id: number) { }

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
}

export class GameActor extends GameObject {
  constructor(x: number,
              y: number,
              z: number,
              width : number,   // x-axis
              height: number,   // z-axis
              depth: number) {  // y-axis
    super(x, y, z, width, height, depth, true);
  }
}
