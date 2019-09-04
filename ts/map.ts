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
  static convertToIsometric(coord: Point): Point {
    return new Point(coord.x - coord.y, (coord.x + coord.y) / 2);
  }

  static convertToCartisan(coord: Point) : Point {
    let x = (2 * coord.y + coord.x) / 2;
    let y = (2 * coord.y - coord.x) / 2;
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
    let Scaled = new Point(cellX * width, cellY * height);
    switch (sys) {
    default:
      throw("Unhandled coordinate system");
    case CoordSystem.Cartisan:
      return Scaled;
    case CoordSystem.Isometric:
      return SquareGrid.convertToIsometric(Scaled);
    }
  }
}
