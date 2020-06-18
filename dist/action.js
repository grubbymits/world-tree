import { EntityEvent } from "./entity.js";
import { Location } from "./physics.js";
export class Action {
    constructor(_actor) {
        this._actor = _actor;
    }
    get actor() { return this._actor; }
    set actor(actor) { this._actor = actor; }
}
export class MoveDirection extends Action {
    constructor(actor, _dx, _dy, _dz, _bounds) {
        super(actor);
        this._dx = _dx;
        this._dy = _dy;
        this._dz = _dz;
        this._bounds = _bounds;
    }
    perform() {
        let x = this.actor.x + this._dx;
        let y = this.actor.y + this._dy;
        let z = this.actor.z + this._dz;
        this.actor.location = new Location(x, y, z);
        this.actor.postEvent(EntityEvent.Move);
        return this._bounds.contains(this.actor.location);
    }
}
export class MoveDestination extends Action {
    constructor(actor, _step, _destination) {
        super(actor);
        this._step = _step;
        this._destination = _destination;
        this._dx = 0;
        this._dy = 0;
        this._dz = 0;
        this.destination = _destination;
    }
    get destination() { return this._destination; }
    set speed(speed) { this._step = speed; }
    set destination(destination) {
        this._destination = destination;
        let dx = destination.x - this.actor.x;
        let dy = destination.y - this.actor.y;
        let dz = destination.z - this.actor.z;
        console.assert(dx == 0 || dy == 0 || dz == 0, "can only change distance along two axes simultaneously");
        if (dx == 0 && dy == 0 && dz == 0) {
            return;
        }
        else if (dx == 0 && dz == 0) {
            this._dx = 0;
            this._dy = this._step;
            this._dz = 0;
            return;
        }
        else if (dy == 0 && dz == 0) {
            this._dy = 0;
            this._dx = this._step;
            this._dz = 0;
            return;
        }
        else if (dx == 0 && dy == 0) {
            this._dx = 0;
            this._dy = 0;
            this._dz = this._step;
            return;
        }
        let adjacent = 0;
        let opposite = 0;
        if (dz == 0) {
            adjacent = dy > 0 ? dy : dx;
            opposite = dy > 0 ? dx : dy;
        }
        else if (dx == 0) {
            adjacent = dz > 0 ? dy : dz;
            opposite = dz > 0 ? dz : dy;
        }
        else if (dy == 0) {
            adjacent = dz > 0 ? dx : dz;
            opposite = dz > 0 ? dz : dx;
        }
        let theta = Math.atan(opposite / adjacent) * 180 / Math.PI;
        let oppDiff = Math.sin(theta) * this._step;
        let adjDiff = Math.cos(theta) * this._step;
        if (dz == 0) {
            this._dx = adjacent == dy ? oppDiff : adjDiff;
            this._dy = adjacent == dy ? adjDiff : oppDiff;
        }
        else if (dx == 0) {
            this._dz = adjacent == dy ? oppDiff : adjDiff;
            this._dy = adjacent == dy ? adjDiff : oppDiff;
        }
        else if (dy == 0) {
            this._dx = adjacent == dz ? oppDiff : adjDiff;
            this._dz = adjacent == dz ? adjDiff : oppDiff;
        }
    }
    perform() {
        console.log("perform action");
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
