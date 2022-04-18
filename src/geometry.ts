import { BoundingCuboid } from "./physics.js"

export enum Orientation {
  Colinear,
  Clockwise,
  CounterClockwise,
}

export class Vector2D {
  constructor(private readonly _x: number,
              private readonly _y: number) {
    Object.freeze(this);
  }
  get x() { return this._x; }
  get y() { return this._y; }

  dot(other: Vector2D): number {
    const x = this.x * other.x;
    const y = this.y * other.y;
    return x + y;
  }

  mag(): number {
    return this.dot(this);
  }

  angle(other: Vector2D): number {
    let x = this.x * other.y - other.x * this.y;
    let y = this.dot(other);
    return Math.atan2(x, y);
  }
}

export class Point2D {
  constructor(private readonly _x: number,
              private readonly _y: number) {
    Object.freeze(this);
  }
  get x() { return this._x; }
  get y() { return this._y; }

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
    const res: number = (q.y - p.y) * (r.x - q.x) -
                        (q.x - p.x) * (r.y - q.y);
    if (res == 0) {
      return Orientation.Colinear;
    }
    return res > 0 ? Orientation.Clockwise : Orientation.CounterClockwise;
  }
}

export class Segment2D {
  constructor(private readonly _p0: Point2D,
              private readonly _p1: Point2D) {
  }

  get p0(): Point2D { return this._p0; }
  get p1(): Point2D { return this._p1; }

  contains(p: Point2D): boolean {
    return p.x <= Math.max(this.p0.x, this.p1.x) &&
           p.x >= Math.min(this.p0.x, this.p1.x) &&
           p.y <= Math.max(this.p0.y, this.p1.y) &&
           p.y >= Math.min(this.p0.y, this.p1.y);
  }

  on(p: Point2D): boolean {
    const dxc = p.x - this.p0.x;
    const dyc = p.y - this.p0.y;
    const dxl = this.p1.x - this.p0.x;
    const dyl = this.p1.y - this.p0.y;
    return (dxc * dyl - dyc * dxl) == 0;
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
    const u = 1 / Math.sqrt(Math.pow(this.p1.x - this.p0.x, 2) +
                            Math.pow(this.p1.y - this.p0.y, 2));
    return vl * w * u;
  }
}

export class Point3D {
  constructor(private readonly _x: number,
              private readonly _y: number,
              private readonly _z: number) {
    Object.freeze(this);
  }

  get x(): number { return this._x; }
  get y(): number { return this._y; }
  get z(): number { return this._z; }

  add(vector: Vector3D): Point3D {
    return new Point3D(this.x + vector.x,
                       this.y + vector.y,
                       this.z + vector.z);
  }

  mul(v: Vector3D): Point3D {
    return new Point3D(this.x * v.x,
                       this.y * v.y,
                       this.z * v.z);
  }

  addScalar(v: number): Point3D {
    return new Point3D(this.x + v, this.y + v, this.z + v);
  }

  sub(vector: Vector3D): Point3D {
    return new Point3D(this.x - vector.x,
                       this.y - vector.y,
                       this.z - vector.z);
  }

  vec_diff(other: Point3D): Vector3D {
    return new Vector3D(this.x - other.x,
                        this.y - other.y,
                        this.z - other.z);
  }

  isSameAsRounded(other: Point3D): boolean {
    return Math.round(this.x) == Math.round(other.x) &&
           Math.round(this.y) == Math.round(other.y) &&
           Math.round(this.z) == Math.round(other.z);
  }

  isSameAs(other: Point3D): boolean {
    return this.x === other.x && this.y === other.y && this.z === other.z;
  }
}

export class Vector3D {
  constructor(private readonly _x: number,
              private readonly _y: number,
              private readonly _z: number) {
    Object.freeze(this);
  }

  get x(): number { return this._x; }
  get y(): number { return this._y; }
  get z(): number { return this._z; }
  get zero(): boolean {
    return this.x === 0 && this.y === 0 && this.z === 0;
  }
  get asString(): string {
      return "(x, y, z) = (" + this.x + ", " + this.y + ", " + this.z + ")";
  }

  add(other: Vector3D): Vector3D {
    const x = this.x + other.x;
    const y = this.y + other.y;
    const z = this.z + other.z;
    return new Vector3D(x, y, z);
  }

