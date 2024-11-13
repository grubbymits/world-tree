import { Vector2D } from './geometry.ts';

function randomRange(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

function normVector2D(min: number, max: number): Vector2D {
  const x = randomRange(min, max);
  const y = randomRange(min, max);
  return new Vector2D(x, y).normalise();
}

function lerp(t: number, x0: number, x1: number): number {
  return x0 + t * (x1 - x0);
}

function smoothstep(x: number): number {
  return x * x * (3 - 2 * x);
}

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

export class LatticeNoise  {
  private _gradients: Array<Float64Array>;
  private _lattice: Array<Float64Array>;

  constructor(private readonly _width: number,
              private readonly _height: number,
              private readonly _scale: number,
              private readonly _factor: number) {

    // lattice = noise + 1;
    // gradient = (lattice + (scale - 1)) / scale;
    const scaleDiv = 1 / this.scale;
    const latticeWidth = this.width + 1;
    const latticeHeight = this.height + 1;
    const gradientWidth = (latticeWidth + (this.scale - 1)) * scaleDiv;
    const gradientHeight = (latticeHeight + (this.scale - 1)) * scaleDiv;

    // Create 2D grid of normalised 2D vectors.
    this.gradients = new Array<Float64Array>(gradientHeight);
    for (let y = 0; y < this.gradients.length; ++y) {
      // * 2 to store x and y.
      this.gradients[y] = new Float64Array(gradientWidth * 2);
      const row = this.gradients[y];
      for (let x = 0; x < row.length; ++x) {
        const grad = normVector2D(-1, 1);
        row[x * 2] = grad.x;
        row[x * 2 + 1] = grad.y;
      }
    }

    // Create the 2D lattice and the noise output
    this.lattice = new Array<Float64Array>(latticeHeight);
    for (let y = 0; y < this.lattice.length; ++y) {
      this.lattice[y] = new Float64Array(latticeWidth);
    }

    // Populate the lattice with a dot product of the gradient
    // and the fractional relative position.
    for (let y = 0; y < this.lattice.length; ++y) {
      const iy = Math.floor(y * scaleDiv);
      const fy = (y % this.scale) * scaleDiv;
      const in_row = this.gradients[iy];
      const out_row = this.lattice[y];
      for (let x = 0; x < out_row.length; ++x) {
        const ix = Math.floor(x * scaleDiv);
        const fx = (x % this.scale) * scaleDiv;
        const gx = in_row[ix * 2];
        const gy = in_row[ix * 2 + 1];
        out_row[x] = fx * gx + fy * gy;
      }
    }
  }

  get width(): number { return this._width; }
  get height(): number { return this._height; }
  get scale(): number { return this._scale; }
  get factor(): number { return this._factor; }
  get gradients(): Array<Float64Array> { return this._gradients; }
  set gradients(g: Array<Float64Array>) { this._gradients = g; }
  get lattice(): Array<Float64Array> { return this._lattice; }
  set lattice(v: Array<Float64Array>) { this._lattice = v; }

  get value(): Array<Float64Array> {
    const noise = new Array<Float64Array>(this.height);
    for (let y = 0; y < noise.length; ++y) {
      noise[y] = new Float64Array(this.width);
    }
    const f = (x: number, y: number): number => this.lattice[y][x];
    const scaleDiv = 1 / this.scale;
    for (let y = 0; y < noise.length; ++y) {
      const row = noise[y];
      const fy = (y % this.scale) * scaleDiv;
      const wy = smoothstep(fy);
      for (let x = 0; x < row.length; ++x) {
        const f00 = f(x, y);
        const f01 = f(x, y + 1);
        const f10 = f(x + 1, y);
        const f11 = f(x + 1, y + 1);
        const fx = (x % this.scale) * scaleDiv;
        const wx = smoothstep(fx);
        const lerpx = lerp(wx, f00, f10);
        const lerpy = lerp(wx, f01, f11);
        const value_noise = lerp(wy, lerpx, lerpy);
        row[x] = value_noise;
      }
    }
    return noise;
  }

  get valueGradient(): Array<Float64Array> {
    const noise = this.value;
    const scaleDiv = 1 / this.scale;
    for (let y = 0; y < noise.length; ++y) {
      const row = noise[y];
      const gy = Math.floor(y * scaleDiv);
      for (let x = 0; x < row.length; ++x) {
        const gx = Math.floor(x * scaleDiv);
        const grad_noise =
          (this.gradients[gy][gx*2] + this.gradients[gy][gx*2+1]) * 0.5;
        row[x] = this.factor * (row[x] + grad_noise) * 0.5;
      }
    }
    return noise;
  }
}
