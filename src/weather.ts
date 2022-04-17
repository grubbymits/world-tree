import { Direction, getDirectionName, getDirectionCoords } from "./physics.js"
import { Surface } from "./builder.js"
import { Point2D } from "./geometry.js"

export class Rain {
  private static readonly rain: number = 0.5;
  private static _clouds = Array<Rain>();
  private static _totalClouds: number = 0;
  private static _surface: Surface;
  private static _waterLevel: number;
  private static _moistureGrid: Array<Float32Array>;
  private static _totalRainDropped: number = 0;

  static init(waterLevel: number, surface: Surface) {
    this._waterLevel = waterLevel;
    this._surface = surface;
    this._moistureGrid = new Array<Float32Array>();
    for (let y = 0; y < surface.depth; y++) {
      this._moistureGrid.push(new Float32Array(surface.width));
    }
  }

  static get clouds(): Array<Rain> { return this._clouds; }

  static get totalClouds(): number { return this._totalClouds; }
  static get totalRain(): number { return this._totalRainDropped; }

  static get moistureGrid(): Array<Float32Array> { return this._moistureGrid; }

  static add(x: number, y: number, moisture: number, direction: Direction): void {
    this._clouds.push(new Rain(x, y, moisture, direction));
    this._totalClouds++;
  }

  private _finished: boolean = false;

  constructor(private _x: number, private _y: number, private _moisture: number,
              private _direction: Direction) { }

  get finished(): boolean { return this._finished; }

  dropMoisture(moisture: number): boolean {
    Rain.moistureGrid[this._y][this._x] += moisture;
    this._moisture -= moisture;
    Rain._totalRainDropped += moisture;
    return this._moisture <= 0;
  }

  update(): boolean {
    if (this._finished) {
      return true;
    }

    let changeVec = getDirectionCoords(this._x, this._y, this._direction);
    let nextCoord = new Point2D(this._x, this._y).add(changeVec);

    // Cloud may have left the map.
    if (!Rain._surface.inbounds(nextCoord)) {
      this._finished = true;
      return true;
    }

    let current = Rain._surface.at(this._x, this._y);
    // Don't start raining until we've reached land.
    if (current.height <= Rain._waterLevel) {
      this._x = nextCoord.x;
      this._y = nextCoord.y;
      return false;
    }

    let next = Rain._surface.at(nextCoord.x, nextCoord.y);
    let multiplier = (next.height / current.height);// * Rain._booster;
    // Add 5%, plus the multiplier, of the available moisture.
    let total = 0.01 + (0.05 * this._moisture * multiplier);
    let available = Math.min(this._moisture, total);
    this._finished = this.dropMoisture(available);
    if (this._finished) {
      return true;
    }

    // Treat terraces as obsticles that will cause the cloud to split.
    if (next.terrace > current.terrace) {
      let dirA: Direction = (this._direction + 1) % Direction.Max;
      let dirB: Direction = (this._direction + Direction.NorthWest) % Direction.Max;
      let pos = new Point2D(this._x, this._y);
      let pointA: Point2D = pos.add(getDirectionCoords(this._x, this._y, dirA));
      let pointB: Point2D = pos.add(getDirectionCoords(this._x, this._y, dirB));
      let numClouds: number = 2;
      if (Rain._surface.inbounds(pointA) && Rain._surface.inbounds(pointB)) {
        Rain.add(pointA.x, pointA.y, this._moisture / 3, dirA);
        Rain.add(pointB.x, pointB.y, this._moisture / 3, dirB);
        numClouds = 3;
        console.log("splitting a cloud into three parts");
      } else if (Rain._surface.inbounds(pointA)) {
        Rain.add(pointA.x, pointA.y, this._moisture / 2, dirA);
      } else if (Rain._surface.inbounds(pointB)) {
        Rain.add(pointB.x, pointB.y, this._moisture / 2, dirB);
      } else {
        this._x = nextCoord.x;
        this._y = nextCoord.y;
        return false;
      }
      this._moisture /= numClouds;
    }
    this._x = nextCoord.x;
    this._y = nextCoord.y;
    return false;
  }
}
