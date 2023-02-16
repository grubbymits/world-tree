//deno-lint-ignore-file no-explicit-any

export enum EntityEvent {
  Moving = "moving",
  EndMove = "endMove",
  FaceDirection = "faceDirection",
  Collision = "collision",
  NoCollision = "noCollision",
}

export enum InputEvent {
  CameraMove = "cameraMove",
}

export class EventHandler<T> {
  protected _listeners = new Map<T, Array<any>>();
  protected _events = new Set<T>();

  constructor() {}

  post(event: T): void {
    this._events.add(event);
  }

  service(): void {
    for (const event of this._events) {
      if (!this._listeners.has(event)) {
        continue;
      }
      const callbacks = this._listeners.get(event)!;
      for (const callback of callbacks) {
        callback();
      }
    }
    this._events.clear();
  }

  addEventListener(event: T, callback: any): void {
    if (!this._listeners.has(event)) {
      this._listeners.set(event, new Array<any>());
    } else {
      // Check that the callback doesn't already exist.
      const callbacks = this._listeners.get(event)!;
      for (const i in callbacks) {
        if (callbacks[i] === callback) {
          return;
        }
      }
    }
    this._listeners.get(event)!.push(callback);
  }

  removeEventListener(event: T, callback: any): void {
    if (!this._listeners.has(event)) {
      return;
    }
    const callbacks = this._listeners.get(event)!;
    const index = callbacks.indexOf(callback, 0);
    if (index > -1) {
      callbacks.splice(index, 1);
    }
  }
}

export class TimedEventHandler {
  private _callbacks: Array<any> = new Array<any>();

  constructor() {}

  add(callback: any): void {
    this._callbacks.push(callback);
  }

  service(): void {
    for (let i = this._callbacks.length - 1; i >= 0; i--) {
      const finished: boolean = this._callbacks[i]();
      if (finished) {
        this._callbacks.splice(i, 1);
      }
    }
  }
}