  mulScalar(factor: number): Vector3D {
    const x = this.x * factor;
    const y = this.y * factor;
    const z = this.z * factor;
    return new Vector3D(x, y, z);
  }

  dot(other: Vector3D): number {
    const x = this.x * other.x;
    const y = this.y * other.y;
    const z = this.z * other.z;
    return x + y + z;
  }

  mag(): number {
    return this.dot(this);
  }

  cross(other: Vector3D): Vector3D {
    const x = this.y * other.z - this.z * other.y;
    const y = this.z * other.x - this.x * other.z;
    const z = this.x * other.y - this.y * other.x;
    return new Vector3D(x, y, z);
  }

  norm(): number {
    return Math.sqrt(this.dot(this));
  }

  angle(other: Vector3D): number {
    // https://www.jwwalker.com/pages/angle-between-vectors.html
    let x = this.cross(other).mag();
    let y = this.dot(other);
    return Math.atan2(x, y);
  }

  absMin(other: Vector3D): Vector3D {
    const x = Math.abs(this.x) < Math.abs(other.x) ? this.x : other.x;
    const y = Math.abs(this.y) < Math.abs(other.y) ? this.y : other.y;
    const z = Math.abs(this.z) < Math.abs(other.z) ? this.z : other.z;
    return new Vector3D(x, y, z);
  }

  equal(other: Vector3D): boolean {
      return this.x == other.x &&
             this.y == other.y &&
             this.z == other.z;
  }
}

export class Vertex3D {
  private readonly _normal: Vector3D;
  private readonly _v: Vector3D;
  private readonly _u: Vector3D;

  constructor(private _point: Point3D,
              a: Point3D,
              b: Point3D) {
    this._u = a.vec_diff(_point);
    this._v = b.vec_diff(_point);
    this._normal = this.u.cross(this.v);
  }
  get point(): Point3D { return this._point; }
  get normal(): Vector3D { return this._normal; }
  get u(): Vector3D { return this._u; }
  get v(): Vector3D { return this._v; }

  transform(d: Vector3D): void {
    this._point = this.point.add(d);
  }

  get asString(): string {
    return "normal = " + this.normal.asString +
    ", u = " + this.u.asString +
    ", v = " + this.u.asString;
  }

  // http://www.geomalgorithms.com/a04-_planes.html#Distance-Point-to-Plane
  distance(p: Point3D): number {
    const sn: number = -this.normal.dot(p.vec_diff(this.point));
    const sd: number = this.normal.dot(this.normal);
    const sb: number = sn / sd;
    const closest: Point3D = p.addScalar(sb).mul(this.normal);
    const d: number = p.vec_diff(closest).norm();
    return d;
  }

  // https://www.geomalgorithms.com/a05-_intersect-1.html 
  intersects(begin: Point3D, end: Point3D): Point3D|null {
    // Use the vertex to represent a plane and calculate whether the segment
    // (begin, end) intersects that plane.
    const dir: Vector3D = end.vec_diff(begin);
    const w0: Vector3D = begin.vec_diff(this.point);
    const a: number = -this.normal.dot(w0);
    const b: number = this.normal.dot(dir);
    // Check whether the line is (almost) parallel to the plane.
    if (Math.abs(b) < 0.01) {
      return null;
    }
    const r = a / b;
    if (r < 0 || r  > 1) {
      return null;
    }
    return begin.add(dir.mulScalar(r));
  }
}

export abstract class Face3D {
  constructor(protected readonly _vertex: Vertex3D) { }
  get vertex(): Vertex3D { return this._vertex; }
  get plane(): Vertex3D { return this._vertex; }
  intersectsPlane(begin: Point3D, end: Point3D): Point3D|null {
    return this.plane.intersects(begin, end);
  }
  abstract transform(d: Vector3D): void;
  // Given that the segment 'begin' -> 'end' intersects the plane, test
  // whether it intersects this face.
  abstract intersects(end: Point3D): boolean;

  abstract vertices(): Array<Vertex3D>;
}

class TriangleFace3D extends Face3D {
  private readonly _uDotv: number;
  private readonly _uDotu: number;
  private readonly _vDotv: number;
  private readonly _denominator: number;

  constructor(vertex: Vertex3D) {
    super(vertex);
    let u = this.vertex.u;
    let v = this.vertex.v;
    this._uDotv = u.dot(v);
    this._uDotu = u.dot(u);
    this._vDotv = v.dot(v);
    this._denominator = 1 / (Math.pow(this._uDotv, 2) - this._uDotu * this._vDotv);
  }

