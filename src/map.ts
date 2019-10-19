import { Location, Terrain } from "./entity.js"
import { GraphicsComponent } from "./gfx.js"

export class Point {
  constructor(private readonly _x: number,
              private readonly _y: number) { }
  get x() { return this._x; }
  get y() { return this._y; }
}

class LocationCost {
  constructor(private readonly _location: Location,
              private readonly _cost: number) { }
  get location(): Location { return this._location; }
  get cost(): number { return this._cost; }
}

export class SquareGrid {
  private readonly _neighbourOffsets: Array<Point> =
    [ new Point(-1, -1), new Point(0, -1), new Point(1, -1),
      new Point(-1, 0),                    new Point(1, 0),
      new Point(-1, 1),  new Point(0, 1),  new Point(1, 1), ];

  private _raisedTerrain: Array<Terrain>;
  private _floor: Array<Array<Terrain>>;

  constructor(private readonly _width: number,
              private readonly _height: number,
              tileWidth: number,  // x
              tileDepth: number,  // y
              tileHeight: number, // z
              component: GraphicsComponent) {
    this._raisedTerrain = new Array<Terrain>();
    this._floor = new Array<Array<Terrain>>();
    Terrain.init(tileWidth, tileDepth, tileHeight);
    console.log("creating map", _width, _height);

    for (let x = 0; x < this._width; x++) {
      this._floor[x] = new Array<Terrain>();
      for (let y = 0; y < this._height; y++) {
        this._floor[x].push(new Terrain(x, y, 0, component));
      }
    }
  }

  get width(): number {
    return this._width;
  }

  get height(): number {
    return this._height;
  }

  get raisedTerrain(): Array<Terrain> {
    return this._raisedTerrain;
  }

  addRaisedTerrain(x: number, y: number, z: number,
                   component: GraphicsComponent): Terrain {
    let terrain = new Terrain(x, y, z, component);
    this._raisedTerrain.push(terrain);
    return terrain;
  }

  getFloor(x: number, y: number): Terrain {
    return this._floor[x][y];
  }

  getLocation(x: number, y: number): Location {
    return this._floor[x][y].location;
  }

  getNeighbourCost(centre: Location, to: Location): number {
    // If a horizontal, or vertical, move cost 1 then a diagonal move would be
    // 1.444... So scale by 2 and round. Double the cost of changing height.
    if ((centre.x == to.x) || (centre.y == to.y)) {
      return centre.z == to.z ? 2 : 4;
    }
    return centre.z == to.z ? 3 : 6;
  }
  
  getNeighbours(centre: Location): Array<Location> {
    let neighbours = new Array<Location>();
    
    for (let offset of this._neighbourOffsets) {
      let neighbour = this.getLocation(centre.x + offset.x,
                                       centre.y + offset.y);
      neighbours.push(neighbour);
    }
    return neighbours;
  }

  isBlocked(loc: Location): boolean {
    return this._floor[loc.x][loc.y].blocking;
  }

  objectId(loc: Location): number {
    return this._floor[loc.x][loc.y].id;
  }

  findPath(begin: Location, end: Location) : Array<Location> {
    let path = new Array<Location>();
    if (this.isBlocked(end))
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
      if (this.objectId(current.location) == this.objectId(end)) {
        break;
      }

      let neighbours: Array<Location> = this.getNeighbours(current.location);
      for (let next of neighbours) {
        let newCost: number = costSoFar.get(this.objectId(current.location)) +
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
    if (this.objectId(current.location) != this.objectId(end)) {
      console.log("Could not find a path...");
      return path;
    }

    // finalise the path.
    let step: Location = end;
    path.push(step);
    while (this.objectId(step) != this.objectId(begin)) {
      step = cameFrom.get(step);
      path.push(step);
    }
    path.reverse();
    return path.splice(1);
  }
}
