class Point3D {
  constructor(private _x: number,
              private _y: number,
              private _z: number) { }

  get x(): number { return this._x; }
  get y(): number { return this._y; }
  get z(): number { return this._z; }
  set x(x: number) { this._x = x; }
  set y(y: number) { this._y = y; }
  set z(z: number) { this._z = z; }

  subtract(other: Location): Vector3D {
    return new Vector3D(this.x - other.x,
                        this.y - other.y,
                        this.z - other.z);
  }
}

class Vector3D {
  constructor(private readonly _x: number,
              private readonly _y: number,
              private readonly _z: number) { }

  get x(): number { return this._x; }
  get y(): number { return this._y; }
  get z(): number { return this._z; }
  get zero(): boolean {
    return this.x === 0 && this.y === 0 && this.z === 0;
  }

  dot(other: Vector3D): number {
    let x = this.x * other.x;
    let y = this.y * other.y;
    let z = this.z * other.z;
    return x + y + z;
  }

  cross(other: Vector3D): Vector3D {
    let x = this.y * other.z - this.z * other.y;
    let y = this.z * other.x - this.x * other.z;
    let z = this.x * other.y - this.y * other.x;
    return new Vector3D(x, y, z);
  }
}

class Vertex3D {
  private readonly _normal: Vector3D;
  private readonly _v: Vector3D;
  private readonly _u: Vector3D;

  constructor(private readonly _point: Location,
              v1: Location,
              v2: Location) {
    this._u = = v1.subtract(_point);
    this._v = v2.subtract(_point);
    this._normal = this.u.cross(this.v);
  }
  get point(): Point3D { return this._point; }
  get normal(): Vector3D { return this._normal; }
  get u(): Vector3D { return this._u; }
  get v(): Vector3D { return this._v; }

  // https://www.geomalgorithms.com/a05-_intersect-1.html 
  intersects(begin: Point3D, end: Point3D): boolean {
    // Use the vertex to represent a plane and calculate whether the segment
    // (begin, end) intersects that plane.
    let u = end.subtract(begin);
    let D = this.normal.dot(u);
    if (Math.abs(D) < 0.01) {
      return false;
    }
    let w = begin.subtract(this.point);
    let N = -this.normal.dot(w);
    let intersection = N / D;
    if (intersection < 0 || intersection > 1) {
      return false;
    }
  }
}

class TriangleFace3D {
  constructor(private readonly _vertex: Vertex3D) { }
  get vertex(): Vertex3D { return this._vertex; }

  // https://www.geomalgorithms.com/a06-_intersect-2.html 
  intersects(end: Point3D): boolean {
    // Given that a segment intersects the plane of this face, calculate
    // whether the intersection point is within the triangle.
    let w = end.subtract(this.vertex.point);
    let u = this.vertex.u;
    let v = this.vertex.v;
    let uDotv = u.dot(v);
    let uDotu = u.dot(u);
    let wDotv = w.dot(v);
    let vDotv = v.dot(v);
    let wDotu = w.dot(u);
    let dominator = (Math.pow(uDotv, 2) - uDotu * vDotv);
    let s1 = (uDotv * wDotV - vDotv * wDotu) / dominator;
    let t1 = (uDotv * wDotU - uDotU * wDotv) / dominator;
    return s1 >= 0 && s1 >= 0 && s1 + t1 <= 1;
  }
}

// Two vertices, which can be connected to create a diagonal edge across a
// quad-edge polygon (two triangles). Both vertices are on the same plane.
class QuadFace3D {
  private readonly triangleA: TriangleFace3D;
  private readonly triangleB: TriangleFace3D;

  constructor(vertexA: Vertex3D,
              vertexB: Vertex3D) {
    this.triangleA = new TriangleFace(vertexA);
    this.triangleB = new TriangleFace(vertexB);
  }
  get plane(): Vertex3D { return this.triangleA; }

  intersects(begin: Point3D, end: Point3D): boolean {
    // First calculate whether the plane is intersected.
    return this.plane.intersects(begin, end) &&
           triangleA.intersects(end) || triangleB.intersects(end);
  }
}
