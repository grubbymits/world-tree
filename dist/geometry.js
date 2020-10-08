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
    subtract(other) {
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
class Vertex3D {
    constructor(_point, v1, v2) {
        this._point = _point;
        this._u = v1.subtract(_point);
        this._v = v2.subtract(_point);
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
        let u = end.subtract(begin);
        let D = this.normal.dot(u);
        if (Math.abs(D) < 0.01) {
            return false;
        }
        let w = begin.subtract(this.point);
        let N = -this.normal.dot(w);
        let intersection = N / D;
        return intersection >= 0 && intersection <= 1;
    }
}
class Face3D {
    constructor(_vertex) {
        this._vertex = _vertex;
        this._points = new Array();
    }
    get vertex() { return this._vertex; }
    get points() { return this._points; }
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
        this._points.push(this.vertex.point);
        this._points.push(this.vertex.point.add(u));
        this._points.push(this.vertex.point.add(v));
    }
    transform(d) {
        this.vertex.transform(d);
    }
    intersects(end) {
        let w = end.subtract(this.vertex.point);
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
    get points() {
        return this._triangleA.points.concat(this._triangleB.points);
    }
    transform(d) {
        this._triangleA.transform(d);
        this._triangleB.transform(d);
    }
    intersects(end) {
        return this._triangleA.intersects(end) || this._triangleB.intersects(end);
    }
}
export class Geometry {
    constructor(_bounds) {
        this._bounds = _bounds;
        this._faces = new Array();
    }
    get bounds() { return this._bounds; }
    transform(d) {
        for (let face of this._faces) {
            face.transform(d);
        }
    }
    get points() {
        let points = new Array();
        for (let face of this._faces) {
            for (let point of face.points) {
                points.push(point);
            }
        }
        return points;
    }
    obstructs(begin, end) {
        for (let face of this._faces) {
            if (face.intersectsPlane(begin, end) && face.intersects(end)) {
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
        let p0 = this.bounds.minLocation;
        let wide = p0.x + this.bounds.width;
        let deep = p0.y + this.bounds.depth;
        let high = p0.z + this.bounds.height;
        let p1 = new Point3D(p0.x, deep, p0.z);
        let p2 = new Point3D(p0.x, deep, high);
        let p3 = new Point3D(p0.x, p0.y, high);
        let p4 = new Point3D(wide, p0.y, p0.z);
        let p5 = new Point3D(wide, deep, p0.z);
        let p6 = new Point3D(wide, p0.y, high);
        let p7 = new Point3D(wide, deep, high);
        let v0 = new Vertex3D(p0, p1, p2);
        let v1 = new Vertex3D(p2, p0, p3);
        this._faces.push(new QuadFace3D(v0, v1));
        let v2 = new Vertex3D(p3, p6, p7);
        let v3 = new Vertex3D(p7, p2, p3);
        this._faces.push(new QuadFace3D(v2, v3));
        let v4 = new Vertex3D(p1, p5, p7);
        let v5 = new Vertex3D(p7, p1, p2);
        this._faces.push(new QuadFace3D(v4, v5));
        let v6 = new Vertex3D(p4, p5, p7);
        let v7 = new Vertex3D(p7, p4, p6);
        this._faces.push(new QuadFace3D(v6, v7));
        let v8 = new Vertex3D(p0, p4, p6);
        let v9 = new Vertex3D(p6, p3, p4);
        this._faces.push(new QuadFace3D(v8, v9));
        let v10 = new Vertex3D(p0, p5, p1);
        let v11 = new Vertex3D(p5, p4, p0);
        this._faces.push(new QuadFace3D(v10, v11));
    }
}
