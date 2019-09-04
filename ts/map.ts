export class Point {
  constructor(private readonly _x: number,
              private readonly _y: number) { }
  get x() { return this._x; }
  get y() { return this._y; }
}

export class Location {
  private _spriteId: number;

  constructor(private readonly _blocking: boolean,
              private readonly _x: number,
              private readonly _y: number,
              private readonly _id: number) {
    this._spriteId = 0;
  }

  get x(): number {
    return this._x;
  }

  get y(): number {
    return this._y;
  }

  get id(): number {
    return this._id;
  }

  get blocked(): boolean {
    return this._blocking;
  }
  
  get spriteId(): number {
    return this._spriteId;
  }
  
  set spriteId(id: number) {
    this._spriteId = id;
  }
}

export enum CoordSystem {
  Cartisan,
  Isometric,
}

export abstract class GameMap {
  constructor(protected _width: number, protected _height: number) { }
  abstract getLocation(x: number, y: number): Location;
  abstract getNeighbours(centre: Location): Array<Location>;
  abstract getDrawCoord(cellX: number, cellY: number,
                        width: number, height: number,
                        sys: CoordSystem): Point;
}

export class SquareGrid extends GameMap {
  static convertToIsometric(x: number, y: number, width: number,
                            height: number): Point {
    let drawX = Math.floor(x * width / 2) + Math.floor(y * width / 2);
    let drawY = Math.floor(y * height / 2) - Math.floor(x * height / 2);
    return new Point(drawX, drawY);
  }

  static convertToCartisan(coord: Point) : Point {
    let x = Math.floor((2 * coord.y + coord.x) / 2);
    let y = Math.floor((2 * coord.y - coord.x) / 2);
    return new Point(x, y);
  }

  private readonly _neighbourOffsets: Array<Point> =
    [ new Point(-1, -1), new Point(0, -1), new Point(1, -1),
      new Point(-1, 0),                    new Point(1, 0),
      new Point(-1, 1),  new Point(0, 1),  new Point(1, 1), ];

  private _locations: Array<Array<Location>>;

  constructor(width: number, height: number) {
    super(width, height);

    let id: number = 0;
    this._locations = new Array<Array<Location>>();
    for (let x = 0; x < this._width; x++) {
      this._locations[x] = new Array<Location>();
      for (let y = 0; y < this._height; y++) {
        this._locations[x].push(new Location(false, x, y, id));
        ++id;
      }
    }
  }
  
  getLocation(x: number, y: number): Location {
    return this._locations[x][y];
  }
  
  getNeighbours(centre: Location): Array<Location> {
    let neighbours = new Array<Location>();
    
    for (let offset of this._neighbourOffsets) {
      let neighbour = this.getLocation(centre.x + offset.x, centre.y + offset.y);
      neighbours.push(neighbour);
    }
    return neighbours;
  }
  
  getDrawCoord(cellX: number, cellY: number, width: number, height: number,
               sys: CoordSystem): Point {

    switch (sys) {
    default:
      throw("Unhandled coordinate system");
    case CoordSystem.Cartisan:
      return new Point(cellX * width, cellY * height);
    case CoordSystem.Isometric:
      return SquareGrid.convertToIsometric(cellX, cellY, width, height);
    }
  }
}
