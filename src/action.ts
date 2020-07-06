import { Actor } from "./entity.js"
import { EntityEvent } from "./events.js"
import { Location,
         BoundingCuboid } from "./physics.js"

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
              private _destination: Location) {
    super(actor);
    this.destination = _destination;
  }

  get destination(): Location { return this._destination; }

  set speed(speed: number) { this._step = speed; }

  set destination(destination: Location) {
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

    this.actor.location = new Location(x, y, z);
    this.actor.postEvent(EntityEvent.Move);
    return this.actor.location.isNearlySameAs(this.destination);
  }
}

export class Navigate extends Action {
  private readonly _currentStep: MoveDestination;
  private _waypoints: Array<Location>;
  private _index: number = 0;

  constructor(actor: Actor,
              private readonly _step: number,
              private readonly _destination,
              private readonly _map: SquareGrid,
              private readonly _boundsInfo: Octree) {
    super(actor);
    this._waypoints = _map.findPath(actor.location, _destination, _boundsInfo);
    if (this._waypoints.length != 0) {
      this._currentStep = new MoveDestination(actor, _step, this._waypoints[0]);
    }
  }

  perform(): boolean {
    // Maybe there's no path to the destination.
    if (this._waypoints.length == 0) {
      return true;
    }

    let finishedStep: boolean = currentMove.perform();
    if (!finishedStep) {
      return false;
    }

    this._index++;
    if (this._index == this._waypoints.length) {
      return true;
    }

    let nextLocation = this._waypoints[this._index];
    // Check that nextLocation is still free, otherwise recompute the path.

    this._currentStep = new MoveDestination(this._actor, this._step,
                                            nextLocation);
    return false;
  }
}
