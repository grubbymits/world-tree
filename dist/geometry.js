export var Orientation;
(function (Orientation) {
    Orientation[Orientation["Colinear"] = 0] = "Colinear";
    Orientation[Orientation["Clockwise"] = 1] = "Clockwise";
    Orientation[Orientation["CounterClockwise"] = 2] = "CounterClockwise";
})(Orientation || (Orientation = {}));
export class Point2D {
    constructor(_x, _y) {
        this._x = _x;
        this._y = _y;
    }
    get x() { return this._x; }
    get y() { return this._y; }
    add(other) {
        return new Point2D(this.x + other.x, this.y + other.y);
    }
    sub(other) {
        return new Point2D(this.x - other.x, this.y - other.y);
    }
    static orientation(p, q, r) {
        const res = (q.y - p.y) * (r.x - q.x) -
            (q.x - p.x) * (r.y - q.y);
        if (res == 0) {
            return Orientation.Colinear;
        }
        return res > 0 ? Orientation.Clockwise : Orientation.CounterClockwise;
    }
}
export class Segment2D {
    constructor(_p0, _p1) {
        this._p0 = _p0;
        this._p1 = _p1;
    }
    get p0() { return this._p0; }
    get p1() { return this._p1; }
    contains(p) {
        return p.x <= Math.max(this.p0.x, this.p1.x) &&
            p.x >= Math.min(this.p0.x, this.p1.x) &&
            p.y <= Math.max(this.p0.y, this.p1.y) &&
            p.y >= Math.max(this.p0.y, this.p1.y);
    }
    intersects(other) {
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
    distance(p) {
        const vl = this.p0.x * this.p1.y - this.p1.x * this.p0.y;
        const w = this.p0.x * p.y - p.x * this.p0.y;
        const u = 1 / Math.sqrt(Math.pow(this.p1.x - this.p0.x, 2) +
            Math.pow(this.p1.y - this.p0.y, 2));
        return vl * w * u;
    }
}
export class Point3D {
    constructor(_x, _y, _z) {
        this._x = _x;
        this._y = _y;
        this._z = _z;
    }
    get x() { return this._x; }
    get y() { return this._y; }
    get z() { return this._z; }
    set x(x) { this._x = x; }
    set y(y) { this._y = y; }
    set z(z) { this._z = z; }
    add(vector) {
        return new Point3D(this.x + vector.x, this.y + vector.y, this.z + vector.z);
    }
    sub(vector) {
        return new Point3D(this.x - vector.x, this.y - vector.y, this.z - vector.z);
    }
    vec(other) {
        return new Vector3D(this.x - other.x, this.y - other.y, this.z - other.z);
    }
    isNearlySameAs(other) {
        return Math.floor(this.x) == Math.floor(other.x) &&
            Math.floor(this.y) == Math.floor(other.y) &&
            Math.floor(this.z) == Math.floor(other.z);
    }
    isSameAs(other) {
        return this.x === other.x && this.y === other.y && this.z === other.z;
    }
}
export class Vector3D {
    constructor(_x, _y, _z) {
        this._x = _x;
        this._y = _y;
        this._z = _z;
    }
    get x() { return this._x; }
    get y() { return this._y; }
    get z() { return this._z; }
    get zero() {
        return this.x === 0 && this.y === 0 && this.z === 0;
    }
    dot(other) {
        let x = this.x * other.x;
        let y = this.y * other.y;
        let z = this.z * other.z;
        return x + y + z;
    }
    cross(other) {
        let x = this.y * other.z - this.z * other.y;
        let y = this.z * other.x - this.x * other.z;
        let z = this.x * other.y - this.y * other.x;
        return new Vector3D(x, y, z);
    }
    absMin(other) {
        let x = Math.abs(this.x) < Math.abs(other.x) ? this.x : other.x;
        let y = Math.abs(this.y) < Math.abs(other.y) ? this.y : other.y;
        let z = Math.abs(this.z) < Math.abs(other.z) ? this.z : other.z;
        return new Vector3D(x, y, z);
    }
}
export class Vertex3D {
    constructor(_point, v1, v2) {
        this._point = _point;
        this._u = v1.vec(_point);
        this._v = v2.vec(_point);
        this._normal = this.u.cross(this.v);
    }
    get point() { return this._point; }
    get normal() { return this._normal; }
    get u() { return this._u; }
    get v() { return this._v; }
    transform(d) {
        this._point = this.point.add(d);
    }
    intersects(begin, end) {
        const u = end.vec(begin);
        const D = this.normal.dot(u);
        if (Math.abs(D) < 0.01) {
            return false;
        }
        const w = begin.vec(this.point);
        const N = -this.normal.dot(w);
        const intersection = N / D;
        return intersection >= 0 && intersection <= 1;
    }
}
export class Face3D {
    constructor(_vertex) {
        this._vertex = _vertex;
    }
    get vertex() { return this._vertex; }
    get plane() { return this._vertex; }
    intersectsPlane(begin, end) {
        return this.plane.intersects(begin, end);
    }
}
class TriangleFace3D extends Face3D {
    constructor(vertex) {
        super(vertex);
        let u = this.vertex.u;
        let v = this.vertex.v;
        this._uDotv = u.dot(v);
        this._uDotu = u.dot(u);
        this._vDotv = v.dot(v);
        this._denominator = 1 / (Math.pow(this._uDotv, 2) - this._uDotu * this._vDotv);
    }
    vertices() { return [this.vertex]; }
    transform(d) {
        this.vertex.transform(d);
    }
    intersects(end) {
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
class QuadFace3D extends Face3D {
    constructor(vertexA, vertexB) {
        super(vertexA);
        this._triangleA = new TriangleFace3D(vertexA);
        this._triangleB = new TriangleFace3D(vertexB);
    }
    vertices() {
        return [this._triangleA.vertex,
            this._triangleB.vertex];
    }
    transform(d) {
        this._triangleA.transform(d);
        this._triangleB.transform(d);
    }
    intersects(end) {
        return this._triangleA.intersects(end) || this._triangleB.intersects(end);
    }
}
export class IntersectInfo {
    constructor(_face, _begin, _end) {
        this._face = _face;
        this._begin = _begin;
        this._end = _end;
    }
    get face() { return this._face; }
    get begin() { return this._begin; }
    get end() { return this._end; }
}
export class Geometry {
    constructor(_bounds) {
        this._bounds = _bounds;
        this._faces = new Array();
    }
    get bounds() { return this._bounds; }
    get intersectInfo() { return this._intersectInfo; }
    transform(d) {
        for (let face of this._faces) {
            face.transform(d);
        }
    }
    obstructs(begin, end) {
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
    constructor(bounds) {
        super(bounds);
    }
    obstructs(begin, end) { return false; }
}
export class CuboidGeometry extends Geometry {
    constructor(bounds) {
        super(bounds);
        const widthVec3D = new Vector3D(bounds.width, 0, 0);
        const depthVec3D = new Vector3D(0, bounds.depth, 0);
        const heightVec3D = new Vector3D(0, 0, bounds.height);
        const p = [
            this.bounds.minLocation,
            this.bounds.minLocation.add(heightVec3D),
            this.bounds.minLocation.add(depthVec3D),
            this.bounds.minLocation.add(widthVec3D),
            this.bounds.maxLocation.sub(heightVec3D),
            this.bounds.maxLocation.sub(depthVec3D),
            this.bounds.maxLocation.sub(widthVec3D),
            this.bounds.maxLocation
        ];
        let v0 = new Vertex3D(p[0], p[1], p[6]);
        let v1 = new Vertex3D(p[6], p[0], p[2]);
        this._faces.push(new QuadFace3D(v0, v1));
        let v2 = new Vertex3D(p[2], p[6], p[7]);
        let v3 = new Vertex3D(p[7], p[4], p[2]);
        this._faces.push(new QuadFace3D(v2, v3));
        let v4 = new Vertex3D(p[3], p[5], p[7]);
        let v5 = new Vertex3D(p[7], p[4], p[3]);
        this._faces.push(new QuadFace3D(v4, v5));
        let v6 = new Vertex3D(p[1], p[5], p[7]);
        let v7 = new Vertex3D(p[7], p[6], p[5]);
        this._faces.push(new QuadFace3D(v6, v7));
        let v8 = new Vertex3D(p[0], p[3], p[4]);
        let v9 = new Vertex3D(p[4], p[2], p[0]);
        this._faces.push(new QuadFace3D(v8, v9));
        let v10 = new Vertex3D(p[0], p[1], p[5]);
        let v11 = new Vertex3D(p[5], p[3], p[0]);
        this._faces.push(new QuadFace3D(v10, v11));
    }
}