  vertices(): Array<Vertex3D> { return [ this.vertex ]; }

  transform(d: Vector3D): void {
    this.vertex.transform(d);
  }

  // https://www.geomalgorithms.com/a06-_intersect-2.html 
  intersects(i: Point3D): boolean {
    // Given that a segment intersects the plane, at i, of this face, calculate
    // whether the intersection point is within the triangle.
    let w = i.vec_diff(this.vertex.point);
    let u = this.vertex.u;
    let v = this.vertex.v;
    let wDotv = w.dot(v);
    let wDotu = w.dot(u);
    let s1 = (this._uDotv * wDotv - this._vDotv * wDotu) * this._denominator;
    let t1 = (this._uDotv * wDotu - this._uDotu * wDotv) * this._denominator;
    return s1 >= 0 && t1 >= 0 && s1 + t1 <= 1;
  }
}

// Two vertices, which can be connected to create a diagonal edge across a
// quad-edge polygon (two triangles). Both vertices are on the same plane.
export class QuadFace3D extends Face3D {
  private readonly _triangleA: TriangleFace3D;
  private readonly _triangleB: TriangleFace3D;

  constructor(vertexA: Vertex3D,
              vertexB: Vertex3D) {
    super(vertexA);
    if (!vertexA.normal.equal(vertexB.normal)) {
      throw("Expected QuadFace3D vertices to have equilavent normals");
    }
    this._triangleA = new TriangleFace3D(vertexA);
    this._triangleB = new TriangleFace3D(vertexB);
  }

  vertices(): Array<Vertex3D> { return [ this._triangleA.vertex,
                                         this._triangleB.vertex ]; }

  transform(d: Vector3D): void {
    this._triangleA.transform(d);
    this._triangleB.transform(d);
  }

  intersects(i: Point3D): boolean {
    return this._triangleA.intersects(i) || this._triangleB.intersects(i);
  }
}

export class IntersectInfo {
  constructor(private readonly _face: Face3D,
              private readonly _begin: Point3D,
              private readonly _end: Point3D,
              private readonly _i: Point3D,
              private readonly _theta: number) { }
  get face(): Face3D { return this._face; }
  get begin(): Point3D { return this._begin; }
  get end(): Point3D { return this._end; }
  get i(): Point3D { return this._i; }
  get theta(): number { return this._theta; }
}

export class Geometry {
  protected _faces: Array<Face3D> = new Array<Face3D>();
  protected _intersectInfo: IntersectInfo | null;
  protected readonly _widthVec3D: Vector3D;
  protected readonly _depthVec3D: Vector3D;
  protected readonly _heightVec3D: Vector3D;

  constructor(protected _bounds: BoundingCuboid) {
    this._widthVec3D = new Vector3D(_bounds.width, 0, 0);
    this._depthVec3D = new Vector3D(0, _bounds.depth, 0);
    this._heightVec3D = new Vector3D(0, 0, _bounds.height);
  }

  get bounds(): BoundingCuboid { return this._bounds; }
  get widthVec3D(): Vector3D { return this._widthVec3D; }
  get depthVec3D(): Vector3D { return this._depthVec3D; }
  get heightVec3D(): Vector3D { return this._heightVec3D; }
  get intersectInfo(): IntersectInfo | null { return this._intersectInfo; }

  transform(d: Vector3D): void {
    for (let face of this._faces) {
      face.transform(d);
    }
  }

  obstructs(begin: Point3D, end: Point3D): IntersectInfo|null {
    for (let face of this._faces) {
      let i = face.intersectsPlane(begin, end);
      if (i != null && face.intersects(i)) {
        let v0 = i.vec_diff(begin);
        let v1 = face.plane.normal;
        let theta = v0.angle(v1);
        return new IntersectInfo(face, begin, end, i, theta);
      }
    }
    return null;
  }
}

export class NoGeometry extends Geometry {
  constructor(bounds: BoundingCuboid) {
    super(bounds);
  }
  obstructs(begin: Point3D, end: Point3D): IntersectInfo|null { return null; }
}

