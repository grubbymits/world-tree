import { BoundingCuboid } from "./physics.js"

enum Orientation {
  Colinear,
  Clockwise,
  CounterClockwise,
}

export class Point2D {
  constructor(private readonly _x: number,
              private readonly _y: number) { }
  get x() { return this._x; }
  get y() { return this._y; }
  add(other: Point2D): Point2D {
    return new Point2D(this.x + other.x, this.y + other.y);
  }
  sub(other: Point2D): Point2D {
    return new Point2D(this.x - other.x, this.y - other.y);
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
           p.y >= Math.max(this.p0.y, this.p1.y);
  }

  intersects(other: Segment2D): boolean {
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
  constructor(private _x: number,
              private _y: number,
              private _z: number) { }

  get x(): number { return this._x; }
  get y(): number { return this._y; }
  get z(): number { return this._z; }
  set x(x: number) { this._x = x; }
  set y(y: number) { this._y = y; }
  set z(z: number) { this._z = z; }

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

  vec(other: Point3D): Vector3D {
    return new Vector3D(this.x - other.x,
                        this.y - other.y,
                        this.z - other.z);
  }

  isNearlySameAs(other: Point3D): boolean {
    return Math.floor(this.x) == Math.floor(other.x) &&
           Math.floor(this.y) == Math.floor(other.y) &&
           Math.floor(this.z) == Math.floor(other.z);
  }

  isSameAs(other: Point3D): boolean {
    return this.x === other.x && this.y === other.y && this.z === other.z;
  }
}

export class Vector3D {
  constructor(private readonly _x: number,
              private readonly _y: number,
              private readonly _z: number) { }

  get x(): number { return this._x; }
  get y(): number { return this._y; }
  get z(): number { return this._z; }
  get zero(): boolean {
    return this.x === 0 && this.y === 0 && this.z === 0;
  }

  add(other: Vector3D): Vector3D {
    const x = this.x + other.x;
    const y = this.y + other.y;
    const z = this.z + other.z;
    return new Vector3D(x, y, z);
  }

  dot(other: Vector3D): number {
    const x = this.x * other.x;
    const y = this.y * other.y;
    const z = this.z * other.z;
    return x + y + z;
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

  absMin(other: Vector3D): Vector3D {
    const x = Math.abs(this.x) < Math.abs(other.x) ? this.x : other.x;
    const y = Math.abs(this.y) < Math.abs(other.y) ? this.y : other.y;
    const z = Math.abs(this.z) < Math.abs(other.z) ? this.z : other.z;
    return new Vector3D(x, y, z);
  }
}

export class Vertex3D {
  private readonly _normal: Vector3D;
  private readonly _v: Vector3D;
  private readonly _u: Vector3D;

  constructor(private _point: Point3D,
              v1: Point3D,
              v2: Point3D) {
    this._u = v1.vec(_point);
    this._v = v2.vec(_point);
    this._normal = this.u.cross(this.v);
  }
  get point(): Point3D { return this._point; }
  get normal(): Vector3D { return this._normal; }
  get u(): Vector3D { return this._u; }
  get v(): Vector3D { return this._v; }

  transform(d: Vector3D): void {
    this._point = this.point.add(d);
  }

  // http://www.geomalgorithms.com/a04-_planes.html#Distance-Point-to-Plane
  distance(p: Point3D): number {
    const sn: number = -this.normal.dot(p.vec(this.point));
    const sd: number = this.normal.dot(this.normal);
    const sb: number = sn / sd;
    const closest: Point3D = p.addScalar(sb).mul(this.normal);
    const d: number = p.vec(closest).norm();
    return d;
  }

