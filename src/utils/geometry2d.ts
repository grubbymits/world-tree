export enum Orientation {
  Colinear,
  Clockwise,
  CounterClockwise,
}

export class Point2D {
  constructor(private readonly _x: number, private readonly _y: number) {
    Object.freeze(this);
  }
  get x() {
    return this._x;
  }
  get y() {
    return this._y;
  }

  add(vec: Vector2D): Point2D {
    return new Point2D(this.x + vec.x, this.y + vec.y);
  }

  sub(vec: Vector2D): Point2D {
    return new Point2D(this.x - vec.x, this.y - vec.y);
  }

  diff(other: Point2D): Vector2D {
    return new Vector2D(this.x - other.x, this.y - other.y);
  }

  static orientation(p: Point2D, q: Point2D, r: Point2D): Orientation {
    // https://www.geeksforgeeks.org/orientation-3-ordered-points/
    const res: number = (q.y - p.y) * (r.x - q.x) - (q.x - p.x) * (r.y - q.y);
    if (res == 0) {
      return Orientation.Colinear;
    }
    return res > 0 ? Orientation.Clockwise : Orientation.CounterClockwise;
  }
}

export class Segment2D {
  constructor(private readonly _p0: Point2D, private readonly _p1: Point2D) {}

  get p0(): Point2D {
    return this._p0;
  }
  get p1(): Point2D {
    return this._p1;
  }

  contains(p: Point2D): boolean {
    return (
      p.x <= Math.max(this.p0.x, this.p1.x) &&
      p.x >= Math.min(this.p0.x, this.p1.x) &&
      p.y <= Math.max(this.p0.y, this.p1.y) &&
      p.y >= Math.min(this.p0.y, this.p1.y)
    );
  }

  add(diff: Vector2D): Segment2D {
    const p0 = this.p0.add(diff);
    const p1 = this.p1.add(diff);
    return new Segment2D(p0, p1);
  }

  on(p: Point2D): boolean {
    const dxc = p.x - this.p0.x;
    const dyc = p.y - this.p0.y;
    const dxl = this.p1.x - this.p0.x;
    const dyl = this.p1.y - this.p0.y;
    return dxc * dyl - dyc * dxl == 0;
  }

  intersects(other: Segment2D): boolean {
    // Only consider an intersection which crosses properly.
    if (this.on(other.p0)) {
      return false;
    }
    if (this.on(other.p1)) {
      return false;
    }
    // https://www.geeksforgeeks.org/check-if-two-given-line-segments-intersect/

    const o1 = Point2D.orientation(this.p0, this.p1, other.p0);
    const o2 = Point2D.orientation(this.p0, this.p1, other.p1);
    const o3 = Point2D.orientation(other.p0, other.p1, this.p0);
    const o4 = Point2D.orientation(other.p0, other.p1, this.p1);

    if (o1 != o2 && o3 != o4) {
      return true;
    }
    if (o1 == Orientation.Colinear && this.contains(other.p0)) {
      return true;
    }
    if (o2 == Orientation.Colinear && this.contains(other.p1)) {
      return true;
    }
    if (o3 == Orientation.Colinear && other.contains(this.p0)) {
      return true;
    }
    if (o4 == Orientation.Colinear && other.contains(this.p1)) {
      return true;
    }
    return false;
  }

  distance(p: Point2D): number {
    // https://www.geomalgorithms.com/a02-_lines.html
    const vl: number = this.p0.x * this.p1.y - this.p1.x * this.p0.y;
    const w: number = this.p0.x * p.y - p.x * this.p0.y;
    const u =
      1 /
      Math.sqrt(
        Math.pow(this.p1.x - this.p0.x, 2) + Math.pow(this.p1.y - this.p0.y, 2)
      );
    return vl * w * u;
  }
}

export class Vector2D {
  constructor(private readonly _x: number, private readonly _y: number) {
    Object.freeze(this);
  }
  get x() {
    return this._x;
  }
  get y() {
    return this._y;
  }

  dot(other: Vector2D): number {
    const x = this.x * other.x;
    const y = this.y * other.y;
    return x + y;
  }

  mag(): number {
    return Math.sqrt(this.dot(this));
  }

  normalise(): Vector2D {
    const mag = this.mag();
    const x = this.x / mag;
    const y = this.y / mag;
    return new Vector2D(x, y);
  }

  angle(other: Vector2D): number {
    const x = this.x * other.y - other.x * this.y;
    const y = this.dot(other);
    return Math.atan2(x, y);
  }
}
