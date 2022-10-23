import { Actor } from "./entity.js"
import { EntityEvent } from "./events.js"
import { Direction } from "./navigation.js"
import { BoundingCuboid,
         CollisionDetector,
         CollisionInfo } from "./physics.js"
import { Point3D,
         Vector3D,
         Geometry } from "./geometry.js"
import { Octree } from "./tree.js"

export abstract class Action {
  constructor(protected _actor: Actor) { }
  get actor(): Actor { return this._actor; }
  set actor(actor: Actor) { this._actor = actor; }
  // Returns true once the action is complete.
  abstract perform(): boolean;
}

class MoveAction extends Action {
  constructor(actor: Actor) {
    super(actor);
  }

  obstructed(from: Point3D, to: Point3D): CollisionInfo|null {
    let bounds = this._actor.bounds;
    // Create a bounds to contain the current location and the destination.
    let path: Vector3D = to.vec_diff(from);
    let area = new BoundingCuboid(to, bounds.dimensions);
    area.insert(bounds);
    return CollisionDetector.detectInArea(this._actor, path, area);
  }

  perform(): boolean { return true; }
}

export class MoveDirection extends MoveAction {
  constructor(actor: Actor,
              private readonly _d: Vector3D,
              private _bounds: BoundingCuboid) {
    super(actor);
  }

  perform(): boolean {
    const currentPos = this.actor.bounds.bottomCentre;
    const nextPos = currentPos.add(this._d);
    const obstruction = this.obstructed(currentPos, nextPos);
    if (obstruction == null) {
      this.actor.updatePosition(this._d);
      return false;
    }
    if (obstruction.blocking) {
      this.actor.postEvent(EntityEvent.EndMove);
      return true;
    }
    console.log("adjusting movement with max angle");
    this.actor.updatePosition(this._d);
    return false;
  }
}

export class MoveDestination extends MoveAction {
  private _d: Vector3D;

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
    let currentPos = this.actor.bounds.minLocation;
    let maxD = destination.vec_diff(currentPos);

    console.assert(maxD.x == 0 || maxD.y == 0 || maxD.z == 0,
                   "can only change distance along two axes simultaneously");

    let dx = 0;
    let dy = 0;
    let dz = 0;
    // Handle simple changes on one axis.
    if (maxD.x == 0 && maxD.y == 0 && maxD.z == 0) {
      return;
    } else if (maxD.x == 0 && maxD.z == 0) {
      dx = 0;
      dy = this._step;
      dz = 0;
    } else if (maxD.y == 0 && maxD.z == 0) {
      dy = 0;
      dx = this._step;
      dz = 0;
    } else if (maxD.x == 0 && maxD.y == 0) {
      dx = 0;
      dy = 0;
      dz = this._step;
    } else {
      // H == step;
      // tan-1(O/A) = theta;
      // sin(theta) = O/H;
      // cos(theta) = A/H;
      let adjacent = 0;
      let opposite = 0;
      if (maxD.z == 0) {
        adjacent = maxD.y > 0 ? maxD.y : maxD.x;
        opposite = maxD.y > 0 ? maxD.x : maxD.y;
      } else if (maxD.x == 0) {
        adjacent = maxD.z > 0 ? maxD.y : maxD.z;
        opposite = maxD.z > 0 ? maxD.z : maxD.y;
      } else if (maxD.y == 0) {
        adjacent = maxD.z > 0 ? maxD.x : maxD.z;
        opposite = maxD.z > 0 ? maxD.z : maxD.x;
      }
      let theta = Math.atan(opposite / adjacent) * 180 / Math.PI;
      let oppDiff = Math.sin(theta) * this._step;
      let adjDiff = Math.cos(theta) * this._step;

      if (maxD.z == 0) {
        dx = adjacent == maxD.y ? oppDiff : adjDiff;
        dy = adjacent == maxD.y ? adjDiff : oppDiff;
      } else if (maxD.x == 0) {
        dz = adjacent == maxD.y ? oppDiff : adjDiff;
        dy = adjacent == maxD.y ? adjDiff : oppDiff;
      } else if (maxD.y == 0) {
        dx = adjacent == maxD.z ? oppDiff : adjDiff;
        dz = adjacent == maxD.z ? adjDiff : oppDiff;
      }
    }
    this._d = new Vector3D(dx, dy, dz);
  }

  perform(): boolean {
    console.log("perform action");
    // Make sure we don't overshoot the destination.
    let bounds: BoundingCuboid = this.actor.bounds;
    let location: Point3D = bounds.minLocation;
    let maxD: Vector3D = this.destination.vec_diff(location);
    let minD: Vector3D = maxD.absMin(this._d);
    this.actor.updatePosition(minD);
    this.actor.postEvent(EntityEvent.Moving);
    return bounds.minLocation.isSameAsRounded(this.destination);
  }
}
/*
class MovementCost {
  constructor(private readonly _terrain: Terrain,
              private readonly _cost: number) { }
  get terrain(): Terrain { return this._terrain; }
  get location(): Point3D { return this._terrain.bounds.minLocation; }
  get cost(): number { return this._cost; }
}
*/

export class Navigate extends Action {
  private _currentStep: MoveDestination;
  private _waypoints: Array<Point3D>;
  private _index: number = 0;

  constructor(actor: Actor,
              private readonly _step: number,
              private readonly _destination: Point3D) {
    super(actor);
    this._waypoints = this.findPath();
    if (this._waypoints.length != 0) {
      this._currentStep =
        new MoveDestination(actor, _step, this._waypoints[0]);
    }
  }

  perform(): boolean {
    // Maybe there's no path to the destination.
    if (this._waypoints.length == 0) {
      return true;
    }

    // Perform the current movement until we reach the waypoint, or fail to get
    // there.
    let finishedStep: boolean = this._currentStep.perform();
    if (!finishedStep) {
      return false;
    }

    // If the step is reporting that it's done, check whether it completed or
    // failed. If it failed, try to recompute the path.
    if (!this._currentStep.destination.isSameAsRounded(
        this._actor.bounds.minLocation)) {
      this._waypoints = this.findPath();
      if (this._waypoints.length != 0) {
        this._index = 0;
        this._currentStep =
          new MoveDestination(this._actor, this._step, this._waypoints[0]);
        return false;
      }
      return true; // can no longer reach the destination.
    }

    this._index++;
    if (this._index == this._waypoints.length) {
      return true;
    }

    let nextLocation = this._waypoints[this._index];
    this._currentStep =
      new MoveDestination(this._actor, this._step, nextLocation);
    return false;
  }

  findPath(): Array<Point3D> {
    let path = new Array<Point3D>();
    return path;
    /*
  
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
        if (!this.obstructed(currentLocation, next.surfaceLocation)) {
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
}