export class CuboidGeometry extends Geometry {
  constructor(bounds: BoundingCuboid) {
    super(bounds);

    //  1  ________ 5
    //    |\       \
    //    | \       \
    //    |  \6______\ 7
    //  0 |   |      |
    //     \  |      |
    //      \ |      |
    //       \|______|
    //       2        4
    const p: Array<Point3D> = [
      this.bounds.minLocation,                         // 0 
      this.bounds.minLocation.add(this.heightVec3D),   // 1
      this.bounds.minLocation.add(this.depthVec3D),    // 2
      this.bounds.minLocation.add(this.widthVec3D),    // 3
      this.bounds.maxLocation.sub(this.heightVec3D),   // 4
      this.bounds.maxLocation.sub(this.depthVec3D),    // 5
      this.bounds.maxLocation.sub(this.widthVec3D),    // 6
      this.bounds.maxLocation                          // 7
    ];

    // left
    let v0 = new Vertex3D(p[2], p[6], p[0]);
    let v1 = new Vertex3D(p[1], p[0], p[6]);
    this._faces.push(new QuadFace3D(v0, v1));

    // front
    let v2 = new Vertex3D(p[4], p[7], p[2]);
    let v3 = new Vertex3D(p[6], p[2], p[7]);
    this._faces.push(new QuadFace3D(v2, v3));

    // right
    let v4 = new Vertex3D(p[3], p[5], p[4]);
    let v5 = new Vertex3D(p[7], p[4], p[5]);
    this._faces.push(new QuadFace3D(v4, v5));

    // top
    let v6 = new Vertex3D(p[5], p[1], p[7]);
    let v7 = new Vertex3D(p[6], p[7], p[1]);
    this._faces.push(new QuadFace3D(v6, v7));

    // bottom
    let v8 = new Vertex3D(p[0], p[3], p[2]);
    let v9 = new Vertex3D(p[4], p[2], p[3]);
    this._faces.push(new QuadFace3D(v8, v9));

    // back
    let v10 = new Vertex3D(p[0], p[1], p[3]);
    let v11 = new Vertex3D(p[5], p[3], p[1]);
    this._faces.push(new QuadFace3D(v10, v11));
  }
}

export class RampUpWestGeometry extends Geometry {
  constructor(bounds: BoundingCuboid) {
    super(bounds);
    //     4
    //     /\
    //    /  \
    // 5 /    \
    //  |\     \
    //  | \     \ 2
    //  |  \    /
    //  |   \  /
    //  |____\/
    //  1     3
    const p: Array<Point3D> = [
      this.bounds.minLocation,                       // 0
      this.bounds.minLocation.add(this.depthVec3D),  // 1
      this.bounds.minLocation.add(this.widthVec3D),  // 2
      this.bounds.maxLocation.sub(this.heightVec3D), // 3
      this.bounds.minLocation.add(this.heightVec3D), // 4
      this.bounds.maxLocation.sub(this.widthVec3D)   // 5
    ];

    // left
    const v0 = new Vertex3D(p[1], p[5], p[0]);
    const v1 = new Vertex3D(p[4], p[0], p[5]);
    this._faces.push(new QuadFace3D(v0, v1));

    // front
    this._faces.push(new TriangleFace3D(new Vertex3D(p[1], p[3], p[5])));

    // right
    const v2 = new Vertex3D(p[2], p[4], p[3]);
    const v3 = new Vertex3D(p[5], p[3], p[4]);
    this._faces.push(new QuadFace3D(v2, v3));

    // bottom
    const v4 = new Vertex3D(p[3], p[1], p[2]);
    const v5 = new Vertex3D(p[0], p[2], p[1]);

    // back
    this._faces.push(new TriangleFace3D(new Vertex3D(p[0], p[4], p[2])));
  }
}

