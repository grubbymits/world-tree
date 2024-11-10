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

function smooth(x: number): number {
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

export class GradientLattice {
  private _latticeWidth: number;
  private _latticeHeight: number;
  private _gradientWidth: number;
  private _gradientHeight: number;
  private _gradients: Array<Float64Array>;
  private _lattice: Array<Float64Array>;
  private _noise: Array<Float64Array>;

  constructor(private readonly _width: number,
              private readonly _height: number,
              private readonly _scale: number) {

    // lattice = noise + 1;
    // gradient = (lattice + (scale - 1)) / scale;
    const scaleDiv = 1 / this.scale;
    this.latticeWidth = this.width + 1;
    this.latticeHeight = this.height + 1;
    this.gradientWidth = (this.latticeWidth + (this.scale - 1)) * scaleDiv;
    this.gradientHeight = (this.latticeHeight + (this.scale - 1)) * scaleDiv;

    // Create 2D grid of normalised 2D vectors.
    this.gradients = new Array<Float64Array>(this.gradientHeight);
    for (let y = 0; y < this.gradients.length; ++y) {
      // * 2 to store x and y.
      this.gradients[y] = new Float64Array(this.gradientWidth * 2);
      const row = this.gradients[y];
      for (let x = 0; x < row.length; ++x) {
        const grad = normVector2D(-1, 1);
        row[x * 2] = grad.x;
        row[x * 2 + 1] = grad.y;
      }
    }

    // Create the 2D lattice and the noise output
    this.lattice = new Array<Float64Array>(this.latticeHeight);
    for (let y = 0; y < this.lattice.length; ++y) {
      this.lattice[y] = new Float64Array(this.latticeWidth);
    }
    this.noise = new Array<Float64Array>(this.height);
    for (let y = 0; y < this.noise.length; ++y) {
      this.noise[y] = new Float64Array(this.width);
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

    const f = (x: number, y: number): number => this.lattice[y][x];

    for (let y = 0; y < this.noise.length; ++y) {
      const row = this.noise[y];
      const wy = 1; //smoothstep();
      for (let x = 0; x < row.length; ++x) {
        const f00 = f(x, y);
        const f01 = f(x, y + 1);
        const f10 = f(x + 1, y);
        const f11 = f(x + 1, y + 1);
        const wx = 1; //smoothstep();
        const a00 = f00;
        const a10 = f10 - f00;
        const a01 = f01 - f00;
        const a11 = f11 - f10 - f01 + f00;
        row[x] = a00 + (a10 * x * wx) + (a01 * y * wy) + (a11 * x * y);
      }
    }
  }

  get width(): number { return this._width; }
  get height(): number { return this._height; }
  get scale(): number { return this._scale; }
  get latticeWidth(): number { return this._latticeWidth; }
  set latticeWidth(w: number) { this._latticeWidth = w; }
  get latticeHeight(): number { return this._latticeHeight; }
  set latticeHeight(h: number) { this._latticeHeight = h; }
  get gradientWidth(): number { return this._gradientWidth; }
  set gradientWidth(w: number) { this._gradientWidth = w; }
  get gradientHeight(): number { return this._gradientHeight; }
  set gradientHeight(h: number) { this._gradientHeight = h; }
  get gradients(): Array<Float64Array> { return this._gradients; }
  set gradients(g: Array<Float64Array>) { this._gradients = g; }
  get lattice(): Array<Float64Array> { return this._lattice; }
  set lattice(v: Array<Float64Array>) { this._lattice = v; }
  get noise(): Array<Float64Array> { return this._noise; }
  set noise(n: Array<Float64Array>) { this._noise = n; }
}
