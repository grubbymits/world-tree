import { InputEvent } from "./events.js";
export class Sound {
    constructor(name, loop) {
        this._id = Sound._tracks.length;
        this._track = new Audio(name);
        console.assert(this._track != undefined, "failed to create audio");
        this._track.loop = loop;
        Sound._tracks.push(this);
    }
    static pause(id) { this._tracks[id].pause(); }
    static play(id, volume) {
        if (volume > this._maxVolume) {
            volume = this._maxVolume;
        }
        let track = this._tracks[id];
        console.log("play music at:", volume);
        track.volume = volume;
        if (!track.playing) {
            track.play();
        }
    }
    set volume(volume) { this._track.volume = volume; }
    get playing() {
        return !this._track.paused && this._track.currentTime != 0;
    }
    pause() { this._track.pause(); }
    play() { this._track.play(); }
}
Sound._tracks = new Array();
Sound._maxVolume = 0.8;
export class ZonalAudioLoop extends Sound {
    constructor(name, area, scene, camera) {
        super(name, true);
        let id = this._id;
        let maxDistance = Math.sqrt(Math.pow(area.maxX - area.minX, 2) +
            Math.pow(area.maxY - area.minY, 2) +
            Math.pow(area.maxZ - area.minZ, 2)) / 2;
        console.log("centre of audio zone (x,y):", area.centre.x, area.centre.y);
        console.log("max distance from centre:", maxDistance);
        let maybePlay = function () {
            let location = camera.location;
            if (location == undefined) {
                console.log("couldn't get camera location");
                return;
            }
            if (!area.contains(camera.location)) {
                console.log("camera location not inbounds");
                Sound.pause(id);
                return;
            }
            let dx = location.x - area.centre.x;
            let dy = location.y - area.centre.y;
            dx = Math.abs(dx / maxDistance);
            dy = Math.abs(dy / maxDistance);
            let volume = Sound._maxVolume * Math.exp(-8 * (dx + dy));
            Sound.play(id, volume);
        };
        camera.addEventListener(InputEvent.CameraMove, maybePlay);
        window.addEventListener("focus", maybePlay);
        window.addEventListener("blur", (event) => {
            Sound.pause(id);
        });
    }
}
