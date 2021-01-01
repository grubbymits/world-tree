export enum EntityEvent {
  Moving = "moving",
  EndMove = "endMove",
  FaceDirection = "faceDirection"
}

export enum InputEvent {
  CameraMove = "cameraMove",
}

export class EventHandler<T> {
  protected _listeners = new Map<T, Array<Function>>();
  protected _events = new Set<T>();

  constructor() { }

  post(event: T): void {
    this._events.add(event);
  }

  service(): void {
    for (let event of this._events) {
      if (!this._listeners.has(event)) {
        continue;
      }
      let callbacks = this._listeners.get(event)!;
      for (let callback of callbacks) { 
        callback();
      }
    }
    this._events.clear();
  }

  addEventListener(event: T, callback: Function): void {
    if (!this._listeners.has(event)) {
      this._listeners.set(event, new Array<Function>());
    } else {
      // Check that the callback doesn't already exist.
      let callbacks = this._listeners.get(event)!;
      for (let i in callbacks) {
        if (callbacks[i] === callback) {
          return;
        }
      }
    }
    this._listeners.get(event)!.push(callback);
  }

  removeEventListener(event: T, callback: Function): void {
    if (!this._listeners.has(event)) {
      return;
    }
    let callbacks = this._listeners.get(event)!;
    const index = callbacks.indexOf(callback, 0);
    if (index > -1) {
      callbacks.splice(index, 1);
    }
  }
}
