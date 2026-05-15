
export interface NoiseFunction {
  (x: number, y: number): number;
}

export class Noise {
  private readonly _wasm_instance;

  constructor() {
    WebAssembly.instantiateStreaming(fetch("noise.wasm"), {}).then(
      (obj) => this._wasm_instance = obj.instance;
    );
  }

  get no_fade(): NoiseFunction {
    return this.wasm_instance.exports.noise2d;
  }
  get hermite_fade(): NoiseFunction {
    return this.wasm_instance.exports.noise2d_hermite;
  }
  get quintic_fade(): NoiseFunction {
    return this.wasm_instance.exports.noise2d_quintic;
  }

  fbm(x: number,
      y: number,
      offset_x: number,
      offset_y: number,
      freq: number,
      G: number,
      octaves: number,
      noise2d: NoiseFunction) {
    console.assert(x + offset_x >= 1);
    console.assert(y + offset_y >= 1);
  
    let a = 1.0;
    let t = 0.0;
    let total_square_a = 0.0;
    const lac = Math.pow(Math.LOG2E, 2);
    for (let i = 0; i < octaves; i++) {
      const px = freq * x + offset_x;
      const py = freq * y + offset_y;
      const n = noise2d(px, py);
      if (!check_num(n)) {
        console.log('n:', n);
        console.log('octave:', i);
        console.log('px:', px);
        console.log('py:', py);
        throw new Error('noise NaN!');
      }
      t += a * n;
      freq *= lac;
      total_square_a += Math.pow(a, 2);
      a *= G;
    }
    console.assert(total_square_a);
    return t /= Math.sqrt(total_square_a);
  }
  
  fbmMulti(x: number,
           y: number,
           offset_x: number,
           offset_y: number,
           freq: number,
           G: number,
           octaves: number,
           noise2d: NoiseFunction) {
  
    let a = 1.0;
    let t = 0.0;
    let total_square_a = 0.0;
    const lac = Math.pow(Math.LOG2E, 2);
    for (let i = 0; i < octaves; i++) {
      const px = freq * x + offset_x;
      const py = freq * y + offset_y;
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
  
  ridged(x: number,
         y: number,
         offset_x: number,
         offset_y: number,
         freq: number,
         G: number,
         octaves: number,
         noise2d: NoiseFunction) {
    let a = 1.0;
    let t = 0.0;
    const lac = Math.pow(Math.LOG2E, 2);
    for (let i = 0; i < octaves; i++) {
      t += 1 - a * Math.abs(noise2d(freq * x + offset_x, freq * y + offset_y));
      freq *= lac;
      a *= G;
    }
    return t;
  }
  
  turbulence(x: number,
             y: number,
             offset_x: number,
             offset_y: number,
             freq: number,
             G: number,
             octaves: number,
             noise2d: NoiseFunction) {
    let a = 1.0;
    let t = 0.0;
    const lac = Math.pow(Math.LOG2E, 2);
    for (let i = 0; i < octaves; i++) {
      t += a * Math.abs(noise2d(freq * x + offset_x, freq * y + offset_y));
      freq *= lac;
      a *= G;
    }
    return t;
  }
  
  ridgedMulti(x: number,
              y: number,
              offset_x: number,
              offset_y: number,
              freq: number,
              G: number,
              octaves: number,
              noise2d: NoiseFunction) {
    const baseline = 1.0;
    const gain = 2.0;
    let a = 1.0;
    let t = 0.0;
    let weight = 1.0;
    const lac = Math.pow(Math.LOG2E, 2);
  
    for (let i = 0; i < octaves; i++) {
      let signal = Math.abs(noise2d(freq * x + offset_x, freq * y + offset_y));
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
}
