import { Actor } from "./entity.ts";
import { ContextImpl } from "./context.ts";
import { Camera } from "./camera.ts";
import { EntityEvent } from "./events.ts";
import { BoundingCuboid, CollisionDetector, CollisionInfo } from "./physics.ts";
import { Point3D, Vector2D, Vector3D } from "./geometry.ts";
import { Navigation } from "./navigation.ts";

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
    private _bounds: BoundingCuboid
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
    private _destination: Point3D
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
  get d(): Vector3D {
    return this._d;
  }
  set destination(destination: Point3D) {
    this._destination = destination;
    const currentPos = this.actor.bounds.bottomCentre;
    this._d = destination.vec_diff(currentPos).norm().mulScalar(this._step);
    const direction = Navigation.getDirectionFromVector(new Vector2D(this._d.x, this._d.y));
    this.actor.direction = direction;
  }

  perform(): boolean {
    const bounds: BoundingCuboid = this.actor.bounds;
    const location: Point3D = bounds.bottomCentre;
    // Check for obstruction.
    if (this.obstructed(location, location.add(this._d))) {
      return true;
    }
    // Make sure we don't overshoot the destination.
    const maxD: Vector3D = this.destination.vec_diff(location);
    if (maxD.mag() < this._step) {
      return true;
    }
    this.actor.updatePosition(this._d);
    this.actor.postEvent(EntityEvent.Moving);
    return false;
  }
}

export class Navigate extends Action {
  private _currentStep: MoveDestination;
  private _waypoints: Array<Point3D>;
  private _index = 0;

  constructor(
    actor: Actor,
    private readonly _step: number,
    private readonly _destination: Point3D
  ) {
    super(actor);
    this._waypoints = actor.context.grid!.findPath(actor.bounds.bottomCentre, _destination);
    if (this._waypoints.length != 0) {
      this._currentStep = new MoveDestination(actor, _step, this._waypoints[0]);
    }
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
        this._actor.bounds.minLocation
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
      nextLocation
    );
    return false;
  }
}

export function TouchOrClickNav(context: ContextImpl,
                                canvas: HTMLCanvasElement,
                                camera: Camera,
                                actor: Actor,
                                speed: number): void {
  console.assert(context.grid && 'expected grid');
  canvas.addEventListener("mousedown", (e) => {
    if (e.button == 0) {
      console.log('mouse click');
      const destination = context.scene.getLocationAt(e.offsetX, e.offsetY, camera);
      if (destination) {
        actor.action = new Navigate(actor, speed, destination!);
      }
    }
  });
  canvas.addEventListener("touchstart", (e) => {
    const touch = e.touches[0];
    const destination = context.scene.getLocationAt(touch.pageX, touch.pageY, camera);
    if (destination) {
      actor.action = new Navigate(actor, speed, destination!);
    }
  });
}
