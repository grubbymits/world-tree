export class Point {
  constructor(private readonly _x: number,
              private readonly _y: number) { }
  get x() { return this._x; }
  get y() { return this._y; }
} // end class Point

export class Location {
  private _spriteId: number;

  constructor(private readonly _blocking: boolean,
              private readonly _x: number,
              private readonly _y: number,
              private readonly _z: number,
              private readonly _id: number) {
    this._spriteId = 0;
  }

  get x(): number {
    return this._x;
  }

  get y(): number {
    return this._y;
  }

  get z(): number {
    return this._z;
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
} // end class Location

export enum CoordSystem {
  Cartisan,
  Isometric,
}

export abstract class GameMap {
  constructor(protected _width: number, protected _height: number,
              protected _tileWidth: number, protected _tileHeight: number) {
    this._ids = 0;
    this._raisedLocations = new Array<Location>();
  }

  protected _ids: number;
  protected _raisedLocations: Array<Location>;

  abstract getLocation(x: number, y: number): Location;
  abstract addRaisedLocation(x: number, y: number, z: number): Location;
  abstract getNeighbours(centre: Location): Array<Location>;
  abstract getNeighbourCost(from: Location, to: Location): number;
  abstract getDrawCoord(cellX: number, cellY: number, cellZ: number,
                        sys: CoordSystem): Point;

  get width(): number {
    return this._width;
  }

  get height(): number {
    return this._height;
  }

  get raisedLocations(): Array<Location> {
    return this._raisedLocations;
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
} // end class GameMap

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

  constructor(width: number, height: number, tileWidth: number,
              tileHeight: number) {
    super(width, height, tileWidth, tileHeight);
    this._locations = new Array<Array<Location>>();
    for (let x = 0; x < this._width; x++) {
      this._locations[x] = new Array<Location>();
      for (let y = 0; y < this._height; y++) {
        this._locations[x].push(new Location(false, x, y, 0, this._ids));
        this._ids++;
      }
    }
  }

  addRaisedLocation(x: number, y: number, z: number): Location {
    let location: Location = new Location(false, x, y, z, this._ids);
    this._raisedLocations.push(location);
    this._ids++;

    // We're drawing a 2D map, so depth is being simulated by the position on
    // the Y axis and the order in which those elements are drawn. Insert
    // the new location and sort the array by draw order.
    this._raisedLocations.sort((a, b) => {
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
    return location;
  }
  
  getLocation(x: number, y: number): Location {
    return this._locations[x][y];
  }

  get raisedLocations(): Array<Location> {
    return this._raisedLocations;
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
  
  getDrawCoord(x: number, y: number, z: number, sys: CoordSystem): Point {
    let width = this._tileWidth;
    let height = this._tileHeight;
    switch (sys) {
    default:
      throw("Unhandled coordinate system");
    case CoordSystem.Cartisan:
      return new Point(x * width, (y * height) - (z * height));
    case CoordSystem.Isometric:
      return SquareGrid.convertToIsometric(x, y, width, height);
    }
  }
} // end class SquareGrid

class LocationCost {
  constructor(private readonly _location: Location,
              private readonly _cost: number) { }
  get location(): Location { return this._location; }
  get id(): number { return this._location.id }
  get cost(): number { return this._cost; }
} // end class LocationCost

export class SpriteSheet {
  private _image: HTMLImageElement;

  constructor(name: string) {
    this._image = new Image();

    if (name) {
      this._image.src = name + ".png";
    } else {
      throw new Error("No filename passed");
    }
    console.log("load", name);
  }

  get image(): HTMLImageElement {
    return this._image;
  }
} // end class SpriteSheet

export class Sprite {
  constructor(private readonly _sheet: SpriteSheet,
              private readonly _offsetX: number,
              private readonly _offsetY: number,
              private readonly _width: number,
              private readonly _height: number) { }

  render(coord: Point, ctx: CanvasRenderingContext2D): void {
    ctx.drawImage(this._sheet.image,
                  this._offsetX, this._offsetY,
                  this._width, this._height,
                  coord.x, coord.y,
                  this._width, this._height);
  }
} // end class Sprite

export class Renderer {
  constructor(private _ctx: CanvasRenderingContext2D,
              private readonly _width: number,
              private readonly _height: number,
              private _sprites: Array<Sprite>) { }

  clear(): void {
    this._ctx.fillStyle = '#000000';
    this._ctx.fillRect(0, 0, this._width, this._height);
  }

  render(coord: Point, id: number): void {
    this._sprites[id].render(coord, this._ctx);
  }
} // end class Renderer

export function renderRaised(gameMap: GameMap, camera: Point, sys: CoordSystem,
                             gfx: Renderer) {
  let locations: Array<Location> = gameMap.raisedLocations;
  if (sys == CoordSystem.Cartisan) {
    for (let i in locations) {
      let location = locations[i];
      let coord = gameMap.getDrawCoord(location.x, location.y, 0, sys);
      let newCoord = new Point(coord.x + camera.x, coord.y + camera.y);
      gfx.render(newCoord, location.spriteId);
    }
  }
}

export function renderFloor(gameMap: GameMap, camera: Point, sys: CoordSystem,
                            gfx: Renderer) {
  if (sys == CoordSystem.Cartisan) {
    for (let y = 0; y < gameMap.height; y++) {
      for (let x = 0; x < gameMap.width; x++) {
        let location = gameMap.getLocation(x, y);
        let coord = gameMap.getDrawCoord(x, y, 0, sys);
        let newCoord = new Point(coord.x + camera.x, coord.y + camera.y);
        gfx.render(newCoord, location.spriteId);
      }
    }
  } else if (sys == CoordSystem.Isometric) {
    for (let y = 0; y < gameMap.height; y++) {
      for (let x = gameMap.width - 1; x >= 0; x--) {
        let location = gameMap.getLocation(x, y);
        let coord = gameMap.getDrawCoord(x, y, 0, sys);
        let newCoord = new Point(coord.x + camera.x, coord.y + camera.y);
        gfx.render(newCoord, location.spriteId);
      }
    }
  } else {
    throw("invalid coordinate system");
  }
}
