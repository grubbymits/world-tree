export interface NoiseFunction {
  (x: number, y: number): number;
}

export interface NoiseGenerator {
  (x: number,
   y: number,
   freq: number,
   G: number,
   octaves: number,
   noise2d: NoiseFunction): number;
}

export class Noise {

  private static _cached: Noise;

  static async Create(): Promise<Noise> {
    if (this._cached != undefined) {
      return this._cached;
    }
    return WebAssembly.instantiateStreaming(fetch("../dist/noise.wasm"), {}).then(
      (obj) => {
        this._cached = new Noise(obj.instance);
        return this._cached;
      }
    );
  }

  private constructor(private readonly _wasm_instance: WebAssembly.Instance) { }

  get wasm_instance(): WebAssembly.Instance {
    return this._wasm_instance;
  }
  get no_fade(): NoiseFunction {
    return <NoiseFunction>this.wasm_instance.exports.noise2d;
  }
  get hermite_fade(): NoiseFunction {
    return <NoiseFunction>this.wasm_instance.exports.noise2d_hermite;
  }
  get quintic_fade(): NoiseFunction {
    return <NoiseFunction>this.wasm_instance.exports.noise2d_quintic;
  }
}

export function Fbm(x: number,
                    y: number,
                    freq: number,
                    G: number,
                    octaves: number,
                    noise2d: NoiseFunction): number {
  let a = 1.0;
  let t = 0.0;
  let total_square_a = 0.0;
  const lac = Math.pow(Math.LOG2E, 2);
  for (let i = 0; i < octaves; i++) {
    const px = freq * x;
    const py = freq * y;
    const n = noise2d(px, py);
    t += a * n;
    freq *= lac;
    total_square_a += Math.pow(a, 2);
    a *= G;
  }
  console.assert(total_square_a);
  return t /= Math.sqrt(total_square_a);
}
  
export function FbmMulti(x: number,
                         y: number,
                         freq: number,
                         G: number,
                         octaves: number,
                         noise2d: NoiseFunction): number {
  
  let a = 1.0;
  let t = 0.0;
  let total_square_a = 0.0;
  const lac = Math.pow(Math.LOG2E, 2);
  for (let i = 0; i < octaves; i++) {
    const px = freq * x;
    const py = freq * y;
    let n = noise2d(px, py);
    if (i > 1) {
      const factor = Math.min(1.0, Math.max(n, 0.0));
      n *= factor;
    }
    t += a * n;
    freq *= lac;
    total_square_a += Math.pow(a, 2);
    a *= G;
  }
  console.assert(total_square_a);
  return t /= Math.sqrt(total_square_a);
}

export function Turbulence(x: number,
                           y: number,
                           freq: number,
                           G: number,
                           octaves: number,
                           noise2d: NoiseFunction): number {
  let a = 1.0;
  let t = 0.0;
  const lac = Math.pow(Math.LOG2E, 2);
  for (let i = 0; i < octaves; i++) {
    t += a * Math.abs(noise2d(freq * x, freq * y));
    freq *= lac;
    a *= G;
  }
  return t;
}

export function Ridged(x: number,
                       y: number,
                       freq: number,
                       G: number,
                       octaves: number,
                       noise2d: NoiseFunction): number {
  let a = 1.0;
  let t = 0.0;
  const lac = Math.pow(Math.LOG2E, 2);
  for (let i = 0; i < octaves; i++) {
    t += 1 - a * Math.abs(noise2d(freq * x, freq * y));
    freq *= lac;
    a *= G;
  }
  return t;
}
 
export function RidgedMulti(x: number,
                            y: number,
                            freq: number,
                            G: number,
                            octaves: number,
                            noise2d: NoiseFunction): number {
  const baseline = 1.0;
  const gain = 2.0;
  let a = 1.0;
  let t = 0.0;
  let weight = 1.0;
  const lac = Math.pow(Math.LOG2E, 2);

  for (let i = 0; i < octaves; i++) {
    let signal = Math.abs(noise2d(freq * x, freq * y));
    signal = baseline - signal;
    signal *= signal;
    signal *= weight;
    t += signal * a;
    freq *= lac;
    a *= G;

    weight = signal * gain;
    // clamp.
    weight = Math.min(1.0, Math.max(weight, 0.0));
  }
  return t;
}
  /*
  domain_warp(x: number,
              y: number,
              offset_x: number,
              offset_y: number,
              freq: number,
              G: number,
              octaves: number,
              gen_func) {
    // https://iquilezles.org/articles/warp/
    const nx = fbm(x: y, offset_x, offset_y, freq, G, octaves);
    const ny = fbm(x + 5.2, y + 1.3, offset_x, offset_y, freq, G, octaves);
    return gen_func(x + nx * 4.0, y + ny * 4.0, offset_x, offset_y, freq, G,
                    octaves);
  }
  */

function NoiseLattice(width: number,
                      height: number,
                      offset_x: number,
                      offset_y: number,
                      H: number,
                      freq: number,
                      octaves: number,
                      noise_generator: NoiseGenerator,
                      noise2d: NoiseFunction): Array<Float32Array> {
  const lattice = new Array<Float32Array>();
  const G = Math.pow(2, -H);

  for (let y = 0; y < height; ++y) {
    lattice[y] = new Float32Array(width);
    for (let x = 0; x < width; ++x) {
      lattice[y][x] = noise_generator(
        x + offset_x,
        y + offset_y,
        freq,
        G,
        octaves,
        noise2d,
      );
    }
  }
  return lattice;
}

export async function GradientNoise(width: number,
                                    height: number,
                                    offset_x: number,
                                    offset_y: number,
                                    H: number,
                                    freq: number,
                                    octaves: number): Promise<Array<Float32Array>> {
  console.assert(offset_x >= 1);
  console.assert(offset_y >= 1);
  
  return Noise.Create().then((noise) =>
    NoiseLattice(
      width,
      height,
      offset_x,
      offset_y,
      H,
      freq,
      octaves,
      Fbm,
      noise.quintic_fade,
    ),
  );
}
