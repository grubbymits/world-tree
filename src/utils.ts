
export class Coord {
  constructor(
    private readonly _x: number,
    private readonly _y: number
  ) { }
  get x(): number { return this._x; }
  get y(): number { return this._y; }
}