export class RampUpEastGeometry extends Geometry {
  constructor(bounds: BoundingCuboid) {
    super(bounds);
    //         4
    //        / \
    //       /   \
    //      /     \ 5
    //   0 /     / |
    //     \    /  |
    //      \  /   |
    //       \/____|
    //       1      3
    const p: Array<Point3D> = [
      this.bounds.minLocation,                      // 0 
      this.bounds.minLocation.add(this.depthVec3D), // 1
      this.bounds.minLocation.add(this.widthVec3D), // 2
      this.bounds.maxLocation.sub(this.heightVec3D),// 3
      this.bounds.maxLocation.sub(this.depthVec3D), // 4
      this.bounds.maxLocation                       // 5
    ];

    // left
    const v0 = new Vertex3D(p[1], p[5], p[0]);
    const v1 = new Vertex3D(p[4], p[0], p[5]);
    const left = new QuadFace3D(v0, v1);
    this._faces.push(left);

    // front
    const front = new TriangleFace3D(new Vertex3D(p[3], p[5], p[1]));
    this._faces.push(front);

    // right
    const v2 = new Vertex3D(p[2], p[4], p[3]);
    const v3 = new Vertex3D(p[5], p[3], p[4]);
    const right = new QuadFace3D(v2, v3);
    this._faces.push(right);

    // bottom
    const v4 = new Vertex3D(p[1], p[0], p[3]);
    const v5 = new Vertex3D(p[2], p[3], p[0]);
    const bottom = new QuadFace3D(v4, v5);
    this._faces.push(bottom);

    // back
    const back = new TriangleFace3D(new Vertex3D(p[4], p[2], p[0]));
    this._faces.push(back);
  }
}

export class RampUpNorthGeometry extends Geometry {
  constructor(bounds: BoundingCuboid) {
    super(bounds);

    //   2 ______  3
    //    | \    \
    //    |  \    \
    //    |___\____\
    //   0     1     4

    const p: Array<Point3D> = [
      this.bounds.minLocation,                        // 0 
      this.bounds.minLocation.add(this.depthVec3D),   // 1
      this.bounds.minLocation.add(this.heightVec3D),  // 2
      this.bounds.maxLocation.sub(this.depthVec3D),   // 3
      this.bounds.maxLocation.sub(this.heightVec3D),  // 4
      this.bounds.minLocation.add(this.widthVec3D),   // 5
    ];

    // left
    const left = new TriangleFace3D(new Vertex3D(p[0], p[1], p[2]));
    this._faces.push(left);

    // front
    const v0 = new Vertex3D(p[1], p[4], p[2]);
    const v1 = new Vertex3D(p[3], p[2], p[4]);
    const front = new QuadFace3D(v0, v1);
    this._faces.push(front);

    // right
    const right = new TriangleFace3D(new Vertex3D(p[5], p[3], p[4]));
    this._faces.push(right);

    // back 
    const v2 = new Vertex3D(p[0], p[2], p[5]);
    const v3 = new Vertex3D(p[3], p[5], p[2]);
    const back = new QuadFace3D(v2, v3);
    this._faces.push(back);

    // bottom
    const v4 = new Vertex3D(p[1], p[4], p[0]);
    const v5 = new Vertex3D(p[5], p[0], p[4]);
    const bottom = new QuadFace3D(v4, v5);
    this._faces.push(bottom);
  }
}

export class RampUpSouthGeometry extends Geometry {
  constructor(bounds: BoundingCuboid) {
    super(bounds);

    //   2 ______  3
    //    /|     |
    //   / |     |
    //  /__|_____|
    // 0   1     4

    const p: Array<Point3D> = [
      this.bounds.minLocation,                        // 0 
      this.bounds.minLocation.add(this.depthVec3D),   // 1
      this.bounds.maxLocation.sub(this.widthVec3D),   // 2
      this.bounds.maxLocation,                        // 3
      this.bounds.maxLocation.sub(this.heightVec3D),  // 4
      this.bounds.minLocation.add(this.widthVec3D),   // 5
    ];

    // left
    const left = new TriangleFace3D(new Vertex3D(p[0], p[1], p[2]));
    this._faces.push(left);

    // front
    const v0 = new Vertex3D(p[1], p[4], p[2]);
    const v1 = new Vertex3D(p[3], p[2], p[4]);
    const front = new QuadFace3D(v0, v1);
    this._faces.push(front);

    // right
    const right = new TriangleFace3D(new Vertex3D(p[5], p[3], p[4]));
    this._faces.push(right);

    // back 
    const v2 = new Vertex3D(p[0], p[2], p[5]);
    const v3 = new Vertex3D(p[3], p[5], p[2]);
    const back = new QuadFace3D(v2, v3);
    this._faces.push(back);

    // bottom
    const v4 = new Vertex3D(p[1], p[4], p[0]);
    const v5 = new Vertex3D(p[5], p[0], p[4]);
    const bottom = new QuadFace3D(v4, v5);
    this._faces.push(bottom);
  }
}
