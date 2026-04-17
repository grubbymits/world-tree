// https://css-tricks.com/converting-color-spaces-in-javascript/

export class HSL {
  static fromString(hsl: string): HSL {
    const sep = hsl.indexOf(",") > -1 ? "," : " ";
    const hsl_array = hsl.substr(4).split(")")[0].split(sep);
    const h = Number(hsl_array[0]);
    const s = Number(hsl_array[1].substring(0, hsl_array[1].length - 1));
    const l = Number(hsl_array[2].substring(0, hsl_array[2].length - 1));
    return new HSL(Number(h), Number(s), Number(l));
  }

  constructor(private _h: number,
              private _s: number,
              private _l: number) {
  }
  get h(): number { return this._h; }
  set h(h: number) { this._h = h; }
  get s(): number { return this._s; }
  set s(s: number) { this._s = s; }
  get l(): number { return this._l; }
  set l(l: number) { this._l = l; }

  toString(): string {
    return "hsl(" + this.h + "," + this.s + "%," + this.l + "%)";
  }

  toRGB(): RGB {
    // Must be fractions of 1
    const s = this.s / 100;
    const l = this.l / 100;
    const h = this.h;

    let c = (1 - Math.abs(2 * l - 1)) * s;
    let x = c * (1 - Math.abs((h / 60) % 2 - 1));
    let m = l - c/2;
    let r = 0;
    let g = 0;
    let b = 0;

    if (0 <= h && h < 60) {
      r = c; g = x; b = 0;
    } else if (60 <= h && h < 120) {
      r = x; g = c; b = 0;
    } else if (120 <= h && h < 180) {
      r = 0; g = c; b = x;
    } else if (180 <= h && h < 240) {
      r = 0; g = x; b = c;
    } else if (240 <= h && h < 300) {
      r = x; g = 0; b = c;
    } else if (300 <= h && h < 360) {
      r = c; g = 0; b = x;
    }
    r = Math.round((r + m) * 255);
    g = Math.round((g + m) * 255);
    b = Math.round((b + m) * 255);
    return new RGB(r, g, b);
  }

  changeLight(dl: number): HSL {
    let l = this.l + dl;
    if (l < 0) {
      l = 0;
    } else if (l > 100) {
      l = 100;
    }
    return new HSL(this.h, this.s, l);
  }
}

export class RGB {

  static fromString(rgb: string): RGB {
    // Choose correct separator
    const sep = rgb.indexOf(",") > -1 ? "," : " ";
    // Turn "rgb(r,g,b)" into [r,g,b]
    const rgb_array = rgb.substr(4).split(")")[0].split(sep);
    return new RGB(Number(rgb_array[0]), Number(rgb_array[1]), Number(rgb_array[2]));
  }

  static fromHex(h: string): RGB {
    let r: string;
    let g: string;
    let b: string;

    // 3 digits
    if (h.length == 4) {
      r = "0x" + h[1] + h[1];
      g = "0x" + h[2] + h[2];
      b = "0x" + h[3] + h[3];

    // 6 digits
    } else {
      console.assert(h.length == 7);
      r = "0x" + h[1] + h[2];
      g = "0x" + h[3] + h[4];
      b = "0x" + h[5] + h[6];
    }
    return new RGB(Number(r), Number(g), Number(b));
  }

  constructor(private _r: number,
              private _g: number,
              private _b: number) { }
  get r(): number { return this._r; }
  set r(r: number) { this._r = r; }
  get g(): number { return this._g; }
  set g(g: number) { this._g = g; }
  get b(): number { return this._b; }
  set b(b: number) { this._b = b; }

  toString(): string {
    return "rgb("+ +this.r + "," + +this.g + "," + +this.b + ")";
  }

  toHSL(): HSL {
    // Make r, g, and b fractions of 1
    const rf = this.r / 255;
    const gf = this.g / 255;
    const bf = this.b / 255;

    // Find greatest and smallest channel values
    let cmin = Math.min(rf,gf,bf);
    let cmax = Math.max(rf,gf,bf);
    let delta = cmax - cmin;
    let h = 0;
    let s = 0;
    let l = 0;

    // Calculate hue
    // No difference
    if (delta == 0)
      h = 0;
    // Red is max
    else if (cmax == rf)
      h = ((gf - bf) / delta) % 6;
    // Green is max
    else if (cmax == gf)
      h = (bf - rf) / delta + 2;
    // Blue is max
    else
      h = (rf - gf) / delta + 4;

    h = Math.round(h * 60);

    // Make negative hues positive behind 360°
    if (h < 0)
        h += 360;

    // Calculate lightness
    l = (cmax + cmin) / 2;

    // Calculate saturation
    s = delta == 0 ? 0 : delta / (1 - Math.abs(2 * l - 1));
      
    // Multiply l and s by 100
    s = +(s * 100).toFixed(1);
    l = +(l * 100).toFixed(1);
    return new HSL(h, s, l);
  }
}

