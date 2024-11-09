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

export class GradientLattice {
  private _gradients: Array<Float64Array>;
  private _lattice: Array<Float64Array>;
  private _noise: Array<Float64Array>;

  constructor(private readonly _x: number,
              private readonly _y: number,
              private readonly _scale: number) {

    // Create 2D grid of normalised 2D vectors.
    this.gradients = new Array<Float64Array>(this.y);
    for (let y = 0; y < _y; ++y) {
      this.gradients[y] = new Float64Array(this.x * 2);
      const row = this._gradients[y];
      for (let x = 0; x < this.x; ++x) {
        const grad = normVector2D(-1, 1);
        row[x * 2] = grad.x;
        row[x * 2 + 1] = grad.y;
      }
    }

    // Create the 2D lattice and the noise output
    this.lattice = new Array<Float64Array>(this.y * this.scale);
    this.noise = new Array<Float64Array>(this.y * this.scale);
    for (let y = 0; y < this.y * this.scale; ++y) {
      this.lattice[y] = new Float64Array(this.x * this.scale);
      this.noise[y] = new Float64Array(this.x * this.scale);
    }

    // Populate the lattice with a dot product of the gradient
    // and the fractional relative position.
    // 0, 1,   2,   3, 4,   5,   6
    // 0, 1/3, 2/3, 0, 4/3, 5/3, 6/3
    // 0, 1/3, 2/3, 0, 1/3, 2/3, 0  
    const scaleDiv = 1 / this.scale;
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

    for (let y = 0; y < this.noise.length - 1; ++y) {
      const row = this.noise[y];
      for (let x = 0; x < row.length - 1; ++x) {
        const f00 = f(x, y);
        const f01 = f(x, y + 1);
        const f10 = f(x + 1, y);
        const f11 = f(x + 1, y + 1);
  
        const a00 = f00;
        const a10 = f10 - f00;
        const a01 = f01 - f00;
        const a11 = f11 - f10 - f01 + f00;
        row[x] = a00 + a10 * x + a01 * y + a11 * x * y;
      }
    }
  }

  get x(): number { return this._x; }
  get y(): number { return this._y; }
  get scale(): number { return this._scale; }
  get gradients(): Array<Float64Array> { return this._gradients; }
  set gradients(g: Array<Float64Array>) { this._gradients = g; }
  get lattice(): Array<Float64Array> { return this._lattice; }
  set lattice(v: Array<Float64Array>) { this._lattice = v; }
  get noise(): Array<Float64Array> { return this._noise; }
  set noise(n: Array<Float64Array>) { this._noise = n; }
}
/*
function gnoise(fx: number, fy: number,
                gradients: Array<Float64Array>): number {

  const ix = Math.floor(fx);
  const fx0 = fx - ix;
  const fx1 = fx0 - 1;
  const wx = smooth(fx0);

  const iy = Math.floor(fy);
  const fy0 = y - iy;
  const fy1 = fy0 - 1;
  const wy = smooth(fy0);

  const vx0 = glattice(ix, iy, fx0, fy0, gradients);
  const vx1 = glattice(ix+1, iy, fx1, fy0, gradients);
  const vy0 = lerp(wx, vx0, vx1);

  const vx2 = glattice(ix, iy+1, fx0, fy1, gradients);
  const vx3 = glattice(ix+1, iy+1, fx1, fy1, gradients);
  const vy1 = lerp(wx, vx2, vx3);

  return lerp(wy, vy0, vy1);
}
*/
