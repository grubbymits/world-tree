export var EntityEvent;
(function (EntityEvent) {
    EntityEvent["Moving"] = "moving";
    EntityEvent["EndMove"] = "endMove";
    EntityEvent["FaceDirection"] = "faceDirection";
    EntityEvent["Collision"] = "collision";
    EntityEvent["NoCollision"] = "noCollision";
})(EntityEvent || (EntityEvent = {}));
export var InputEvent;
(function (InputEvent) {
    InputEvent["CameraMove"] = "cameraMove";
})(InputEvent || (InputEvent = {}));
export class EventHandler {
    constructor() {
        this._listeners = new Map();
        this._events = new Set();
    }
    post(event) {
        this._events.add(event);
    }
    service() {
        for (let event of this._events) {
            if (!this._listeners.has(event)) {
                continue;
            }
            let callbacks = this._listeners.get(event);
            for (let callback of callbacks) {
                callback();
            }
        }
        this._events.clear();
    }
    addEventListener(event, callback) {
        if (!this._listeners.has(event)) {
            this._listeners.set(event, new Array());
        }
        else {
            let callbacks = this._listeners.get(event);
            for (let i in callbacks) {
                if (callbacks[i] === callback) {
                    return;
                }
            }
        }
        this._listeners.get(event).push(callback);
    }
    removeEventListener(event, callback) {
        if (!this._listeners.has(event)) {
            return;
        }
        let callbacks = this._listeners.get(event);
        const index = callbacks.indexOf(callback, 0);
        if (index > -1) {
            callbacks.splice(index, 1);
        }
    }
}
export class TimedEventHandler {
    constructor() {
        this._callbacks = new Array();
    }
    add(callback) {
        this._callbacks.push(callback);
    }
    service() {
        for (let i = this._callbacks.length - 1; i >= 0; i--) {
            const finished = this._callbacks[i]();
            if (finished) {
                this._callbacks.splice(i, 1);
            }
        }
    }
}
