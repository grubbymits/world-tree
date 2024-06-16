import { Actor } from "./entity.ts";
import { ContextImpl } from "./context.ts";
import { Camera } from "./camera.ts";
import { EntityEvent } from "./events.ts";
import { BoundingCuboid, CollisionDetector, CollisionInfo } from "./physics.ts";
import { Point3D, Vector2D, Vector3D, Vertex3D } from "./geometry.ts";
import { Navigation } from "./navigation.ts";
import { EntityBounds } from "./bounds.ts";

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
    const path: Vector3D = to.vec_diff(from);
    return CollisionDetector.detectInArea(this._actor, path);
  }

  perform(): boolean {
    return true;
  }
}

export class MoveDirection extends MoveAction {
  private _adjustedD: Vector3D;
  private _prevCollided: Vertex3D|null;
  constructor(
    actor: Actor,
    private readonly _d: Vector3D,
    private _bounds: BoundingCuboid
  ) {
    super(actor);
    this._adjustedD = _d;
  }

  get adjustedD(): Vector3D { return this._adjustedD; }
  set adjustedD(d: Vector3D) { this._adjustedD = d; }

  perform(): boolean {
    const currentPos = EntityBounds.bottomCentre(this.actor.id);
    const nextPos = currentPos.add(this._d);
    const obstruction = this.obstructed(currentPos, nextPos);
    if (obstruction == null || !obstruction.blocking) {
      this.actor.updatePosition(this._d);
      return false;
    }

    if (obstruction.intersectInfo) {
      if (obstruction.intersectInfo!.face.vertex != this._prevCollided) {
        // Calculate adjustment angle, if possible.
        this._prevCollided = obstruction.intersectInfo!.face.vertex;
        const obstructionNormal = obstruction.intersectInfo!.face.vertex.normal.norm();
        if (obstructionNormal.mag() <= this._d.mag()) {
          const theta = obstruction.intersectInfo!.theta;
          const xyScale = theta;
          const xyMag = new Vector2D(
            this._d.x * xyScale,
            this._d.y * xyScale).mag();
          // Assume we're perpendicular, so subtract theta to calculate the
          // angle of the slope, not the angle between the actor and the slope.
          const angle = 0.5 * Math.PI - theta;
          const z = Math.tan(angle) * xyMag;
          this.adjustedD = new Vector3D(
            this._d.x * xyScale,
            this._d.y * xyScale,
            z
          );
        }
      }
      if (this.adjustedD.mag() < 0.01) {
        return true;
      }
      const adjustedNextPos = currentPos.add(this.adjustedD);
      const adjustedObstruction = this.obstructed(currentPos, adjustedNextPos);
      if (adjustedObstruction == null) {
        this.actor.updatePosition(this.adjustedD);
        return false;
      }
    } else {
      // Without any collision info, just try the previous adjustment angle,
      const adjustedNextPos = currentPos.add(this.adjustedD);
      const adjustedObstruction = this.obstructed(currentPos, adjustedNextPos);
      if (adjustedObstruction == null) {
        this.actor.updatePosition(this.adjustedD);
        return false;
      }
    }
    this.adjustedD = new Vector3D(0, 0, 0);
    this.actor.postEvent(EntityEvent.EndMove);
    return true;
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
    const currentPos = EntityBounds.bottomCentre(this.actor.id);
    this._d = destination.vec_diff(currentPos).norm().scale(this._step);
    const direction = Navigation.getDirectionFromVector(new Vector2D(this._d.x, this._d.y));
    this.actor.direction = direction;
  }

  perform(): boolean {
    const location: Point3D = EntityBounds.bottomCentre(this.actor.id);
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
    this._waypoints = actor.context.grid!.findPath(EntityBounds.bottomCentre(actor.id), _destination);
    if (this.waypoints.length != 0) {
      this._currentStep = new MoveDestination(actor, this.step, this.waypoints[0]);
    }
  }

  get step(): number {
    return this._step;
  }
  get index(): number {
    return this._index;
  }
  get waypoints(): Array<Point3D> {
    return this._waypoints;
  }

  perform(): boolean {
    // Maybe there's no path to the destination.
    if (this.waypoints.length == 0) {
      return true;
    }

    // Perform the current movement until we reach the waypoint, or fail to get
    // there.
    const finishedStep: boolean = this._currentStep.perform();
    if (!finishedStep) {
      return false;
    }

    this._index++;
    if (this.index == this.waypoints.length) {
      return true;
    }

    const nextLocation = this.waypoints[this.index];
    this._currentStep = new MoveDestination(
      this._actor,
      this.step,
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
