import { Entity,
         Actor } from "./entity.js"
import { EntityEvent } from "./events.js"
import { BoundingCuboid } from "./physics.js"
import { Point3D,
         Vector3D,
         Geometry } from "./geometry.js"
import { Octree } from "./tree.js"
import { SquareGrid  } from "./map.js"

export abstract class Action {
  constructor(protected _actor: Actor) { }
  get actor(): Actor { return this._actor; }
  set actor(actor: Actor) { this._actor = actor; }
  // Returns true once the action is complete.
  abstract perform(): boolean;
}

export class MoveDirection extends Action {
  constructor(actor: Actor,
              private readonly _dx: number,
              private readonly _dy: number,
              private readonly _dz: number,
              private _bounds: BoundingCuboid) {
    super(actor);
  }

  perform(): boolean {
    this.actor.updateLocation(this._dx, this._dy, this._dz);
    this.actor.postEvent(EntityEvent.Move);
    return !this._bounds.contains(this.actor.location);
  }
}

export class MoveDestination extends Action {
  private _dx: number = 0;
  private _dy: number = 0;
  private _dz: number = 0;

  constructor(actor: Actor,
              private _step: number,
              private _destination: Point3D) {
    super(actor);
    this.destination = _destination;
  }

  get destination(): Point3D { return this._destination; }

  set speed(speed: number) { this._step = speed; }

  set destination(destination: Point3D) {
    this._destination = destination;
    let dx = destination.x - this.actor.x;
    let dy = destination.y - this.actor.y;
    let dz = destination.z - this.actor.z;

    console.assert(dx == 0 || dy == 0 || dz == 0,
                   "can only change distance along two axes simultaneously");

    // Handle simple changes on one axis.
    if (dx == 0 && dy == 0 && dz == 0) {
      return;
    } else if (dx == 0 && dz == 0) {
      this._dx = 0;
      this._dy = this._step;
      this._dz = 0;
      return;
    } else if (dy == 0 && dz == 0) {
      this._dy = 0;
      this._dx = this._step;
      this._dz = 0;
      return;
    } else if (dx == 0 && dy == 0) {
      this._dx = 0;
      this._dy = 0;
      this._dz = this._step;
      return;
    }

    // H == step;
    // tan-1(O/A) = theta;
    // sin(theta) = O/H;
    // cos(theta) = A/H;
    let adjacent = 0;
    let opposite = 0;
    if (dz == 0) {
      adjacent = dy > 0 ? dy : dx;
      opposite = dy > 0 ? dx : dy;
    } else if (dx == 0) {
      adjacent = dz > 0 ? dy : dz;
      opposite = dz > 0 ? dz : dy;
    } else if (dy == 0) {
      adjacent = dz > 0 ? dx : dz;
      opposite = dz > 0 ? dz : dx;
    }
    let theta = Math.atan(opposite / adjacent) * 180 / Math.PI;
    let oppDiff = Math.sin(theta) * this._step;
    let adjDiff = Math.cos(theta) * this._step;

    if (dz == 0) {
      this._dx = adjacent == dy ? oppDiff : adjDiff;
      this._dy = adjacent == dy ? adjDiff : oppDiff;
    } else if (dx == 0) {
      this._dz = adjacent == dy ? oppDiff : adjDiff;
      this._dy = adjacent == dy ? adjDiff : oppDiff;
    } else if (dy == 0) {
      this._dx = adjacent == dz ? oppDiff : adjDiff;
      this._dz = adjacent == dz ? adjDiff : oppDiff;
    }
  }

  perform(): boolean {
    console.log("perform action");
    // Make sure we don't overshoot the destination.
    let x = Math.abs(this.destination.x - this.actor.x) < Math.abs(this._dx) ?
      this.destination.x : this.actor.x + this._dx;
    let y = Math.abs(this.destination.y - this.actor.y) < Math.abs(this._dy) ?
      this.destination.y : this.actor.y + this._dy;
    let z = Math.abs(this.destination.z - this.actor.z) < Math.abs(this._dz) ?
      this.destination.z : this.actor.z + this._dz;

    this.actor.location = new Point3D(x, y, z);
    this.actor.postEvent(EntityEvent.Move);
    return this.actor.location.isNearlySameAs(this.destination);
  }
}

export class Navigate extends Action {
  private _currentStep: MoveDestination;
  private _waypoints: Array<Point3D>;
  private _index: number = 0;

