import { Direction,
         getDirectionName,
         getAdjacentCoord } from "./physics.js"
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

  static add(pos: Point2D, moisture: number, direction: Direction): void {
    this._clouds.push(new Rain(pos, moisture, direction));
    this._totalClouds++;
  }

  private _finished: boolean = false;

  constructor(private _pos: Point2D, private _moisture: number,
              private _direction: Direction) { }

  get x(): number { return this._pos.x; }
  get y(): number { return this._pos.y; }
  get pos(): Point2D { return this._pos; }
  get moisture(): number { return this._moisture; }
  get direction(): Direction { return this._direction; }
  get finished(): boolean { return this._finished; }
  set pos(p: Point2D) { this._pos = p; }
  set moisture(m: number) { this._moisture = m; }
  set finished(f: boolean) { this._finished = f; }

  dropMoisture(moisture: number): boolean {
    Rain.moistureGrid[this.y][this.x] += moisture;
    this._moisture -= moisture;
    Rain._totalRainDropped += moisture;
    return this._moisture <= 0;
  }

  update(): boolean {
    if (this.finished) {
      return true;
    }

    let nextCoord = getAdjacentCoord(this.pos, this.direction);

    // Cloud may have left the map.
    if (!Rain._surface.inbounds(nextCoord)) {
      this.finished = true;
      return true;
    }

    let current = Rain._surface.at(this.x, this.y);
    // Don't start raining until we've reached land.
    if (current.height <= Rain._waterLevel) {
      this.pos = nextCoord;
      return false;
    }

    let next = Rain._surface.at(nextCoord.x, nextCoord.y);
    let multiplier = (next.height / current.height);// * Rain._booster;
    // Add 5%, plus the multiplier, of the available moisture.
    let total = 0.01 + (0.05 * this.moisture * multiplier);
    let available = Math.min(this.moisture, total);
    this.finished = this.dropMoisture(available);
    if (this.finished) {
      return true;
    }

    // Treat terraces as obsticles that will cause the cloud to split.
    if (next.terrace > current.terrace) {
      let dirA: Direction = (this.direction + 1) % Direction.Max;
      let dirB: Direction = (this.direction + Direction.NorthWest) % Direction.Max;
      let pointA: Point2D = getAdjacentCoord(this.pos, dirA);
      let pointB: Point2D = getAdjacentCoord(this.pos, dirB);
      let numClouds: number = 2;
      if (Rain._surface.inbounds(pointA) && Rain._surface.inbounds(pointB)) {
        Rain.add(pointA, this.moisture / 3, dirA);
        Rain.add(pointB, this.moisture / 3, dirB);
        numClouds = 3;
      } else if (Rain._surface.inbounds(pointA)) {
        Rain.add(pointA, this.moisture / 2, dirA);
      } else if (Rain._surface.inbounds(pointB)) {
        Rain.add(pointB, this.moisture / 2, dirB);
      } else {
        this.pos = nextCoord;
        return false;
      }
      this.moisture /= numClouds;
    }
    this.pos = nextCoord;
    return false;
  }
}
