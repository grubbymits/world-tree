export var EntityEvent;
(function (EntityEvent) {
    EntityEvent["Move"] = "move";
    EntityEvent["ActionComplete"] = "actionComplete";
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