  constructor(actor: Actor,
              private readonly _step: number,
              private readonly _destination: Point3D,
              private readonly _map: SquareGrid,
              private readonly _boundsInfo: Octree) {
    super(actor);
    this._waypoints = this.findPath();
    if (this._waypoints.length != 0) {
      this._currentStep = new MoveDestination(actor, _step, this._waypoints[0]);
    }
  }

  findPath(): Array<Point3D> {
    return new Array<Point3D>();
    /*
    let path = new Array<Terrain>();
  
    // Adapted from:
    // http://www.redblobgames.com/pathfinding/a-star/introduction.html
    let frontier = new Array<MovementCost>();
    let cameFrom = new Map<number, number>();
    let costSoFar = new Map<number, number>();
    cameFrom.set(begin.id, 0);
    costSoFar.set(begin.id, 0);

    // frontier is a sorted list of locations with their lowest cost
    frontier.push(new MovementCost(begin, 0));

    let current: MovementCost = frontier[0];
    // breadth-first search
    while (frontier.length > 0) {
      current = frontier.shift()!;

      // Found!
      if (current.terrain.id == end.id) {
        break;
      }

      let neighbours: Array<Terrain> =
        this._map.getAccessibleNeighbours(current.terrain);

      let currentLocation: Point3D = current.terrain.surfaceLocation;
      let bounds: BoundingCuboid = actor.bounds;
      for (let next of neighbours) {
        if (!this.canMove(currentLocation, next.surfaceLocation)) {
          continue;
        }
        let newCost = costSoFar.get(current.terrain.id)! +
          this.map.getNeighbourCost(current.terrain, next);

        if (!costSoFar.has(next.id) || newCost < costSoFar.get(next.id)!) {
          frontier.push(new MovementCost(next, newCost));
          costSoFar.set(next.id, newCost);

          frontier.sort((a, b) => {
            if (a.cost > b.cost) {
              return 1;
            } else if (a.cost < b.cost) {
              return -1;
            } else {
              return 0;
            }
          });
          cameFrom.set(next.id, current.terrain.id);
        }
      }
    }

    // Search has ended...
    if (current.terrain.id != end.id) {
      console.log("Could not find a path...");
      return path;
    }

    // finalise the path.
    let step = end;
    path.push(step);
    while (step.id != begin.id) {
      step = this._map.getTerrainFromId(cameFrom.get(step.id)!);
      path.push(step);
    }
    path.reverse();
    return path.splice(1);
    */
  }

  canMove(from: Point3D, to: Point3D): boolean {
    let bounds = this._actor.bounds;
    // Create a bounds to contain the current location and the destination.
    let area = new BoundingCuboid(to, bounds.dimensions);
    area.insert(bounds);

    let entities: Array<Entity> = this._boundsInfo.getEntities(area);
    let path: Vector3D = to.subtract(bounds.bottomCentre);
    let beginMinLocation: Point3D = bounds.minLocation;
    let beginMaxLocation: Point3D = bounds.maxLocation;
    let endMinLocation: Point3D = beginMinLocation.add(path);
    let endMaxLocation: Point3D = beginMaxLocation.add(path);

    for (let entity of entities) {
      let geometry: Geometry = entity.geometry;
      if (geometry.obstructs(beginMinLocation, endMinLocation) ||
          geometry.obstructs(beginMaxLocation, endMaxLocation)) {
        return false;
      }
    }
    return true;
  }

  perform(): boolean {
    // Maybe there's no path to the destination.
    if (this._waypoints.length == 0) {
      return true;
    }

    let finishedStep: boolean = this._currentStep.perform();
    if (!finishedStep) {
      return false;
    }

    this._index++;
    if (this._index == this._waypoints.length) {
      return true;
    }

    // Check that nextLocation is still free.
    let nextLocation = this._waypoints[this._index];
    if (this.canMove(this._actor.location, nextLocation)) {
      this._currentStep =
        new MoveDestination(this._actor, this._step, nextLocation);
      return false;
    }
    // Otherwise, recompute the path.
    this._waypoints = this.findPath();
    if (this._waypoints.length != 0) {
      this._index = 0;
      this._currentStep =
        new MoveDestination(this._actor, this._step, this._waypoints[0]);
      return false;
    }
    return true; // can't perform the move anymore.
  }
}
