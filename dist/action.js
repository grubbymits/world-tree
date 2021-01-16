import { EntityEvent } from "./events.js";
import { Direction, BoundingCuboid, CollisionDetector } from "./physics.js";
import { Vector3D } from "./geometry.js";
export class Action {
    constructor(_actor) {
        this._actor = _actor;
    }
    get actor() { return this._actor; }
    set actor(actor) { this._actor = actor; }
}
class MoveAction extends Action {
    constructor(actor, spatialInfo) {
        super(actor);
        this._collisionDetector = new CollisionDetector(spatialInfo);
    }
    canMove(from, to) {
        let bounds = this._actor.bounds;
        let path = to.vec(from);
        let area = new BoundingCuboid(to, bounds.dimensions);
        area.insert(bounds);
        return !this._collisionDetector.detectInArea(this._actor, path, area);
    }
    perform() { return true; }
}
export class MoveDirection extends MoveAction {
    constructor(actor, _d, _bounds, spatialInfo) {
        super(actor, spatialInfo);
        this._d = _d;
        this._bounds = _bounds;
    }
    perform() {
        const currentPos = this.actor.bounds.bottomCentre;
        const nextPos = currentPos.add(this._d);
        if (this.canMove(currentPos, nextPos)) {
            this.actor.updatePosition(this._d);
            this.actor.postEvent(EntityEvent.Moving);
            return false;
        }
        this.actor.postEvent(EntityEvent.EndMove);
        return true;
    }
}
export class MoveForwardsDirection extends MoveDirection {
    constructor(actor, d, bounds, spatialInfo) {
        super(actor, d, bounds, spatialInfo);
        if (d.y < 0 && d.y < d.x) {
            this._direction = Direction.North;
        }
        else if (d.x > d.y && d.x > 0) {
            this._direction = Direction.East;
        }
        else if (d.y > 0 && d.y > d.x) {
            this._direction = Direction.South;
        }
        else if (d.x < 0 && d.x < d.y) {
            this._direction = Direction.West;
        }
        else {
            console.log("Unhandled direction to face");
            console.log("dx:", d.x, "dy:", d.y);
        }
    }
    perform() {
        this.actor.postEvent(EntityEvent.FaceDirection);
        this.actor.direction = this._direction;
        return super.perform();
    }
}
export class MoveDestination extends MoveAction {
    constructor(actor, _step, _destination, spatialInfo) {
        super(actor, spatialInfo);
        this._step = _step;
        this._destination = _destination;
        this.destination = _destination;
    }
    get destination() { return this._destination; }
    set speed(speed) { this._step = speed; }
    set destination(destination) {
        this._destination = destination;
        let currentPos = this.actor.bounds.minLocation;
        let maxD = destination.vec(currentPos);
        console.assert(maxD.x == 0 || maxD.y == 0 || maxD.z == 0, "can only change distance along two axes simultaneously");
        let dx = 0;
        let dy = 0;
        let dz = 0;
        if (maxD.x == 0 && maxD.y == 0 && maxD.z == 0) {
            return;
        }
        else if (maxD.x == 0 && maxD.z == 0) {
            dx = 0;
            dy = this._step;
            dz = 0;
        }
        else if (maxD.y == 0 && maxD.z == 0) {
            dy = 0;
            dx = this._step;
            dz = 0;
        }
        else if (maxD.x == 0 && maxD.y == 0) {
            dx = 0;
            dy = 0;
            dz = this._step;
        }
        else {
            let adjacent = 0;
            let opposite = 0;
            if (maxD.z == 0) {
                adjacent = maxD.y > 0 ? maxD.y : maxD.x;
                opposite = maxD.y > 0 ? maxD.x : maxD.y;
            }
            else if (maxD.x == 0) {
                adjacent = maxD.z > 0 ? maxD.y : maxD.z;
                opposite = maxD.z > 0 ? maxD.z : maxD.y;
            }
            else if (maxD.y == 0) {
                adjacent = maxD.z > 0 ? maxD.x : maxD.z;
                opposite = maxD.z > 0 ? maxD.z : maxD.x;
            }
            let theta = Math.atan(opposite / adjacent) * 180 / Math.PI;
            let oppDiff = Math.sin(theta) * this._step;
            let adjDiff = Math.cos(theta) * this._step;
            if (maxD.z == 0) {
                dx = adjacent == maxD.y ? oppDiff : adjDiff;
                dy = adjacent == maxD.y ? adjDiff : oppDiff;
            }
            else if (maxD.x == 0) {
                dz = adjacent == maxD.y ? oppDiff : adjDiff;
                dy = adjacent == maxD.y ? adjDiff : oppDiff;
            }
            else if (maxD.y == 0) {
                dx = adjacent == maxD.z ? oppDiff : adjDiff;
                dz = adjacent == maxD.z ? adjDiff : oppDiff;
            }
        }
        this._d = new Vector3D(dx, dy, dz);
    }
    perform() {
        console.log("perform action");
        let bounds = this.actor.bounds;
        let location = bounds.minLocation;
        let maxD = this.destination.vec(location);
        let minD = maxD.absMin(this._d);
        this.actor.updatePosition(minD);
        this.actor.postEvent(EntityEvent.Moving);
        return bounds.minLocation.isNearlySameAs(this.destination);
    }
}
export class Navigate extends Action {
    constructor(actor, _step, _destination, _map, _spatialInfo) {
        super(actor);
        this._step = _step;
        this._destination = _destination;
        this._map = _map;
        this._spatialInfo = _spatialInfo;
        this._index = 0;
        this._waypoints = this.findPath();
        if (this._waypoints.length != 0) {
            this._currentStep =
                new MoveDestination(actor, _step, this._waypoints[0], _spatialInfo);
        }
    }
    perform() {
        if (this._waypoints.length == 0) {
            return true;
        }
        let finishedStep = this._currentStep.perform();
        if (!finishedStep) {
            return false;
        }
        if (!this._currentStep.destination.isNearlySameAs(this._actor.bounds.minLocation)) {
            this._waypoints = this.findPath();
            if (this._waypoints.length != 0) {
                this._index = 0;
                this._currentStep =
                    new MoveDestination(this._actor, this._step, this._waypoints[0], this._spatialInfo);
                return false;
            }
            return true;
        }
        this._index++;
        if (this._index == this._waypoints.length) {
            return true;
        }
        let nextLocation = this._waypoints[this._index];
        this._currentStep =
            new MoveDestination(this._actor, this._step, nextLocation, this._spatialInfo);
        return false;
    }
    findPath() {
        let path = new Array();
        return path;
    }
}
