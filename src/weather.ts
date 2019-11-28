import { Direction, getDirectionName, getDirectionCoords } from "./physics.js"
import { Surface, TerrainAttributes } from "./terrain.js"
import { Point } from "./graphics.js"

export class Rain {
  private static readonly rain: number = 0.5;
  private static _clouds = Array<Rain>();

  static get clouds(): Array<Rain> { return this._clouds; }

  static add(x: number, y: number, moisture: number,
             waterLevel: number, booster: number,
             direction: Direction, surface: Surface): void {
    console.log("adding new cloud at", x, y, "heading", getDirectionName(direction));
    this._clouds.push(
      new Rain(x, y, moisture, waterLevel, booster, direction, surface)
    );
  }

  private _finished: boolean = false;

  constructor(private _x: number, private _y: number,
              private _moisture: number,
              private _waterLevel: number,
              private _booster: number,
              private _direction: Direction,
              private _surface: Surface) { }

  get finished(): boolean { return this._finished; }

  update(): boolean {
    if (this._finished) {
      return true;
    }

    let nextCoord = getDirectionCoords(this._x, this._y, this._direction);

    // Cloud may have left the map.
    if (!this._surface.inbounds(nextCoord)) {
      this._finished = true;
      return true;
    }

    let current = this._surface.at(this._x, this._y);
    // Don't start raining until we've reached land.
    if (current.height <= this._waterLevel) {
      this._x = nextCoord.x;
      this._y = nextCoord.y;
      return false;
    }

    let next = this._surface.at(nextCoord.x, nextCoord.y);
    let multiplier = (next.height / current.height) * this._booster;
    // Add 5%, plus the multiplier, of the available moisture.
    let total = 0.05 * this._moisture * multiplier;
    if (total > this._moisture) {
      current.moisture += this._moisture;
      this._finished = true;
    } else  {
      current.moisture += total;
      this._moisture -= total;
      this._finished = this._moisture <= 0;
    }
    if (this._finished) {
      return true;
    }

    // Treat terraces as obsticles that will cause the cloud to split.
    if (next.terrace > current.terrace) {
      let dirA: Direction = (this._direction + 1) % Direction.Max;
      let dirB: Direction = (this._direction + Direction.NorthWest) % Direction.Max;

      let pointA: Point = getDirectionCoords(this._x, this._y, dirA);
      let pointB: Point = getDirectionCoords(this._x, this._y, dirB);
      let newSpawn: Point;
      let newDir: Direction;
      let numClouds: number = 2;
      if (this._surface.inbounds(pointA) && this._surface.inbounds(pointB)) {
        let terrainA: TerrainAttributes = this._surface.at(pointA.x, pointA.y);
        if (terrainA.terrace == terrainB.terrace == current.terrace) {
        let terrainB: TerrainAttributes = this._surface.at(pointB.x, pointB.y);
        Rain.add(pointA.x, pointA.y, this._moisture / 3, this._waterLevel,
                  this._booster, dirA, this._surface);
        Rain.add(pointB.x, pointB.y, this._moisture / 3, this._waterLevel,
                  this._booster, dirB, this._surface);
        numClouds = 3;
      } else if (this._surface.inbounds(pointA)) {
        Rain.add(pointA.x, pointA.y, this._moisture / 2, this._waterLevel,
                  this._booster, dirA, this._surface);
      } else if (this._surface.inbounds(pointB)) {
        Rain.add(pointB.x, pointB.y, this._moisture / 2, this._waterLevel,
                  this._booster, dirB, this._surface);
      } else {
        this._x = nextCoord.x;
        this._y = nextCoord.y;
        return this._finished;
      }
      this._moisture /= numClouds;
    }
    this._x = nextCoord.x;
    this._y = nextCoord.y;
    return this._finished;
  }
}
