import { Actor } from "./entity.js"
import { Location } from "./physics.js"

export abstract class Action {
  constructor(protected readonly _actor: Actor) { }
  abstract perform(): void;
  get actor(): Actor { return this._actor; }
}

export class MoveAction extends Action {
  private _dx: number = 0;
  private _dy: number = 0;
  private _dz: number = 0;

  constructor(actor: Actor,
              private _speed: number,
              private _destination: Location) {
    super(actor);
  }
  set destination(dest: Location) { this._destination = dest; }
  set speed(speed: number) { this._speed = speed; }

  perform(): void {
    let x = this.actor.x + this._dx;
    let y = this.actor.y + this._dy;
    let z = this.actor.z + this._dz;
    this.actor.location = new Location(x, y, z);
  }
}
