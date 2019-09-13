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
  abstract getNeighbourCost(from: Location, to: Location): number;
  abstract getDrawCoord(cellX: number, cellY: number,
                        width: number, height: number,
                        sys: CoordSystem): Point;

  findPath(begin: Location, end: Location) : Array<Location> {
    let path = new Array<Location>();
    if (end.blocked)
      return path;
  
    // Adapted from:
    // http://www.redblobgames.com/pathfinding/a-star/introduction.html
    let frontier = new Array<LocationCost>();
    let cameFrom = new Map();
    let costSoFar = new Map();
    cameFrom.set(begin, null);
    costSoFar.set(begin, 0);

    // frontier is a sorted list of locations with their lowest cost
    frontier.push(new LocationCost(begin, 0));

    let current: LocationCost = frontier[0];
    // breadth-first search
    while (frontier.length > 0) {
      current = frontier.shift()!;

      // Found!
      if (current.id == end.id) {
        break;
      }

      let neighbours: Array<Location> = this.getNeighbours(current.location);
      for (let next of neighbours) {
        let newCost: number = costSoFar.get(current.id) +
        this.getNeighbourCost(current.location, next);

        if (!costSoFar.has(next) || newCost < costSoFar.get(next)) {
          frontier.push(new LocationCost(next, newCost));
          costSoFar.set(next, newCost);

          frontier.sort((a, b) => {
            if (a.cost > b.cost) {
              return 1;
            } else if (a.cost < b.cost) {
              return -1;
            } else {
              return 0;
            }
          });
          cameFrom.set(next, current);
        }
      }
    }

    // Search has ended...
    if (current.id != end.id) {
      console.log("Could not find a path...");
      return path;
    }

    // finalise the path.
    let step: Location = end;
    path.push(step);
    while (step.id != begin.id) {
      step = cameFrom.get(step);
      path.push(step);
    }
    path.reverse();
    return path.splice(1);
  }
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

  getNeighbourCost(centre: Location, to: Location): number {
    // If a horizontal, or vertical, move cost 1 then a diagonal move would be
    // 1.444... So scale by 2 and round.
    if ((centre.x == to.x) || (centre.y == to.y)) {
      return 2;
    }
    return 3;
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

class LocationCost {
  constructor(private readonly _location: Location,
              private readonly _cost: number) { }
  get location(): Location { return this._location; }
  get id(): number { return this._location.id }
  get cost(): number { return this._cost; }
}

