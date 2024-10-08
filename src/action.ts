import { Actor } from "./entity.ts";
import { ContextImpl } from "./context.ts";
import { Camera } from "./camera.ts";
import { EntityEvent } from "./events.ts";
import { CollisionDetector, CollisionInfo } from "./physics.ts";
import { Point3D, Vector2D, Vector3D, Vertex3D } from "./geometry.ts";
import { Direction, Navigation } from "./navigation.ts";
import { EntityBounds } from "./bounds.ts";
import { findPath } from "./terraform.ts";
import { Coord } from "./utils";

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

  move(d: Vector3D): boolean {
    this.actor.updatePosition(d);
    return false;
  }

  end(): boolean {
    this.actor.postEvent(EntityEvent.EndMove);
    return true;
  }
}

export class MoveDirection extends MoveAction {
  private _adjustedD: Vector3D;
  private _prevCollided: Vertex3D|null;
  constructor(
    actor: Actor,
    private readonly _d: Vector3D
  ) {
    super(actor);
    this._adjustedD = _d;
  }

  get adjustedD(): Vector3D { return this._adjustedD; }
  set adjustedD(d: Vector3D) { this._adjustedD = d; }

  perform(): boolean {
    if (this._d.zero) {
      return this.end();
    }
    const currentPos = EntityBounds.bottomCentre(this.actor.id);
    const nextPos = currentPos.add(this._d);
    const obstruction = this.obstructed(currentPos, nextPos);
    if (obstruction == null || !obstruction.blocking) {
      return this.move(this._d);
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
        return this.end();
      }
      const adjustedNextPos = currentPos.add(this.adjustedD);
      const adjustedObstruction = this.obstructed(currentPos, adjustedNextPos);
      if (adjustedObstruction == null) {
        return this.move(this.adjustedD);
      }
    } else {
      // Without any collision info, just try the previous adjustment angle,
      const adjustedNextPos = currentPos.add(this.adjustedD);
      const adjustedObstruction = this.obstructed(currentPos, adjustedNextPos);
      if (adjustedObstruction == null) {
        return this.move(this.adjustedD);
      }
    }
    this.adjustedD = new Vector3D(0, 0, 0);
    return this.end();
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
  }

  perform(): boolean {
    const location: Point3D = EntityBounds.bottomCentre(this.actor.id);
    // Make sure we don't overshoot the destination.
    const maxD: Vector3D = this.destination.vec_diff(location);
    if (maxD.mag() < this._step) {
      return this.end();
    }
    this._d = this.destination.vec_diff(location).norm().scale(this._step);
    // Check for obstruction.
    if (this.obstructed(location, location.add(this._d))) {
      return this.end();
    }
    return this.move(this._d);
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
    private readonly _blockingGrid: Array<Uint8Array>,
  ) {
    super(actor);
    const begin = actor.context.grid!.scaleWorldToGrid(EntityBounds.bottomCentre(actor.id));
    const end = actor.context.grid!.scaleWorldToGrid(this.destination);
    const gridCoords = findPath(
      new Coord(begin.x, begin.y),
      new Coord(end.x, end.y),
      this.blockingGrid
    );
    if (gridCoords.length != 0) {
      this.waypoints = new Array<Point3D>();
      for (let gridCoord of gridCoords) {
        this.waypoints.push(actor.context.grid!.getCentreSurfaceLocationAt(gridCoord.x, gridCoord.y)!);
      }
      this._currentStep = new MoveDestination(actor, this.step, this.waypoints[0]);
    }
  }

  get step(): number {
    return this._step;
  }
  get destination(): Point3D {
    return this._destination;
  }
  get blockingGrid(): Array<Uint8Array> {
    return this._blockingGrid;
  }
  get index(): number {
    return this._index;
  }
  get waypoints(): Array<Point3D> {
    return this._waypoints;
  }
  set waypoints(w: Array<Point3D>) {
    this._waypoints = w;
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

export class Jump extends MoveAction {
  constructor(
    actor: Actor,
    private _d: Vector3D
  ) {
    super(actor);
  }

  perform(): boolean {
    if (this._d.mag() <= 0.01) {
      return true;
    }
    const currentPos = EntityBounds.bottomCentre(this.actor.id);
    const nextPos = currentPos.add(this._d);
    const obstruction = this.obstructed(currentPos, nextPos);
    if (obstruction == null || !obstruction.blocking) {
      this.actor.updatePositionNotDirection(this._d);
      this._d = new Vector3D(this._d.x, this._d.y, this._d.z * 0.8);
      return false;
    }
    return true;
  }
}
