import { Vector2D } from './geometry.ts';

function randomRange(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

function normVector2D(min: number, max: number): Vector2D {
  const x = randomRange(min, max);
  const y = randomRange(min, max);
  return new Vector2D(x, y).normalise();
}

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
              private readonly _factor: number) {
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
  get factor(): number { return this._factor; }
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
        row[x] = this.factor * (row[x] + grad_noise) * 0.5;
      }
    }
    return result;
  }
}
