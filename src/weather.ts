import { Direction, Navigation } from "./navigation.ts";
import { Surface } from "./builder.ts";
import { Point2D } from "./geometry.ts";

class Cloud {
  constructor(
    private _pos: Point2D,
    private _moisture: number,
    private readonly _direction: Direction,
    private _rain: Rain
  ) {}

  get x(): number {
    return this._pos.x;
  }
  get y(): number {
    return this._pos.y;
  }
  get pos(): Point2D {
    return this._pos;
  }
  set pos(p: Point2D) {
    this._pos = p;
  }
  get moisture(): number {
    return this._moisture;
  }
  set moisture(m: number) {
    this._moisture = m;
  }
  get rain(): Rain {
    return this._rain;
  }
  get minHeight(): number {
    return this.rain.minHeight;
  }
  get direction(): Direction {
    return this._direction;
  }
  get surface(): Surface {
    return this.rain.surface;
  }

  dropMoisture(multiplier: number): void {
    // Default to 10%
    const moisture = this.moisture * 0.1 * multiplier;
    this.moisture -= moisture;
    this.rain.addMoistureAt(this.pos, moisture);
  }

  move(): void {
    // Cloud may have left the map.
    while (this.surface.inbounds(this.pos)) {
      const nextCoord = Navigation.getAdjacentCoord(this.pos, this.direction);
      if (!this.surface.inbounds(nextCoord)) {
        this.dropMoisture(1);
        return;
      }

      const current = this.surface.at(this.x, this.y);
      // Don't start raining until we've reached land, and not on a beach.
      if (current.height <= this.minHeight || current.terrace < 1) {
        this.pos = nextCoord;
        continue;
      }

      const next = this.surface.at(nextCoord.x, nextCoord.y);
      const multiplier = next.terrace > current.terrace ? 1.5 : 1;
      this.dropMoisture(multiplier);
      this.pos = nextCoord;
    }
  }
}

export class Rain {
  private _clouds = Array<Cloud>();
  private _totalClouds = 0;
  private _moistureGrid: Array<Float32Array>;

  constructor(
    private _surface: Surface,
    private readonly _minHeight: number,
    moisture: number,
    direction: Direction
  ) {
    this._moistureGrid = new Array<Float32Array>();
    for (let y = 0; y < this.surface.depth; y++) {
      this._moistureGrid.push(new Float32Array(this.surface.width));
    }

    switch (direction) {
      default:
        console.error("unhandled direction");
        break;
      case Direction.North: {
        const y = this.surface.depth - 1;
        for (let x = 0; x < this.surface.width; x++) {
          this.addCloud(new Point2D(x, y), moisture, direction);
        }
        break;
      }
      case Direction.East: {
        const x = 0;
        for (let y = 0; y < this.surface.depth; y++) {
          this.addCloud(new Point2D(x, y), moisture, direction);
        }
        break;
      }
      case Direction.South: {
        const y = 0;
        for (let x = 0; x < this.surface.width; x++) {
          this.addCloud(new Point2D(x, y), moisture, direction);
        }
        break;
      }
      case Direction.West: {
        const x = this.surface.width - 1;
        for (let y = 0; y < this.surface.depth; y++) {
          this.addCloud(new Point2D(x, y), moisture, direction);
        }
        break;
      }
    }
  }

  get clouds(): Array<Cloud> {
    return this._clouds;
  }
  get totalClouds(): number {
    return this._totalClouds;
  }
  get surface(): Surface {
    return this._surface;
  }
  get minHeight(): number {
    return this._minHeight;
  }
  get moistureGrid(): Array<Float32Array> {
    return this._moistureGrid;
  }
  moistureAt(x: number, y: number): number {
    return this._moistureGrid[y][x];
  }

  addMoistureAt(pos: Point2D, moisture: number): void {
    this.moistureGrid[pos.y][pos.x] += moisture;
  }

  addCloud(pos: Point2D, moisture: number, direction: Direction): void {
    this.clouds.push(new Cloud(pos, moisture, direction, this));
    this._totalClouds++;
  }

  run(): void {
    while (this.clouds.length != 0) {
      const cloud = this.clouds[this.clouds.length - 1];
      this.clouds.pop();
      cloud.move();
    }
  }
}
