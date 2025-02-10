import { Point2D, Vector2D } from './geometry.ts';

function randomRange(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

function normVector2D(min: number, max: number): Vector2D {
  const x = randomRange(min, max);
  const y = randomRange(min, max);
  return new Vector2D(x, y).normalise();
}

type PRNGCallback =
  (lattice: LatticeNoise, min: number, max: number,
   x: number, y: number) => number;

type InterpolateCallback =
  (noise: LatticeNoise, x: number, y: number) => number;

export function bilinear(noise: LatticeNoise,
                         x: number, y: number) {
  const l00 = noise.lattice.getValue(x, y);
  const l01 = noise.lattice.getValue(x, y + 1);
  const l10 = noise.lattice.getValue(x + 1, y);
  const l11 = noise.lattice.getValue(x + 1, y + 1);

  const scaleDiv = 1 / noise.scale;
  const fx = (x % noise.scale) * scaleDiv;
  const fy = (y % noise.scale) * scaleDiv;

  const smoothstep = (x: number): number => x * x * (3 - 2 * x);
  const wx = smoothstep(fx);
  const wy = smoothstep(fy);

  const lerp = (t: number, l0: number, l1: number): number => {
    return l0 + t * (l1 - l0);
  }
  const lerpx = lerp(wx, l00, l10);
  const lerpy = lerp(wx, l01, l11);
  return lerp(wy, lerpx, lerpy);
}

export function quadraticMean(noise: LatticeNoise,
                              x: number, y: number): number {
  const n00 = noise.lattice.getValue(x, y);
  const n01 = noise.lattice.getValue(x, y + 1);
  const n10 = noise.lattice.getValue(x + 1, y);
  const n11 = noise.lattice.getValue(x + 1, y + 1);
  return Math.hypot(n00, n01, n10, n11) * 0.25;
}

export function mean(noise: LatticeNoise,
                     x: number, y: number): number {

  const l00 = noise.lattice.getValue(x, y);
  const l01 = noise.lattice.getValue(x, y + 1);
  const l10 = noise.lattice.getValue(x + 1, y);
  const l11 = noise.lattice.getValue(x + 1, y + 1);
  return (l00 + l01 + l10 + l11) * 0.25;
}
/*
  // lx:  0         1         2
  // nx:    0 1 2 3   4 5 6 7
  //      * + + + + * + + + + *
  const noiseStart = new Coord(x * noise.scale, y * noise.scale);
  const noiseEnd = new Coord(noiseStart.x + noise.scale, noiseStart.y + noise.scale);
  for (let i = 0; i < noise.scale; ++i) {
    const ratio = weight(i / noise.scale);
    noise.setNoiseAt(noiseStart.x + i, noiseStart.y, 
                     (l00 * (1 - ratio)) + (ratio * l10));
    noise.setNoiseAt(noiseStart.x + i, noiseEnd.y,
                     (l01 * (1 - ratio)) + (ratio * l11));
    noise.setNoiseAt(noiseStart,x, noiseStart.y + i,
                     (l00 * (1 - ratio)) + (ratio * l01));
    noise.setNoiseAt(noiseEnd.x, noiseStart.y + i,
                     (l10 * (1 - ratio)) + (ratio * l11));
  }
*/

class Lattice {
  private _lattice: Array<Float64Array>;
  private readonly _scaleDiv: number;

  constructor(private readonly _width: number,
              private readonly _height: number) {
    this.lattice = new Array<Float64Array>(this.height);
    for (let y = 0; y < this.lattice.length; ++y) {
      this.lattice[y] = new Float64Array(this.width);
    }
  }
  get width(): number { return this._width; }
  get height(): number { return this._height; }
  get lattice(): Array<Float64Array> { return this._lattice; }
  set lattice(l: Array<Float64Array>) { this._lattice = l; }

  getRow(y: number): Float64Array {
    return this.lattice[y];
  }
  getValue(x: number, y: number): number {
    return this.lattice[y][x];
  }
  setValue(x: number, y: number, v: number) {
    this.lattice[y][x] = v;
  }
}

export interface LatticeNoise {
  lattice: Lattice;
  width: number;
  height: number;
  scale: number;
}

export class DiamondSquare implements LatticeNoise {
  private _lattice: Lattice;

  // step 0: corners, [0], [0 + scale]... and mid-points between them.
  // step 1: square mid-points between `0` points.
  // step 2: diamond mid-points between `0` and `1` points.
  // step 3: square mid-points between `2` points.

  // result width: 4
  // lattice width: 5
  // scale: 4
  //  0     3     1     3     0
  //
  //  3     2     3     2     3
  //
  //  1     3     0     3     1
  //
  //  3     2     3     2     3
  //
  //  0     3     1     3     0

  // result width: 8
  // lattice width: 9
  // scale: 8
  //  0  4  3  4  1  4  3  4  0
  //
  //  4  5  4  5  4  5  4  5  4
  //
  //  3  4  2  4  3  4  2  4  3
  //
  //  4  5  4  5  4  5  4  5  4
  //
  //  1  4  3  4  0  4  3  4  1
  //
  //  4  5  4  5  4  5  4  5  4
  //
  //  3  4  2  4  3  4  2  4  3
  //
  //  4  5  4  5  4  5  4  5  4
  //
  //  0  4  3  4  1  4  3  4  0
  constructor(private readonly _width: number,
              private readonly _height: number,
              private readonly _scale: number,
              private readonly _beginRoughness: number,
              private readonly _endRoughness: number) {
    this._lattice = new Lattice(this.width + 1, this.height + 1);
  }

  get height(): number { return this._height; }
  get width(): number { return this._width; }
  get scale(): number { return this._scale; }
  get lattice(): Lattice { return this._lattice; }
  get beginRoughness(): number { return this._beginRoughness; }
  get endRoughness(): number { return this._endRoughness; }

  run(prn: PRNGCallback): void {
    const max = this.beginRoughness;
    const min = -this.beginRoughness;
    for (let y = 0; y < this.lattice.height; y += this.scale) {
      for (let x = 0; x < this.lattice.width; x += this.scale) {
        this.lattice.setValue(x, y, prn(this, min, max, x, y));
      }
    }

    const roughnessDecay =
      2 * (this.beginRoughness - this.endRoughness) / this.scale;
    let roughness = this.beginRoughness - roughnessDecay;

    // Initialise the corners.

    let midpoints = new Array<Point2D>(new Point2D(
      Math.floor(this.width / 2),
      Math.floor(this.height / 2)
    ));

    let step = 1;
    while (midpoints.length != 0) {
      let mid = midpoints.shift()!;
      this.diamond(mid, step, roughness);
      ++step;
      roughness -= roughnessDecay;
      const beginX = Math.floor(this.width / (step * this.scale));
      const beginY = Math.floor(this.height / (step * this.scale));
      if (beginX == 0 || beginY == 0) {
        continue;
      }
      const stepX = beginX * this.scale;
      const stepY = beginY * this.scale;
      const diamondPoints = new Array<Point2D>();
      for (let y = beginY; y < this.height; y += stepY) {
        for (let x = beginX; x < this.width; x += stepX) {
          diamondPoints.push(new Point2D(x, y));
        }
      }
      midpoints = midpoints.concat(diamondPoints);
    }
  }

  squarePoints(mid: Point2D, step: number): Array<Point2D> {
    const halfX = Math.floor(this.width / (step * this.scale));
    const halfY = Math.floor(this.height / (step * this.scale));
    const minX = mid.x - halfX;
    const maxX = mid.x + halfX - 1;
    const minY = mid.y - halfY;
    const maxY = mid.y + halfY - 1;
    return new Array<Point2D>(
      new Point2D(mid.x, minY),
      new Point2D(maxX, mid.y),
      new Point2D(mid.x, maxY),
      new Point2D(minX, mid.y),
    );
  }

  diamond(mid: Point2D, step: number, roughness: number): void {
    const halfX = Math.floor(this.width / (step * this.scale));
    const halfY = Math.floor(this.height / (step * this.scale));
    const minX = mid.x - halfX;
    const maxX = mid.x + halfX - 1;
    const minY = mid.y - halfY;
    const maxY = mid.y + halfY - 1;
    const avg = 0.25 * (
      this.lattice.getValue(minX, minY) +
      this.lattice.getValue(minX, maxY) +
      this.lattice.getValue(maxX, minY) +
      this.lattice.getValue(maxX, maxY)
    );
    this.lattice.setValue(mid.x, mid.y, avg + roughness);
    const points = this.squarePoints(mid, step);
    for (let point of points) {
      this.square(point, step, roughness);
    }
  }

  square(mid: Point2D, step: number, roughness: number): void {
    const points = this.squarePoints(mid, step);
    let total = 0;
    for (let point of points) {
      total += this.lattice.getValue(point.x, point.y);
    }
    const avg = 0.25 * total;
    this.lattice.setValue(mid.x, mid.y, avg + roughness);
  }
}

export class GradientNoise implements LatticeNoise {

  // gradients will be generated for '*', then scaled at '+':
  // noise: 6x4
  // scale: 2
  // lattice: 7x5
  // gradient: 4x3
  //  *  +  *  +  *  +  *
  //
  //  +  +  +  +  +  +  +
  //
  //  *  +  *  +  *  +  *
  //
  //  +  +  +  +  *  +  +
  //
  //  *  +  *  +  *  +  *
  
  // noise: 6x6
  // scale: 3
  // lattice: 7x7
  //  *  +  +  *  +  +  *

  private _gradients: Lattice;
  private _lattice: Lattice;

  constructor(private readonly _width: number,
              private readonly _height: number,
              private readonly _scale: number,
              private readonly _roughness: number) {
    // Create the 2D lattice and the noise output
    // lattice width/height = result width/height + 1;
    this.lattice = new Lattice(this.width + 1, this.height + 1);
    // gradient = (lattice + (scale - 1)) / scale;
    const scaleDiv = 1 / this.scale;
    // `2 x` so we can store x and y in the row
    const gradientWidth = 2 * (this.lattice.width + (this.scale - 1)) * scaleDiv;
    const gradientHeight = (this.lattice.height + (this.scale - 1)) * scaleDiv;
    this.gradients = new Lattice(gradientWidth, gradientHeight);

    // Create 2D grid of normalised 2D vectors.
    for (let y = 0; y < this.gradients.height; ++y) {
      const row = this.gradients.getRow(y);
      for (let x = 0; x < row.length; ++x) {
        const grad = normVector2D(-1, 1);
        row[x * 2] = grad.x;
        row[x * 2 + 1] = grad.y;
      }
    }

    // Populate the lattice with a dot product of the gradient
    // and the fractional relative position.
    for (let y = 0; y < this.lattice.height; ++y) {
      const iy = Math.floor(y * scaleDiv);
      const fy = (y % this.scale) * scaleDiv;
      const in_row = this.gradients.getRow(iy);
      const out_row = this.lattice.getRow(y);
      for (let x = 0; x < out_row.length; ++x) {
        const ix = Math.floor(x * scaleDiv);
        const fx = (x % this.scale) * scaleDiv;
        const gx = in_row[ix * 2];
        const gy = in_row[ix * 2 + 1];
        out_row[x] = fx * gx + fy * gy;
      }
    }
  }

  get height(): number { return this._height; }
  get width(): number { return this._width; }
  get scale(): number { return this._scale; }
  get roughness(): number { return this._roughness; }
  get gradients(): Lattice { return this._gradients; }
  set gradients(g: Lattice) { this._gradients = g; }
  get lattice(): Lattice { return this._lattice; }
  set lattice(d: Lattice) { this._lattice = d; }

  valueGradientNoise(interpolate = quadraticMean): Array<Float64Array> {
    const result = new Array<Float64Array>(this.height);
    for (let y = 0; y < result.length; ++y) {
      result[y] = new Float64Array(this.width);
    }
    for (let y = 0; y < result.length; ++y) {
      const row = result[y];
      for (let x = 0; x < row.length; ++x) {
        row[x] = interpolate(this, x, y);
      }
    }

    const scaleDiv = 1 / this.scale;
    for (let y = 0; y < result.length; ++y) {
      const row = result[y];
      const gy = Math.floor(y * scaleDiv);
      for (let x = 0; x < row.length; ++x) {
        const gx = Math.floor(x * scaleDiv);
        const grad_noise =
          (this.gradients.getValue(gx * 2, gy) +
           this.gradients.getValue(gx * 2 + 1, gy)) * 0.5;
        row[x] = this.roughness * (row[x] + grad_noise) * 0.5;
      }
    }
    return result;
  }
}