  // https://www.geomalgorithms.com/a05-_intersect-1.html 
  intersects(begin: Point3D, end: Point3D): boolean {
    // Use the vertex to represent a plane and calculate whether the segment
    // (begin, end) intersects that plane.
    const u: Vector3D = end.vec(begin);
    const D: number = this.normal.dot(u);
    // Check whether the line is (almost) parallel to the plane.
    if (Math.abs(D) < 0.01) {
      return false;
    }
    const w: Vector3D = begin.vec(this.point);
    const N: number = -this.normal.dot(w);
    const intersection = N / D;
    return intersection >= 0 && intersection <= 1;
  }
}

export abstract class Face3D {
  constructor(protected readonly _vertex: Vertex3D) { }
  get vertex(): Vertex3D { return this._vertex; }
  get plane(): Vertex3D { return this._vertex; }
  intersectsPlane(begin: Point3D, end: Point3D): boolean {
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
  intersects(end: Point3D): boolean {
    // Given that a segment intersects the plane of this face, calculate
    // whether the intersection point is within the triangle.
    let w = end.vec(this.vertex.point);
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
class QuadFace3D extends Face3D {
  private readonly _triangleA: TriangleFace3D;
  private readonly _triangleB: TriangleFace3D;

  constructor(vertexA: Vertex3D,
              vertexB: Vertex3D) {
    super(vertexA);
    this._triangleA = new TriangleFace3D(vertexA);
    this._triangleB = new TriangleFace3D(vertexB);
  }

  vertices(): Array<Vertex3D> { return [ this._triangleA.vertex,
                                         this._triangleB.vertex ]; }

  transform(d: Vector3D): void {
    this._triangleA.transform(d);
    this._triangleB.transform(d);
  }

  intersects(end: Point3D): boolean {
    return this._triangleA.intersects(end) || this._triangleB.intersects(end);
  }
}

export class IntersectInfo {
  constructor(private readonly _face: Face3D,
              private readonly _begin: Point3D,
              private readonly _end: Point3D) { }
  get face(): Face3D { return this._face; }
  get begin(): Point3D { return this._begin; }
  get end(): Point3D { return this._end; }
}

export class Geometry {
  protected _faces: Array<Face3D> = new Array<Face3D>();
  protected _intersectInfo: IntersectInfo | null;

  constructor(protected _bounds: BoundingCuboid) { }

  get bounds(): BoundingCuboid { return this._bounds; }
  get intersectInfo(): IntersectInfo | null { return this._intersectInfo; }

  transform(d: Vector3D): void {
    for (let face of this._faces) {
      face.transform(d);
    }
  }

  obstructs(begin: Point3D, end: Point3D): boolean {
    for (let face of this._faces) {
      if (face.intersectsPlane(begin, end) && face.intersects(end)) {
        this._intersectInfo = new IntersectInfo(face, begin, end);
        return true;
      }
    }
    return false;
  }
}

export class NoGeometry extends Geometry {
  constructor(bounds: BoundingCuboid) {
    super(bounds);
  }
  obstructs(begin: Point3D, end: Point3D): boolean { return false; }
}

export class CuboidGeometry extends Geometry {
  constructor(bounds: BoundingCuboid) {
    super(bounds);
    const widthVec3D = new Vector3D(bounds.width, 0, 0);
    const depthVec3D = new Vector3D(0, bounds.depth, 0);
    const heightVec3D = new Vector3D(0, 0, bounds.height);

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
      this.bounds.minLocation,                    // 0 
      this.bounds.minLocation.add(heightVec3D),   // 1
      this.bounds.minLocation.add(depthVec3D),    // 2
      this.bounds.minLocation.add(widthVec3D),    // 3
      this.bounds.maxLocation.sub(heightVec3D),   // 4
      this.bounds.maxLocation.sub(depthVec3D),    // 5
      this.bounds.maxLocation.sub(widthVec3D),    // 6
      this.bounds.maxLocation                     // 7
    ];

    // left
    let v0 = new Vertex3D(p[0], p[1], p[6]);
    let v1 = new Vertex3D(p[6], p[0], p[2]);
    this._faces.push(new QuadFace3D(v0, v1));

    // front
    let v2 = new Vertex3D(p[2], p[6], p[7]);
    let v3 = new Vertex3D(p[7], p[4], p[2]);
    this._faces.push(new QuadFace3D(v2, v3));

    // right
    let v4 = new Vertex3D(p[3], p[5], p[7]);
    let v5 = new Vertex3D(p[7], p[4], p[3]);
    this._faces.push(new QuadFace3D(v4, v5));

    // top
    let v6 = new Vertex3D(p[1], p[5], p[7]);
    let v7 = new Vertex3D(p[7], p[1], p[6]);
    this._faces.push(new QuadFace3D(v6, v7));

    // bottom
    let v8 = new Vertex3D(p[0], p[3], p[4]);
    let v9 = new Vertex3D(p[4], p[2], p[0]);
    this._faces.push(new QuadFace3D(v8, v9));

    // back
    let v10 = new Vertex3D(p[0], p[1], p[5]);
    let v11 = new Vertex3D(p[5], p[3], p[0]);
    this._faces.push(new QuadFace3D(v10, v11));
  }
}

export class RampGeometry extends Geometry {
  constructor(bounds: BoundingCuboid) {
    const widthVec3D = new Vector3D(bounds.width, 0, 0);
    const depthVec3D = new Vector3D(0, bounds.depth, 0);
    const heightVec3D = new Vector3D(0, 0, bounds.height);

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
      this.bounds.minLocation,                    // 0 
      this.bounds.minLocation.add(depthVec3D),    // 1
      this.bounds.minLocation.add(widthVec3D),    // 2
      this.bounds.maxLocation.sub(heightVec3D),   // 3
      this.bounds.maxLocation.sub(depthVec3D),    // 4
      this.bounds.maxLocation                     // 5
    ];

    // left
    const v0 = new Vertex3D(p[0], p[1], p[5]);
    const v1 = new Vertex3D(p[5], p[4], p[0]);
    this._faces.push(new QuadFace3D(v0, v1));
    // front
    this._faces.push(new TrianlgeFace3D(new Vertex3D(p[1], p[5], p[3])));
    // right
    const v2 = new Vertex3D(p[2], p[3], p[5]);
    const v3 = new Vertex3D(p[5], p[4], p[2]);
    this._faces.push(new QuadFace3D(v2, v3));
    // bottom
    const v4 = new Vertex3D(p[0], p[2], p[3]);
    const v5 = new Vertex3D(p[3], p[1], p[0]);
    this._faces.push(new QuadFace3D(v4, v5));
    // back
    this._faces.push(new TriangleFace3D(new Vertex3D(p[0], p[2], p[4])));
  }
}
