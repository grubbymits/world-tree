import { Drawable, Renderer } from "./gfx.js"

export enum CoordSystem {
  Cartisan,
  Isometric,
}

export class Point {
  constructor(private readonly _x: number,
              private readonly _y: number) { }
  get x() { return this._x; }
  get y() { return this._y; }
}

export class Location extends Drawable {

  constructor(private readonly _blocking: boolean,
              x: number, y: number, z: number,
              coord: Point,
              private readonly _id: number) {
    super(x, y, z, coord);
    this._spriteId = 0;
  }


  get id(): number {
    return this._id;
  }

  get blocked(): boolean {
    return this._blocking;
  }
}

class LocationCost {
  constructor(private readonly _location: Location,
              private readonly _cost: number) { }
  get location(): Location { return this._location; }
  get id(): number { return this._location.id }
  get cost(): number { return this._cost; }
}

export abstract class SquareGrid {
  private readonly _neighbourOffsets: Array<Point> =
    [ new Point(-1, -1), new Point(0, -1), new Point(1, -1),
      new Point(-1, 0),                    new Point(1, 0),
      new Point(-1, 1),  new Point(0, 1),  new Point(1, 1), ];

  protected _ids: number;
  protected _raisedLocations: Array<Location>;
  protected _locations: Array<Array<Location>>;

  abstract getDrawCoord(cellX: number, cellY: number, cellZ: number): Point;
  abstract drawFloor(camera: Point, gfx: Renderer): void;
  abstract sortDrawables(drawables: Array<Drawable>): void;

  constructor(protected _width: number, protected _height: number,
              protected _tileWidth: number, protected _tileHeight: number) {
    this._ids = 0;
    this._raisedLocations = new Array<Location>();
    this._locations = new Array<Array<Location>>();
    for (let x = 0; x < this._width; x++) {
      this._locations[x] = new Array<Location>();
      for (let y = 0; y < this._height; y++) {
        let coord = this.getDrawCoord(x, y, 0);
        this._locations[x].push(new Location(false, x, y, 0, coord, this._ids));
        this._ids++;
      }
    }
  }

  get width(): number {
    return this._width;
  }

  get height(): number {
    return this._height;
  }

  get raisedLocations(): Array<Location> {
    return this._raisedLocations;
  }

  addRaisedLocation(x: number, y: number, z: number): Location {
    let coord = this.getDrawCoord(x, y, z);
    let location: Location = new Location(false, x, y, z, coord, this._ids);
    this._ids++;
    this._raisedLocations.push(location);
    return location;
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

export class IsometricGrid extends SquareGrid {
  static convertToIsometric(x: number, y: number, width: number,
                            height: number): Point {
    let drawX = Math.floor(x * width / 2) + Math.floor(y * width / 2);
    let drawY = Math.floor(y * height / 2) - Math.floor(x * height / 2);
    return new Point(drawX, drawY);
  }

  getDrawCoord(x: number, y: number, z: number): Point {
    let width = this._tileWidth;
    let height = this._tileHeight;
    return IsometricGrid.convertToIsometric(x, y, width, height);
  }

  drawFloor(camera: Point, gfx: Renderer) {
    for (let y = 0; y < this._height; y++) {
      for (let x = this._width - 1; x >= 0; x--) {
        let location = this.getLocation(x, y);
        let newCoord = new Point(location.drawPoint.x + camera.x,
                                 location.drawPoint.y + camera.y);
        gfx.draw(newCoord, location.spriteId);
      }
    }
  }

  sortDrawables(drawables: Array<Drawable>): void {
    // We're drawing a 2D map, so depth is being simulated by the position on
    // the X axis and the order in which those elements are drawn. Insert
    // the new location and sort the array by draw order.
    drawables.sort((a, b) => {
      if (a.z < b.z) {
        return 1;
      } else if (b.z < a.z) {
        return -1;
      }
      if (a.x < b.x) {
        return 1;
      } else if (b.x < a.x) {
        return -1;
      }
      return 0;
    });
  }
}

export class CartisanGrid extends SquareGrid {

  getDrawCoord(x: number, y: number, z: number): Point {
    let width = this._tileWidth;
    let height = this._tileHeight;
    return new Point(x * width, (y * height) - (z * height));
  }

  drawFloor(camera: Point, gfx: Renderer) {
    for (let y = 0; y < this._height; y++) {
      for (let x = 0; x < this._width; x++) {
        let location = this.getLocation(x, y);
        let coord = this.getDrawCoord(x, y, 0);
        let newCoord = new Point(coord.x + camera.x, coord.y + camera.y);
        gfx.draw(newCoord, location.spriteId);
      }
    }
  }

  sortDrawables(drawables: Array<Drawable>): void {
    // We're drawing a 2D map, so depth is being simulated by the position on
    // the Y axis and the order in which those elements are drawn. Insert
    // the new location and sort the array by draw order.
    drawables.sort((a, b) => {
      if (a.z < b.z) {
        return 1;
      } else if (b.z < a.z) {
        return -1;
      }
      if (a.y < b.y) {
        return 1;
      } else if (b.y < a.y) {
        return -1;
      }
      return 0;
    });
  }
}

