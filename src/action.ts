import { Actor } from "./entity.ts";
import { EntityEvent } from "./events.ts";
import { BoundingCuboid, CollisionDetector, CollisionInfo } from "./physics.ts";
import { Point3D, Vector3D } from "./geometry.ts";

export abstract class Action {
  constructor(protected _actor: Actor) {}
  get actor(): Actor {
    return this._actor;
  }
  set actor(actor: Actor) {
    this._actor = actor;
  }
  // Returns true once the action is complete.
  abstract perform(): boolean;
}

class MoveAction extends Action {
  constructor(actor: Actor) {
    super(actor);
  }

  obstructed(from: Point3D, to: Point3D): CollisionInfo | null {
    const bounds = this._actor.bounds;
    // Create a bounds to contain the current location and the destination.
    const path: Vector3D = to.vec_diff(from);
    const area = new BoundingCuboid(to, bounds.dimensions);
    area.insert(bounds);
    return CollisionDetector.detectInArea(this._actor, path, area);
  }

  perform(): boolean {
    return true;
  }
}

export class MoveDirection extends MoveAction {
  constructor(
    actor: Actor,
    private readonly _d: Vector3D,
    private _bounds: BoundingCuboid,
  ) {
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

  constructor(
    actor: Actor,
    private _step: number,
    private _destination: Point3D,
  ) {
    super(actor);
    this.destination = _destination;
  }

  set speed(speed: number) {
    this._step = speed;
  }

  get destination(): Point3D {
    return this._destination;
  }
  set destination(destination: Point3D) {
    this._destination = destination;
    const currentPos = this.actor.bounds.minLocation;
    const maxD = destination.vec_diff(currentPos);

    console.assert(
      maxD.x == 0 || maxD.y == 0 || maxD.z == 0,
      "can only change distance along two axes simultaneously",
    );

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
      const theta = (Math.atan(opposite / adjacent) * 180) / Math.PI;
      const oppDiff = Math.sin(theta) * this._step;
      const adjDiff = Math.cos(theta) * this._step;

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
    const bounds: BoundingCuboid = this.actor.bounds;
    const location: Point3D = bounds.minLocation;
    const maxD: Vector3D = this.destination.vec_diff(location);
    const minD: Vector3D = maxD.absMin(this._d);
    this.actor.updatePosition(minD);
    this.actor.postEvent(EntityEvent.Moving);
    return bounds.minLocation.isSameAsRounded(this.destination);
  }
}

export class Navigate extends Action {
  private _currentStep: MoveDestination;
  private _waypoints: Array<Point3D>;
  private _index = 0;

  constructor(
    actor: Actor,
    private readonly _step: number,
    private readonly _destination: Point3D,
  ) {
    super(actor);
    //this._waypoints = this.findPath();
    //if (this._waypoints.length != 0) {
    //  this._currentStep = new MoveDestination(actor, _step, this._waypoints[0]);
    //}
  }

  perform(): boolean {
    // Maybe there's no path to the destination.
    if (this._waypoints.length == 0) {
      return true;
    }

    // Perform the current movement until we reach the waypoint, or fail to get
    // there.
    const finishedStep: boolean = this._currentStep.perform();
    if (!finishedStep) {
      return false;
    }

    // If the step is reporting that it's done, check whether it completed or
    // failed. If it failed, try to recompute the path.
    if (
      !this._currentStep.destination.isSameAsRounded(
        this._actor.bounds.minLocation,
      )
    ) {
      //this._waypoints = this.findPath();
      //if (this._waypoints.length != 0) {
      //  this._index = 0;
      //  this._currentStep = new MoveDestination(
      //    this._actor,
      //    this._step,
      //    this._waypoints[0],
      //  );
      //  return false;
      //}
      return true; // can no longer reach the destination.
    }

    this._index++;
    if (this._index == this._waypoints.length) {
      return true;
    }

    const nextLocation = this._waypoints[this._index];
    this._currentStep = new MoveDestination(
      this._actor,
      this._step,
      nextLocation,
    );
    return false;
  }
}
