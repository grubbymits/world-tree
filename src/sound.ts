//deno-lint-ignore-file no-window-prefix

import { BoundingCuboid } from "./physics.ts";
import { Point3D } from "./geometry.ts";
import { Camera } from "./camera.ts";
import { InputEvent } from "./events.ts";

export class Sound {
  private static _tracks = new Array<Sound>();
  static readonly _maxVolume: number = 0.8;

  protected readonly _id: number;
  protected readonly _track: HTMLAudioElement;

  static pause(id: number) {
    this._tracks[id].pause();
  }
  static play(id: number, volume: number): void {
    if (volume > this._maxVolume) {
      volume = this._maxVolume;
    }
    const track = this._tracks[id];
    console.log("play music at:", volume);
    track.volume = volume;
    if (!track.playing) {
      track.play();
    }
  }

  constructor(name: string, loop: boolean) {
    this._id = Sound._tracks.length;
    this._track = new Audio(name);
    console.assert(this._track != undefined, "failed to create audio");
    this._track.loop = loop;
    Sound._tracks.push(this);
  }

  set volume(volume: number) {
    this._track.volume = volume;
  }
  get playing(): boolean {
    return !this._track.paused && this._track.currentTime != 0;
  }
  pause(): void {
    this._track.pause();
  }
  play(): void {
    this._track.play();
  }
}

export class ZonalAudioLoop extends Sound {
  constructor(name: string, area: BoundingCuboid, camera: Camera) {
    super(name, true);
    const id = this._id;
    const maxDistance =
      Math.sqrt(
        Math.pow(area.maxX - area.minX, 2) +
          Math.pow(area.maxY - area.minY, 2) +
          Math.pow(area.maxZ - area.minZ, 2)
      ) / 2;
    console.log("centre of audio zone (x,y):", area.centre.x, area.centre.y);
    console.log("max distance from centre:", maxDistance);

    const maybePlay = function () {
      const location: Point3D | null = camera.location;
      if (location == undefined) {
        console.log("couldn't get camera location");
        return;
      }
      if (!area.contains(camera.location!)) {
        console.log("camera location not inbounds");
        Sound.pause(id);
        return;
      }
      let dx = location!.x - area.centre.x;
      let dy = location!.y - area.centre.y;
      dx = Math.abs(dx / maxDistance);
      dy = Math.abs(dy / maxDistance);
      const volume = Sound._maxVolume * Math.exp(-8 * (dx + dy));
      Sound.play(id, volume);
    };

    // Set the volume of the track according to the distance away from the
    // cameras centre point - further away is quieter.
    camera.addEventListener(InputEvent.CameraMove, maybePlay);
    window.addEventListener("focus", maybePlay);
    window.addEventListener("blur", () => {
      Sound.pause(id);
    });
  }
}
