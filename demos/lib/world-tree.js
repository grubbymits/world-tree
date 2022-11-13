// deno-fmt-ignore-file
// deno-lint-ignore-file
// This code was bundled using `deno bundle` and it's not recommended to edit it manually

var Orientation;
(function(Orientation) {
    Orientation[Orientation["Colinear"] = 0] = "Colinear";
    Orientation[Orientation["Clockwise"] = 1] = "Clockwise";
    Orientation[Orientation["CounterClockwise"] = 2] = "CounterClockwise";
})(Orientation || (Orientation = {}));
class Vector2D {
    constructor(_x, _y){
        this._x = _x;
        this._y = _y;
        Object.freeze(this);
    }
    get x() {
        return this._x;
    }
    get y() {
        return this._y;
    }
    dot(other) {
        const x = this.x * other.x;
        const y = this.y * other.y;
        return x + y;
    }
    mag() {
        return this.dot(this);
    }
    angle(other) {
        let x = this.x * other.y - other.x * this.y;
        let y = this.dot(other);
        return Math.atan2(x, y);
    }
    _x;
    _y;
}
class Point2D {
    constructor(_x, _y){
        this._x = _x;
        this._y = _y;
        Object.freeze(this);
    }
    get x() {
        return this._x;
    }
    get y() {
        return this._y;
    }
    add(vec) {
        return new Point2D(this.x + vec.x, this.y + vec.y);
    }
    sub(vec) {
        return new Point2D(this.x - vec.x, this.y - vec.y);
    }
    diff(other) {
        return new Vector2D(this.x - other.x, this.y - other.y);
    }
    static orientation(p, q, r) {
        const res = (q.y - p.y) * (r.x - q.x) - (q.x - p.x) * (r.y - q.y);
        if (res == 0) {
            return Orientation.Colinear;
        }
        return res > 0 ? Orientation.Clockwise : Orientation.CounterClockwise;
    }
    _x;
    _y;
}
class Segment2D {
    constructor(_p0, _p1){
        this._p0 = _p0;
        this._p1 = _p1;
    }
    get p0() {
        return this._p0;
    }
    get p1() {
        return this._p1;
    }
    contains(p) {
        return p.x <= Math.max(this.p0.x, this.p1.x) && p.x >= Math.min(this.p0.x, this.p1.x) && p.y <= Math.max(this.p0.y, this.p1.y) && p.y >= Math.min(this.p0.y, this.p1.y);
    }
    add(diff) {
        let p0 = this.p0.add(diff);
        let p1 = this.p1.add(diff);
        return new Segment2D(p0, p1);
    }
    on(p) {
        const dxc = p.x - this.p0.x;
        const dyc = p.y - this.p0.y;
        const dxl = this.p1.x - this.p0.x;
        const dyl = this.p1.y - this.p0.y;
        return dxc * dyl - dyc * dxl == 0;
    }
    intersects(other) {
        if (this.on(other.p0)) {
            return false;
        }
        if (this.on(other.p1)) {
            return false;
        }
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
        const u = 1 / Math.sqrt(Math.pow(this.p1.x - this.p0.x, 2) + Math.pow(this.p1.y - this.p0.y, 2));
        return vl * w * u;
    }
    _p0;
    _p1;
}
class Point3D {
    constructor(_x, _y, _z){
        this._x = _x;
        this._y = _y;
        this._z = _z;
        Object.freeze(this);
    }
    get x() {
        return this._x;
    }
    get y() {
        return this._y;
    }
    get z() {
        return this._z;
    }
    add(vector) {
        return new Point3D(this.x + vector.x, this.y + vector.y, this.z + vector.z);
    }
    mul(v) {
        return new Point3D(this.x * v.x, this.y * v.y, this.z * v.z);
    }
    addScalar(v) {
        return new Point3D(this.x + v, this.y + v, this.z + v);
    }
    sub(vector) {
        return new Point3D(this.x - vector.x, this.y - vector.y, this.z - vector.z);
    }
    vec_diff(other) {
        return new Vector3D(this.x - other.x, this.y - other.y, this.z - other.z);
    }
    isSameAsRounded(other) {
        return Math.round(this.x) == Math.round(other.x) && Math.round(this.y) == Math.round(other.y) && Math.round(this.z) == Math.round(other.z);
    }
    isSameAs(other) {
        return this.x === other.x && this.y === other.y && this.z === other.z;
    }
    _x;
    _y;
    _z;
}
class Vector3D {
    constructor(_x, _y, _z){
        this._x = _x;
        this._y = _y;
        this._z = _z;
        Object.freeze(this);
    }
    get x() {
        return this._x;
    }
    get y() {
        return this._y;
    }
    get z() {
        return this._z;
    }
    get zero() {
        return this.x === 0 && this.y === 0 && this.z === 0;
    }
    get asString() {
        return "(x, y, z) = (" + this.x + ", " + this.y + ", " + this.z + ")";
    }
    add(other) {
        const x = this.x + other.x;
        const y = this.y + other.y;
        const z = this.z + other.z;
        return new Vector3D(x, y, z);
    }
    mulScalar(factor) {
        const x = this.x * factor;
        const y = this.y * factor;
        const z = this.z * factor;
        return new Vector3D(x, y, z);
    }
    dot(other) {
        const x = this.x * other.x;
        const y = this.y * other.y;
        const z = this.z * other.z;
        return x + y + z;
    }
    mag() {
        return this.dot(this);
    }
    cross(other) {
        const x = this.y * other.z - this.z * other.y;
        const y = this.z * other.x - this.x * other.z;
        const z = this.x * other.y - this.y * other.x;
        return new Vector3D(x, y, z);
    }
    norm() {
        return Math.sqrt(this.dot(this));
    }
    angle(other) {
        let x = this.cross(other).mag();
        let y = this.dot(other);
        return Math.atan2(x, y);
    }
    absMin(other) {
        const x = Math.abs(this.x) < Math.abs(other.x) ? this.x : other.x;
        const y = Math.abs(this.y) < Math.abs(other.y) ? this.y : other.y;
        const z = Math.abs(this.z) < Math.abs(other.z) ? this.z : other.z;
        return new Vector3D(x, y, z);
    }
    equal(other) {
        return this.x == other.x && this.y == other.y && this.z == other.z;
    }
    _x;
    _y;
    _z;
}
class Vertex3D {
    _normal;
    _v;
    _u;
    constructor(_point, a, b){
        this._point = _point;
        this._u = a.vec_diff(_point);
        this._v = b.vec_diff(_point);
        this._normal = this.u.cross(this.v);
    }
    get point() {
        return this._point;
    }
    get normal() {
        return this._normal;
    }
    get u() {
        return this._u;
    }
    get v() {
        return this._v;
    }
    transform(d) {
        this._point = this.point.add(d);
    }
    get asString() {
        return "normal = " + this.normal.asString + ", u = " + this.u.asString + ", v = " + this.u.asString;
    }
    distance(p) {
        const sn = -this.normal.dot(p.vec_diff(this.point));
        const sd = this.normal.dot(this.normal);
        const sb = sn / sd;
        const closest = p.addScalar(sb).mul(this.normal);
        const d = p.vec_diff(closest).norm();
        return d;
    }
    intersects(begin, end) {
        const dir = end.vec_diff(begin);
        const w0 = begin.vec_diff(this.point);
        const a = -this.normal.dot(w0);
        const b = this.normal.dot(dir);
        if (Math.abs(b) < 0.01) {
            return null;
        }
        const r = a / b;
        if (r < 0 || r > 1) {
            return null;
        }
        return begin.add(dir.mulScalar(r));
    }
    _point;
}
class Face3D {
    constructor(_vertex){
        this._vertex = _vertex;
    }
    get vertex() {
        return this._vertex;
    }
    get plane() {
        return this._vertex;
    }
    intersectsPlane(begin, end) {
        return this.plane.intersects(begin, end);
    }
    _vertex;
}
class TriangleFace3D extends Face3D {
    _uDotv;
    _uDotu;
    _vDotv;
    _denominator;
    constructor(vertex){
        super(vertex);
        let u = this.vertex.u;
        let v = this.vertex.v;
        this._uDotv = u.dot(v);
        this._uDotu = u.dot(u);
        this._vDotv = v.dot(v);
        this._denominator = 1 / (Math.pow(this._uDotv, 2) - this._uDotu * this._vDotv);
    }
    vertices() {
        return [
            this.vertex
        ];
    }
    transform(d) {
        this.vertex.transform(d);
    }
    intersects(i) {
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
class QuadFace3D extends Face3D {
    _triangleA;
    _triangleB;
    constructor(vertexA, vertexB){
        super(vertexA);
        if (!vertexA.normal.equal(vertexB.normal)) {
            throw "Expected QuadFace3D vertices to have equilavent normals";
        }
        this._triangleA = new TriangleFace3D(vertexA);
        this._triangleB = new TriangleFace3D(vertexB);
    }
    vertices() {
        return [
            this._triangleA.vertex,
            this._triangleB.vertex
        ];
    }
    transform(d) {
        this._triangleA.transform(d);
        this._triangleB.transform(d);
    }
    intersects(i) {
        return this._triangleA.intersects(i) || this._triangleB.intersects(i);
    }
}
class IntersectInfo {
    constructor(_face, _begin, _end, _i, _theta){
        this._face = _face;
        this._begin = _begin;
        this._end = _end;
        this._i = _i;
        this._theta = _theta;
    }
    get face() {
        return this._face;
    }
    get begin() {
        return this._begin;
    }
    get end() {
        return this._end;
    }
    get i() {
        return this._i;
    }
    get theta() {
        return this._theta;
    }
    _face;
    _begin;
    _end;
    _i;
    _theta;
}
class Geometry {
    _faces;
    _intersectInfo;
    _widthVec3D;
    _depthVec3D;
    _heightVec3D;
    _name;
    constructor(_bounds){
        this._bounds = _bounds;
        this._faces = new Array();
        this._widthVec3D = new Vector3D(_bounds.width, 0, 0);
        this._depthVec3D = new Vector3D(0, _bounds.depth, 0);
        this._heightVec3D = new Vector3D(0, 0, _bounds.height);
    }
    get bounds() {
        return this._bounds;
    }
    get widthVec3D() {
        return this._widthVec3D;
    }
    get depthVec3D() {
        return this._depthVec3D;
    }
    get heightVec3D() {
        return this._heightVec3D;
    }
    get intersectInfo() {
        return this._intersectInfo;
    }
    get name() {
        return this._name;
    }
    transform(d) {
        for (let face of this._faces){
            face.transform(d);
        }
    }
    obstructs(begin, end) {
        for (let face of this._faces){
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
    _bounds;
}
class NoGeometry extends Geometry {
    constructor(bounds){
        super(bounds);
        this._name = "NoGeometry";
    }
    obstructs(begin, end) {
        return null;
    }
}
class CuboidGeometry extends Geometry {
    constructor(bounds){
        super(bounds);
        this._name = "CuboidGeometry";
        const p = [
            this.bounds.minLocation,
            this.bounds.minLocation.add(this.heightVec3D),
            this.bounds.minLocation.add(this.depthVec3D),
            this.bounds.minLocation.add(this.widthVec3D),
            this.bounds.maxLocation.sub(this.heightVec3D),
            this.bounds.maxLocation.sub(this.depthVec3D),
            this.bounds.maxLocation.sub(this.widthVec3D),
            this.bounds.maxLocation
        ];
        let v0 = new Vertex3D(p[2], p[6], p[0]);
        let v1 = new Vertex3D(p[1], p[0], p[6]);
        this._faces.push(new QuadFace3D(v0, v1));
        let v2 = new Vertex3D(p[4], p[7], p[2]);
        let v3 = new Vertex3D(p[6], p[2], p[7]);
        this._faces.push(new QuadFace3D(v2, v3));
        let v4 = new Vertex3D(p[3], p[5], p[4]);
        let v5 = new Vertex3D(p[7], p[4], p[5]);
        this._faces.push(new QuadFace3D(v4, v5));
        let v6 = new Vertex3D(p[5], p[1], p[7]);
        let v7 = new Vertex3D(p[6], p[7], p[1]);
        this._faces.push(new QuadFace3D(v6, v7));
        let v8 = new Vertex3D(p[0], p[3], p[2]);
        let v9 = new Vertex3D(p[4], p[2], p[3]);
        this._faces.push(new QuadFace3D(v8, v9));
        let v10 = new Vertex3D(p[0], p[1], p[3]);
        let v11 = new Vertex3D(p[5], p[3], p[1]);
        this._faces.push(new QuadFace3D(v10, v11));
    }
}
class RampUpWestGeometry extends Geometry {
    constructor(bounds){
        super(bounds);
        this._name = "RampUpWestGeometry";
        const p = [
            this.bounds.minLocation,
            this.bounds.minLocation.add(this.depthVec3D),
            this.bounds.minLocation.add(this.widthVec3D),
            this.bounds.maxLocation.sub(this.heightVec3D),
            this.bounds.minLocation.add(this.heightVec3D),
            this.bounds.maxLocation.sub(this.widthVec3D)
        ];
        const v0 = new Vertex3D(p[1], p[5], p[0]);
        const v1 = new Vertex3D(p[4], p[0], p[5]);
        this._faces.push(new QuadFace3D(v0, v1));
        this._faces.push(new TriangleFace3D(new Vertex3D(p[1], p[3], p[5])));
        const v2 = new Vertex3D(p[2], p[4], p[3]);
        const v3 = new Vertex3D(p[5], p[3], p[4]);
        this._faces.push(new QuadFace3D(v2, v3));
        new Vertex3D(p[3], p[1], p[2]);
        new Vertex3D(p[0], p[2], p[1]);
        this._faces.push(new TriangleFace3D(new Vertex3D(p[0], p[4], p[2])));
    }
}
class RampUpEastGeometry extends Geometry {
    constructor(bounds){
        super(bounds);
        this._name = "RampUpEastGeometry";
        const p = [
            this.bounds.minLocation,
            this.bounds.minLocation.add(this.depthVec3D),
            this.bounds.minLocation.add(this.widthVec3D),
            this.bounds.maxLocation.sub(this.heightVec3D),
            this.bounds.maxLocation.sub(this.depthVec3D),
            this.bounds.maxLocation
        ];
        const v0 = new Vertex3D(p[1], p[5], p[0]);
        const v1 = new Vertex3D(p[4], p[0], p[5]);
        const left = new QuadFace3D(v0, v1);
        this._faces.push(left);
        const front = new TriangleFace3D(new Vertex3D(p[3], p[5], p[1]));
        this._faces.push(front);
        const v2 = new Vertex3D(p[2], p[4], p[3]);
        const v3 = new Vertex3D(p[5], p[3], p[4]);
        const right = new QuadFace3D(v2, v3);
        this._faces.push(right);
        const v4 = new Vertex3D(p[1], p[0], p[3]);
        const v5 = new Vertex3D(p[2], p[3], p[0]);
        const bottom = new QuadFace3D(v4, v5);
        this._faces.push(bottom);
        const back = new TriangleFace3D(new Vertex3D(p[4], p[2], p[0]));
        this._faces.push(back);
    }
}
class RampUpNorthGeometry extends Geometry {
    constructor(bounds){
        super(bounds);
        this._name = "RampUpNorthGeometry";
        const p = [
            this.bounds.minLocation,
            this.bounds.minLocation.add(this.depthVec3D),
            this.bounds.minLocation.add(this.heightVec3D),
            this.bounds.maxLocation.sub(this.depthVec3D),
            this.bounds.maxLocation.sub(this.heightVec3D),
            this.bounds.minLocation.add(this.widthVec3D)
        ];
        const left = new TriangleFace3D(new Vertex3D(p[0], p[1], p[2]));
        this._faces.push(left);
        const v0 = new Vertex3D(p[1], p[4], p[2]);
        const v1 = new Vertex3D(p[3], p[2], p[4]);
        const front = new QuadFace3D(v0, v1);
        this._faces.push(front);
        const right = new TriangleFace3D(new Vertex3D(p[5], p[3], p[4]));
        this._faces.push(right);
        const v2 = new Vertex3D(p[0], p[2], p[5]);
        const v3 = new Vertex3D(p[3], p[5], p[2]);
        const back = new QuadFace3D(v2, v3);
        this._faces.push(back);
        const v4 = new Vertex3D(p[1], p[4], p[0]);
        const v5 = new Vertex3D(p[5], p[0], p[4]);
        const bottom = new QuadFace3D(v4, v5);
        this._faces.push(bottom);
    }
}
class RampUpSouthGeometry extends Geometry {
    constructor(bounds){
        super(bounds);
        this._name = "RampUpSouthGeometry";
        const p = [
            this.bounds.minLocation,
            this.bounds.minLocation.add(this.depthVec3D),
            this.bounds.maxLocation.sub(this.widthVec3D),
            this.bounds.maxLocation,
            this.bounds.maxLocation.sub(this.heightVec3D),
            this.bounds.minLocation.add(this.widthVec3D)
        ];
        const left = new TriangleFace3D(new Vertex3D(p[0], p[1], p[2]));
        this._faces.push(left);
        const v0 = new Vertex3D(p[1], p[4], p[2]);
        const v1 = new Vertex3D(p[3], p[2], p[4]);
        const front = new QuadFace3D(v0, v1);
        this._faces.push(front);
        const right = new TriangleFace3D(new Vertex3D(p[5], p[3], p[4]));
        this._faces.push(right);
        const v2 = new Vertex3D(p[0], p[2], p[5]);
        const v3 = new Vertex3D(p[3], p[5], p[2]);
        const back = new QuadFace3D(v2, v3);
        this._faces.push(back);
        const v4 = new Vertex3D(p[1], p[4], p[0]);
        const v5 = new Vertex3D(p[5], p[0], p[4]);
        const bottom = new QuadFace3D(v4, v5);
        this._faces.push(bottom);
    }
}
export { Orientation as Orientation };
export { Vector2D as Vector2D };
export { Point2D as Point2D };
export { Segment2D as Segment2D };
export { Point3D as Point3D };
export { Vector3D as Vector3D };
export { Vertex3D as Vertex3D };
export { Face3D as Face3D };
export { QuadFace3D as QuadFace3D };
export { IntersectInfo as IntersectInfo };
export { Geometry as Geometry };
export { NoGeometry as NoGeometry };
export { CuboidGeometry as CuboidGeometry };
export { RampUpWestGeometry as RampUpWestGeometry };
export { RampUpEastGeometry as RampUpEastGeometry };
export { RampUpNorthGeometry as RampUpNorthGeometry };
export { RampUpSouthGeometry as RampUpSouthGeometry };
var EntityEvent;
(function(EntityEvent) {
    EntityEvent["Moving"] = "moving";
    EntityEvent["EndMove"] = "endMove";
    EntityEvent["FaceDirection"] = "faceDirection";
    EntityEvent["Collision"] = "collision";
    EntityEvent["NoCollision"] = "noCollision";
})(EntityEvent || (EntityEvent = {}));
var InputEvent;
(function(InputEvent) {
    InputEvent["CameraMove"] = "cameraMove";
})(InputEvent || (InputEvent = {}));
class EventHandler {
    _listeners = new Map();
    _events = new Set();
    constructor(){}
    post(event) {
        this._events.add(event);
    }
    service() {
        for (let event of this._events){
            if (!this._listeners.has(event)) {
                continue;
            }
            let callbacks = this._listeners.get(event);
            for (let callback of callbacks){
                callback();
            }
        }
        this._events.clear();
    }
    addEventListener(event, callback) {
        if (!this._listeners.has(event)) {
            this._listeners.set(event, new Array());
        } else {
            let callbacks = this._listeners.get(event);
            for(let i in callbacks){
                if (callbacks[i] === callback) {
                    return;
                }
            }
        }
        this._listeners.get(event).push(callback);
    }
    removeEventListener(event, callback) {
        if (!this._listeners.has(event)) {
            return;
        }
        let callbacks = this._listeners.get(event);
        const index = callbacks.indexOf(callback, 0);
        if (index > -1) {
            callbacks.splice(index, 1);
        }
    }
}
class TimedEventHandler {
    _callbacks = new Array();
    constructor(){}
    add(callback) {
        this._callbacks.push(callback);
    }
    service() {
        for(let i = this._callbacks.length - 1; i >= 0; i--){
            const finished = this._callbacks[i]();
            if (finished) {
                this._callbacks.splice(i, 1);
            }
        }
    }
}
export { EntityEvent as EntityEvent };
export { InputEvent as InputEvent };
export { EventHandler as EventHandler };
export { TimedEventHandler as TimedEventHandler };
class Dimensions {
    constructor(_width, _depth, _height){
        this._width = _width;
        this._depth = _depth;
        this._height = _height;
    }
    get width() {
        return this._width;
    }
    get depth() {
        return this._depth;
    }
    get height() {
        return this._height;
    }
    log() {
        console.log(" - (WxDxH):", this.width, this.depth, this.height);
    }
    _width;
    _depth;
    _height;
}
class BoundingCuboid {
    _minLocation;
    _maxLocation;
    _bottomCentre;
    constructor(_centre, _dimensions){
        this._centre = _centre;
        this._dimensions = _dimensions;
        this.centre = _centre;
    }
    get minLocation() {
        return this._minLocation;
    }
    get minX() {
        return this.minLocation.x;
    }
    get minY() {
        return this.minLocation.y;
    }
    get minZ() {
        return this.minLocation.z;
    }
    get maxLocation() {
        return this._maxLocation;
    }
    get maxX() {
        return this.maxLocation.x;
    }
    get maxY() {
        return this.maxLocation.y;
    }
    get maxZ() {
        return this.maxLocation.z;
    }
    get centre() {
        return this._centre;
    }
    get bottomCentre() {
        return this._bottomCentre;
    }
    get width() {
        return this._dimensions.width;
    }
    get depth() {
        return this._dimensions.depth;
    }
    get height() {
        return this._dimensions.height;
    }
    get dimensions() {
        return this._dimensions;
    }
    set centre(centre) {
        this._centre = centre;
        let width = this.width / 2;
        let depth = this.depth / 2;
        let height = this.height / 2;
        let x = centre.x - width;
        let y = centre.y - depth;
        let z = centre.z - height;
        this._bottomCentre = new Point3D(centre.x, centre.y, z);
        this._minLocation = new Point3D(x, y, z);
        x = centre.x + width;
        y = centre.y + depth;
        z = centre.z + height;
        this._maxLocation = new Point3D(x, y, z);
    }
    update(d) {
        this._centre = this._centre.add(d);
        this._bottomCentre = this._bottomCentre.add(d);
        this._minLocation = this._minLocation.add(d);
        this._maxLocation = this._maxLocation.add(d);
    }
    contains(location) {
        if (location.x < this._minLocation.x || location.y < this._minLocation.y || location.z < this._minLocation.z) return false;
        if (location.x > this._maxLocation.x || location.y > this._maxLocation.y || location.z > this._maxLocation.z) return false;
        return true;
    }
    containsBounds(other) {
        return this.contains(other.minLocation) && this.contains(other.maxLocation);
    }
    intersects(other) {
        if (other.minLocation.x > this.maxLocation.x || other.maxLocation.x < this.minLocation.x) return false;
        if (other.minLocation.y > this.maxLocation.y || other.maxLocation.y < this.minLocation.y) return false;
        if (other.minLocation.z > this.maxLocation.z || other.maxLocation.z < this.minLocation.z) return false;
        return true;
    }
    insert(other) {
        if (this.containsBounds(other)) {
            return;
        }
        let minX = other.minLocation.x < this.minLocation.x ? other.minLocation.x : this.minLocation.x;
        let minY = other.minLocation.y < this.minLocation.y ? other.minLocation.y : this.minLocation.y;
        let minZ = other.minLocation.z < this.minLocation.z ? other.minLocation.z : this.minLocation.z;
        let maxX = other.maxLocation.x > this.maxLocation.x ? other.maxLocation.x : this.maxLocation.x;
        let maxY = other.maxLocation.y > this.maxLocation.y ? other.maxLocation.y : this.maxLocation.y;
        let maxZ = other.maxLocation.z > this.maxLocation.z ? other.maxLocation.z : this.maxLocation.z;
        this._dimensions = new Dimensions(maxX - minX, maxY - minY, maxZ - minZ);
        const min = new Point3D(minX, minY, minZ);
        const max = new Point3D(maxX, maxY, maxZ);
        const width = (max.x - min.x) / 2;
        const depth = (max.y - min.y) / 2;
        const height = (max.z - min.z) / 2;
        this._centre = new Point3D(min.x + width, min.y + depth, min.z + height);
        this._minLocation = min;
        this._maxLocation = max;
    }
    dump() {
        console.log("BoundingCuboid");
        console.log(" - min (x,y,z):", this.minLocation.x, this.minLocation.y, this.minLocation.z);
        console.log(" - max (x,y,z):", this.maxLocation.x, this.maxLocation.y, this.maxLocation.z);
        console.log(" - centre (x,y,z):", this.centre.x, this.centre.y, this.centre.z);
        console.log(" - dimensions (WxDxH):", this.width, this.depth, this.height);
    }
    _centre;
    _dimensions;
}
class CollisionInfo {
    constructor(_collidedEntity, _blocking, _intersectInfo){
        this._collidedEntity = _collidedEntity;
        this._blocking = _blocking;
        this._intersectInfo = _intersectInfo;
    }
    get entity() {
        return this._collidedEntity;
    }
    get blocking() {
        return this._blocking;
    }
    get intersectInfo() {
        return this._intersectInfo;
    }
    _collidedEntity;
    _blocking;
    _intersectInfo;
}
class CollisionDetector {
    static _collisionInfo;
    static _missInfo;
    static _spatialInfo;
    static init(spatialInfo) {
        this._spatialInfo = spatialInfo;
        this._collisionInfo = new Map();
        this._missInfo = new Map();
    }
    static hasCollideInfo(movable) {
        return this._collisionInfo.has(movable);
    }
    static getCollideInfo(movable) {
        console.assert(this.hasCollideInfo(movable));
        return this._collisionInfo.get(movable);
    }
    static removeInfo(movable) {
        this._collisionInfo.delete(movable);
    }
    static removeMissInfo(movable) {
        this._missInfo.delete(movable);
    }
    static addMissInfo(actor, entities) {
        this._missInfo.set(actor, entities);
    }
    static hasMissInfo(movable) {
        return this._missInfo.has(movable);
    }
    static getMissInfo(movable) {
        console.assert(this.hasMissInfo(movable));
        return this._missInfo.get(movable);
    }
    static detectInArea(movable, path, area) {
        const bounds = movable.bounds;
        const widthVec3D = new Vector3D(bounds.width, 0, 0);
        const depthVec3D = new Vector3D(0, bounds.depth, 0);
        const heightVec3D = new Vector3D(0, 0, bounds.height);
        const beginPoints = [
            bounds.minLocation,
            bounds.minLocation.add(heightVec3D),
            bounds.minLocation.add(depthVec3D),
            bounds.minLocation.add(widthVec3D),
            bounds.maxLocation.sub(heightVec3D),
            bounds.maxLocation.sub(depthVec3D),
            bounds.maxLocation.sub(widthVec3D),
            bounds.maxLocation
        ];
        let misses = new Array();
        const entities = this._spatialInfo.getEntities(area);
        for (let entity of entities){
            if (entity.id == movable.id) {
                continue;
            }
            const geometry = entity.geometry;
            for (const beginPoint of beginPoints){
                const endPoint = beginPoint.add(path);
                let intersectInfo = geometry.obstructs(beginPoint, endPoint);
                if (intersectInfo != null) {
                    const collision = new CollisionInfo(entity, true, intersectInfo);
                    this._collisionInfo.set(movable, collision);
                    movable.postEvent(EntityEvent.Collision);
                    return collision;
                } else {
                    misses.push(entity);
                    movable.postEvent(EntityEvent.NoCollision);
                }
            }
        }
        this.addMissInfo(movable, misses);
        return null;
    }
}
class Gravity {
    static _enabled = false;
    static _force = 0;
    static _context;
    static init(force, context) {
        this._force = -force;
        this._context = context;
        this._enabled = true;
    }
    static update(entities) {
        if (!this._enabled) {
            return;
        }
        if (this._force < 0) {
            const path = new Vector3D(0, 0, this._force);
            entities.forEach((movable)=>{
                let bounds = movable.bounds;
                let area = new BoundingCuboid(bounds.centre.add(path), bounds.dimensions);
                area.insert(bounds);
                const collision = CollisionDetector.detectInArea(movable, path, area);
                if (collision == null) {
                    movable.updatePosition(path);
                }
            });
        }
    }
}
export { Dimensions as Dimensions };
export { BoundingCuboid as BoundingCuboid };
export { CollisionInfo as CollisionInfo };
export { CollisionDetector as CollisionDetector };
export { Gravity as Gravity };
class PhysicalEntity {
    static _ids = 0;
    _id;
    _visible;
    _drawable;
    _geometry;
    _drawGeometry;
    _handler;
    _graphicComponents;
    static reset() {
        this._ids = 0;
    }
    static getNumEntities() {
        return this._ids;
    }
    constructor(_context, minLocation, dimensions){
        this._context = _context;
        this._visible = true;
        this._drawable = false;
        this._drawGeometry = false;
        this._handler = new EventHandler();
        this._graphicComponents = new Array();
        this._id = PhysicalEntity._ids;
        PhysicalEntity._ids++;
        const centre = new Point3D(minLocation.x + dimensions.width / 2, minLocation.y + dimensions.depth / 2, minLocation.z + dimensions.height / 2);
        const bounds = new BoundingCuboid(centre, dimensions);
        this._geometry = new CuboidGeometry(bounds);
        this._context.addEntity(this);
    }
    set visible(visible) {
        this._visible = visible;
    }
    get context() {
        return this._context;
    }
    get geometry() {
        return this._geometry;
    }
    get bounds() {
        return this._geometry.bounds;
    }
    get dimensions() {
        return this.bounds.dimensions;
    }
    get x() {
        return this.bounds.minX;
    }
    get y() {
        return this.bounds.minY;
    }
    get z() {
        return this.bounds.minZ;
    }
    get width() {
        return this.bounds.width;
    }
    get depth() {
        return this.bounds.depth;
    }
    get height() {
        return this.bounds.height;
    }
    get centre() {
        return this.bounds.centre;
    }
    get id() {
        return this._id;
    }
    get visible() {
        return this._visible;
    }
    get drawable() {
        return this._drawable;
    }
    get drawGeometry() {
        return this._drawGeometry;
    }
    get graphics() {
        return this._graphicComponents;
    }
    get graphic() {
        return this._graphicComponents[0];
    }
    addGraphic(graphic) {
        this._drawable = true;
        this._graphicComponents.push(graphic);
    }
    updatePosition(d) {
        this.bounds.update(d);
        this.geometry.transform(d);
    }
    addEventListener(event, callback) {
        this._handler.addEventListener(event, callback);
    }
    removeEventListener(event, callback) {
        this._handler.removeEventListener(event, callback);
    }
    postEvent(event) {
        this._handler.post(event);
    }
    update() {
        this._handler.service();
    }
    _context;
}
class MovableEntity extends PhysicalEntity {
    _lift = 0;
    _canSwim = false;
    _direction;
    constructor(context, location, dimensions){
        super(context, location, dimensions);
        context.addMovableEntity(this);
    }
    updatePosition(d) {
        this.bounds.update(d);
        this.geometry.transform(d);
        this.postEvent(EntityEvent.Moving);
    }
    get lift() {
        return this._lift;
    }
    get direction() {
        return this._direction;
    }
    set direction(direction) {
        this._direction = direction;
        this.postEvent(EntityEvent.FaceDirection);
    }
}
class Actor extends MovableEntity {
    _action;
    constructor(context, location, dimensions){
        super(context, location, dimensions);
        context.addUpdateableEntity(this);
    }
    update() {
        super.update();
        if (this._action != undefined && this._action.perform()) {
            this._action = null;
        }
    }
    set action(action) {
        this._action = action;
    }
}
function createGraphicalEntity(context, location, dimensions, graphicComponent) {
    let entity = new PhysicalEntity(context, location, dimensions);
    entity.addGraphic(graphicComponent);
    return entity;
}
function createGraphicalMovableEntity(context, location, dimensions, graphicComponent) {
    let entity = new MovableEntity(context, location, dimensions);
    entity.addGraphic(graphicComponent);
    return entity;
}
function createGraphicalActor(context, location, dimensions, graphicComponent) {
    let actor = new Actor(context, location, dimensions);
    actor.addGraphic(graphicComponent);
    return actor;
}
export { PhysicalEntity as PhysicalEntity };
export { MovableEntity as MovableEntity };
export { Actor as Actor };
export { createGraphicalEntity as createGraphicalEntity };
export { createGraphicalMovableEntity as createGraphicalMovableEntity };
export { createGraphicalActor as createGraphicalActor };
var Direction;
var TerrainShape;
var DummySpriteSheet = {
    addForValidation: function(sprite) {
        return true;
    }
};
(function(Direction) {
    Direction[Direction["North"] = 0] = "North";
    Direction[Direction["NorthEast"] = 1] = "NorthEast";
    Direction[Direction["East"] = 2] = "East";
    Direction[Direction["SouthEast"] = 3] = "SouthEast";
    Direction[Direction["South"] = 4] = "South";
    Direction[Direction["SouthWest"] = 5] = "SouthWest";
    Direction[Direction["West"] = 6] = "West";
    Direction[Direction["NorthWest"] = 7] = "NorthWest";
    Direction[Direction["Max"] = 8] = "Max";
})(Direction || (Direction = {}));
class Navigation {
    static getDirectionName(direction) {
        switch(direction){
            default:
                break;
            case Direction.North:
                return "north";
            case Direction.NorthEast:
                return "north east";
            case Direction.East:
                return "east";
            case Direction.SouthEast:
                return "south east";
            case Direction.South:
                return "south";
            case Direction.SouthWest:
                return "south west";
            case Direction.West:
                return "west";
            case Direction.NorthWest:
                return "north west";
        }
        console.error("unhandled direction when getting name:", direction);
        return "error";
    }
    static getVector2D(direction) {
        let xDiff = 0;
        let yDiff = 0;
        switch(direction){
            default:
                console.error("unhandled direction");
                break;
            case Direction.North:
                yDiff = -1;
                break;
            case Direction.NorthEast:
                xDiff = 1;
                yDiff = -1;
                break;
            case Direction.East:
                xDiff = 1;
                break;
            case Direction.SouthEast:
                xDiff = 1;
                yDiff = 1;
                break;
            case Direction.South:
                yDiff = 1;
                break;
            case Direction.SouthWest:
                xDiff = -1;
                yDiff = 1;
                break;
            case Direction.West:
                xDiff = -1;
                break;
            case Direction.NorthWest:
                xDiff = -1;
                yDiff = -1;
                break;
        }
        return new Vector2D(xDiff, yDiff);
    }
    static getAdjacentCoord(p, direction) {
        let v = this.getVector2D(direction);
        return p.add(v);
    }
    static getDirectionFromPoints(from, to) {
        return this.getDirectionFromVector(to.diff(from));
    }
    static getDirectionFromVector(w) {
        let mag = w.mag();
        let u = new Vector2D(0, -mag);
        let theta = 180 * u.angle(w) / Math.PI;
        if (theta < 0) {
            let rotate = 180 + theta;
            theta = 180 + rotate;
        }
        const direction = Math.round(theta / 45);
        return direction;
    }
    static getOppositeDirection(direction) {
        return (direction + Direction.Max / 2) % Direction.Max;
    }
}
class PathNode {
    _edgeCosts = new Map();
    _x;
    _y;
    constructor(terrain){
        this._x = terrain.x;
        this._y = terrain.y;
    }
    addSuccessor(succ, cost) {
        this._edgeCosts.set(succ, cost);
    }
    hasSuccessor(succ) {
        return this._edgeCosts.has(succ);
    }
    get x() {
        return this._x;
    }
    get y() {
        return this._y;
    }
}
class SpriteSheet {
    static _sheets = new Array();
    static add(sheet) {
        this._sheets.push(sheet);
    }
    static reset() {
        this._sheets = new Array();
    }
    _image;
    _canvas;
    _loaded = false;
    _toValidate = new Array();
    constructor(name){
        this._image = new Image();
        if (name) {
            this._image.src = name + ".png";
        } else {
            throw new Error("No filename passed");
        }
        SpriteSheet.add(this);
        this._image.onload = ()=>{
            this.canvas = document.createElement('canvas');
            this.canvas.width = this.width;
            this.canvas.height = this.height;
            this.canvas.getContext('2d').drawImage(this.image, 0, 0, this.width, this.height);
            this.loaded = true;
            for (let sprite of this._toValidate){
                sprite.validate();
            }
        };
    }
    get image() {
        return this._image;
    }
    get width() {
        return this._image.width;
    }
    get height() {
        return this._image.height;
    }
    get name() {
        return this._image.src;
    }
    get loaded() {
        return this._loaded;
    }
    set loaded(b) {
        this._loaded = b;
    }
    get canvas() {
        return this._canvas;
    }
    set canvas(c) {
        this._canvas = c;
    }
    isTransparentAt(x, y) {
        let data = this.canvas.getContext('2d').getImageData(x, y, 1, 1).data;
        return data[3] == 0;
    }
    addForValidation(sprite) {
        this._toValidate.push(sprite);
    }
}
class Sprite {
    static _sprites = new Array();
    static reset() {
        this._sprites = new Array();
    }
    static add(sprite) {
        this._sprites.push(sprite);
    }
    static get sprites() {
        return this._sprites;
    }
    _id;
    _spriteOffset;
    _maxOffset;
    constructor(_sheet, offsetX, offsetY, _width, _height){
        this._sheet = _sheet;
        this._width = _width;
        this._height = _height;
        console.assert(offsetX >= 0, "offsetX < 0");
        console.assert(offsetY >= 0, "offsetY < 0");
        this._id = Sprite.sprites.length;
        this._spriteOffset = new Point2D(offsetX, offsetY);
        this._maxOffset = new Point2D(this.offset.x + this.width, this.offset.y + this.height);
        Sprite.add(this);
        if (this.sheet.loaded) {
            this.validate();
        } else {
            this.sheet.addForValidation(this);
        }
    }
    draw(coord, ctx) {
        ctx.drawImage(this.sheet.image, this.offset.x, this.offset.y, this.width, this.height, coord.x, coord.y, this.width, this.height);
    }
    validate() {
        console.assert(this.maxOffset.x <= this.sheet.width, "sprite id:", this.id, "sprite max X offset too large", this.maxOffset.x);
        console.assert(this.maxOffset.y <= this.sheet.height, "sprite id:", this.id, "sprite max Y offset too large", this.maxOffset.y);
    }
    isTransparentAt(x, y) {
        x += this.offset.x;
        y += this.offset.y;
        return this.sheet.isTransparentAt(x, y);
    }
    get id() {
        return this._id;
    }
    get width() {
        return this._width;
    }
    get height() {
        return this._height;
    }
    get sheet() {
        return this._sheet;
    }
    get offset() {
        return this._spriteOffset;
    }
    get maxOffset() {
        return this._maxOffset;
    }
    _sheet;
    _width;
    _height;
}
export { Sprite as Sprite };
function generateSprites(sheet, width, height, xBegin, yBegin, columns, rows) {
    var sprites = new Array();
    const xEnd = xBegin + columns;
    const yEnd = yBegin + rows;
    for(let y = yBegin; y < yEnd; y++){
        for(let x = xBegin; x < xEnd; x++){
            sprites.push(new Sprite(sheet, x * width, y * height, width, height));
        }
    }
    return sprites;
}
class GraphicComponent {
    constructor(_currentSpriteId){
        this._currentSpriteId = _currentSpriteId;
    }
    isTransparentAt(x, y) {
        return Sprite.sprites[this._currentSpriteId].isTransparentAt(x, y);
    }
    get width() {
        return Sprite.sprites[this._currentSpriteId].width;
    }
    get height() {
        return Sprite.sprites[this._currentSpriteId].height;
    }
    _currentSpriteId;
}
class DummyGraphicComponent extends GraphicComponent {
    constructor(_width, _height){
        super(0);
        this._width = _width;
        this._height = _height;
    }
    get width() {
        return this._width;
    }
    get height() {
        return this._height;
    }
    update() {
        return 0;
    }
    _width;
    _height;
}
class StaticGraphicComponent extends GraphicComponent {
    constructor(id){
        super(id);
    }
    update() {
        return this._currentSpriteId;
    }
}
export { StaticGraphicComponent as StaticGraphicComponent };
(function(TerrainShape) {
    TerrainShape[TerrainShape["Flat"] = 0] = "Flat";
    TerrainShape[TerrainShape["Wall"] = 1] = "Wall";
    TerrainShape[TerrainShape["FlatWest"] = 2] = "FlatWest";
    TerrainShape[TerrainShape["FlatEast"] = 3] = "FlatEast";
    TerrainShape[TerrainShape["FlatNorthWest"] = 4] = "FlatNorthWest";
    TerrainShape[TerrainShape["FlatNorth"] = 5] = "FlatNorth";
    TerrainShape[TerrainShape["FlatNorthEast"] = 6] = "FlatNorthEast";
    TerrainShape[TerrainShape["FlatSouthWest"] = 7] = "FlatSouthWest";
    TerrainShape[TerrainShape["FlatSouth"] = 8] = "FlatSouth";
    TerrainShape[TerrainShape["FlatSouthEast"] = 9] = "FlatSouthEast";
    TerrainShape[TerrainShape["FlatNorthOut"] = 10] = "FlatNorthOut";
    TerrainShape[TerrainShape["FlatEastOut"] = 11] = "FlatEastOut";
    TerrainShape[TerrainShape["FlatWestOut"] = 12] = "FlatWestOut";
    TerrainShape[TerrainShape["FlatSouthOut"] = 13] = "FlatSouthOut";
    TerrainShape[TerrainShape["FlatAloneOut"] = 14] = "FlatAloneOut";
    TerrainShape[TerrainShape["RampUpSouthEdge"] = 15] = "RampUpSouthEdge";
    TerrainShape[TerrainShape["RampUpWestEdge"] = 16] = "RampUpWestEdge";
    TerrainShape[TerrainShape["RampUpEastEdge"] = 17] = "RampUpEastEdge";
    TerrainShape[TerrainShape["RampUpNorthEdge"] = 18] = "RampUpNorthEdge";
    TerrainShape[TerrainShape["RampUpSouth"] = 19] = "RampUpSouth";
    TerrainShape[TerrainShape["RampUpWest"] = 20] = "RampUpWest";
    TerrainShape[TerrainShape["RampUpEast"] = 21] = "RampUpEast";
    TerrainShape[TerrainShape["RampUpNorth"] = 22] = "RampUpNorth";
    TerrainShape[TerrainShape["Max"] = 23] = "Max";
})(TerrainShape || (TerrainShape = {}));
var TerrainType;
(function(TerrainType) {
    TerrainType[TerrainType["Water"] = 0] = "Water";
    TerrainType[TerrainType["Lowland0"] = 1] = "Lowland0";
    TerrainType[TerrainType["Lowland1"] = 2] = "Lowland1";
    TerrainType[TerrainType["Lowland2"] = 3] = "Lowland2";
    TerrainType[TerrainType["Lowland3"] = 4] = "Lowland3";
    TerrainType[TerrainType["Lowland4"] = 5] = "Lowland4";
    TerrainType[TerrainType["Lowland5"] = 6] = "Lowland5";
    TerrainType[TerrainType["Upland0"] = 7] = "Upland0";
    TerrainType[TerrainType["Upland1"] = 8] = "Upland1";
    TerrainType[TerrainType["Upland2"] = 9] = "Upland2";
    TerrainType[TerrainType["Upland3"] = 10] = "Upland3";
    TerrainType[TerrainType["Upland4"] = 11] = "Upland4";
    TerrainType[TerrainType["Upland5"] = 12] = "Upland5";
})(TerrainType || (TerrainType = {}));
var TerrainFeature;
(function(TerrainFeature) {
    TerrainFeature[TerrainFeature["None"] = 0] = "None";
    TerrainFeature[TerrainFeature["Shoreline"] = 1] = "Shoreline";
    TerrainFeature[TerrainFeature["ShorelineNorth"] = 2] = "ShorelineNorth";
    TerrainFeature[TerrainFeature["ShorelineEast"] = 4] = "ShorelineEast";
    TerrainFeature[TerrainFeature["ShorelineSouth"] = 8] = "ShorelineSouth";
    TerrainFeature[TerrainFeature["ShorelineWest"] = 16] = "ShorelineWest";
    TerrainFeature[TerrainFeature["DryGrass"] = 32] = "DryGrass";
    TerrainFeature[TerrainFeature["WetGrass"] = 64] = "WetGrass";
    TerrainFeature[TerrainFeature["Mud"] = 128] = "Mud";
})(TerrainFeature || (TerrainFeature = {}));
function hasFeature(features, mask) {
    return (features & mask) == mask;
}
class Terrain extends PhysicalEntity {
    static _dimensions;
    static _featureGraphics = new Map();
    static _terrainGraphics = new Map();
    static reset() {
        this._dimensions = new Dimensions(0, 0, 0);
        this._featureGraphics = new Map();
        this._terrainGraphics = new Map();
    }
    static getDimensions() {
        return this._dimensions;
    }
    static graphics(terrainType, shape) {
        if (!this._terrainGraphics.has(terrainType)) {
            console.error("missing graphics for TerrainType", Terrain.getTypeName(terrainType));
        }
        if (!this._terrainGraphics.get(terrainType).has(shape)) {
            console.error("missing graphics for TerrainShape:", Terrain.getShapeName(shape));
        }
        return this._terrainGraphics.get(terrainType).get(shape);
    }
    static featureGraphics(terrainFeature) {
        console.assert(this._featureGraphics.has(terrainFeature), "missing terrain feature", Terrain.getFeatureName(terrainFeature));
        return this._featureGraphics.get(terrainFeature);
    }
    static addGraphic(terrainType, terrainShape, sheet, x, y, width, height) {
        let sprite = new Sprite(sheet, x, y, width, height);
        let component = new StaticGraphicComponent(sprite.id);
        if (!this._terrainGraphics.has(terrainType)) {
            this._terrainGraphics.set(terrainType, new Map());
        }
        this._terrainGraphics.get(terrainType).set(terrainShape, component);
    }
    static addFeatureGraphics(feature, graphics) {
        this._featureGraphics.set(feature, graphics);
    }
    static isSupportedFeature(feature) {
        return this._featureGraphics.has(feature);
    }
    static isSupportedType(type) {
        return this._terrainGraphics.has(type);
    }
    static isSupportedShape(type, shape) {
        return this.isSupportedType(type) && this._terrainGraphics.get(type).has(shape);
    }
    static init(dims) {
        this._dimensions = dims;
    }
    static get width() {
        return this._dimensions.width;
    }
    static get depth() {
        return this._dimensions.depth;
    }
    static get height() {
        return this._dimensions.height;
    }
    static scaleLocation(loc) {
        return new Point3D(Math.floor(loc.x / this.width), Math.floor(loc.y / this.depth), Math.floor(loc.z / this.height));
    }
    static create(context, x, y, z, type, shape, feature) {
        return new Terrain(context, x, y, z, this._dimensions, type, shape, feature);
    }
    static getFeatureName(feature) {
        switch(feature){
            default:
                break;
            case TerrainFeature.Shoreline:
            case TerrainFeature.ShorelineNorth:
            case TerrainFeature.ShorelineEast:
            case TerrainFeature.ShorelineSouth:
            case TerrainFeature.ShorelineWest:
                return "Shoreline";
            case TerrainFeature.DryGrass:
                return "Dry Grass";
            case TerrainFeature.WetGrass:
                return "Wet Grass";
            case TerrainFeature.Mud:
                return "Mud";
        }
        return "None";
    }
    static getShapeName(terrain) {
        switch(terrain){
            default:
                console.error("unhandled terrain shape:", terrain);
            case TerrainShape.Flat:
                return "flat";
            case TerrainShape.Wall:
                return "wall";
            case TerrainShape.FlatNorth:
                return "flat north";
            case TerrainShape.FlatNorthEast:
                return "flat north east";
            case TerrainShape.FlatNorthWest:
                return "flat north west";
            case TerrainShape.FlatEast:
                return "flat east";
            case TerrainShape.FlatWest:
                return "flat west";
            case TerrainShape.FlatSouth:
                return "flat south";
            case TerrainShape.FlatSouthEast:
                return "flat south east";
            case TerrainShape.FlatSouthWest:
                return "flat south west";
            case TerrainShape.RampUpNorth:
                return "ramp up north";
            case TerrainShape.RampUpNorthEdge:
                return "ramp up north edge";
            case TerrainShape.RampUpEast:
                return "ramp up east";
            case TerrainShape.RampUpEastEdge:
                return "ramp up east edge";
            case TerrainShape.RampUpSouth:
                return "ramp up south";
            case TerrainShape.RampUpSouthEdge:
                return "ramp up south edge";
            case TerrainShape.RampUpWest:
                return "ramp up west";
            case TerrainShape.RampUpWestEdge:
                return "ramp up west edge";
            case TerrainShape.FlatNorthOut:
                return "flat north out";
            case TerrainShape.FlatEastOut:
                return "flat east out";
            case TerrainShape.FlatWestOut:
                return "flat west out";
            case TerrainShape.FlatSouthOut:
                return "flat south out";
            case TerrainShape.FlatAloneOut:
                return "flat alone out";
        }
    }
    static getTypeName(terrain) {
        switch(terrain){
            default:
                console.error("unhandled terrain type:", terrain);
            case TerrainType.Water:
                return "water";
            case TerrainType.Lowland0:
                return "lowland 0";
            case TerrainType.Lowland1:
                return "lowland 1";
            case TerrainType.Lowland2:
                return "lowland 2";
            case TerrainType.Lowland3:
                return "lowland 3";
            case TerrainType.Lowland4:
                return "lowland 4";
            case TerrainType.Lowland5:
                return "lowland 5";
            case TerrainType.Upland0:
                return "upland 0";
            case TerrainType.Upland1:
                return "upland 1";
            case TerrainType.Upland2:
                return "upland 2";
            case TerrainType.Upland3:
                return "upland 3";
            case TerrainType.Upland4:
                return "upland 4";
            case TerrainType.Upland5:
                return "upland 5";
        }
    }
    static isFlat(terrain) {
        switch(terrain){
            default:
                break;
            case TerrainShape.FlatNorthWest:
            case TerrainShape.FlatNorth:
            case TerrainShape.FlatNorthEast:
            case TerrainShape.FlatWest:
            case TerrainShape.Flat:
            case TerrainShape.Wall:
            case TerrainShape.FlatEast:
            case TerrainShape.FlatSouthWest:
            case TerrainShape.FlatSouth:
            case TerrainShape.FlatSouthEast:
            case TerrainShape.FlatNorthOut:
            case TerrainShape.FlatEastOut:
            case TerrainShape.FlatSouthOut:
            case TerrainShape.FlatWestOut:
            case TerrainShape.FlatAloneOut:
                return true;
        }
        return false;
    }
    static isEdge(terrain) {
        switch(terrain){
            default:
                break;
            case TerrainShape.FlatNorthWest:
            case TerrainShape.FlatNorth:
            case TerrainShape.FlatNorthEast:
            case TerrainShape.FlatWest:
            case TerrainShape.Wall:
            case TerrainShape.FlatEast:
            case TerrainShape.FlatSouthWest:
            case TerrainShape.FlatSouth:
            case TerrainShape.FlatSouthEast:
            case TerrainShape.FlatNorthOut:
            case TerrainShape.FlatEastOut:
            case TerrainShape.FlatSouthOut:
            case TerrainShape.FlatWestOut:
            case TerrainShape.FlatAloneOut:
            case TerrainShape.RampUpSouthEdge:
            case TerrainShape.RampUpWestEdge:
            case TerrainShape.RampUpEastEdge:
            case TerrainShape.RampUpNorthEdge:
                return true;
        }
        return false;
    }
    static isRampUp(shape, direction) {
        switch(direction){
            default:
                break;
            case Direction.North:
                return shape == TerrainShape.RampUpNorthEdge || shape == TerrainShape.RampUpNorth;
            case Direction.East:
                return shape == TerrainShape.RampUpEastEdge || shape == TerrainShape.RampUpEast;
            case Direction.South:
                return shape == TerrainShape.RampUpSouthEdge || shape == TerrainShape.RampUpSouth;
            case Direction.West:
                return shape == TerrainShape.RampUpWestEdge || shape == TerrainShape.RampUpWest;
        }
        return false;
    }
    _tanTheta;
    _surfaceLocation;
    constructor(context, _gridX, _gridY, _gridZ, dimensions, _type, _shape, features){
        super(context, new Point3D(_gridX * dimensions.width, _gridY * dimensions.depth, _gridZ * dimensions.height), dimensions);
        this._gridX = _gridX;
        this._gridY = _gridY;
        this._gridZ = _gridZ;
        this._type = _type;
        this._shape = _shape;
        this.addGraphic(Terrain.graphics(_type, _shape));
        if (!Terrain.isFlat(_shape)) {
            let theta = Math.atan(this.height / this.depth) * 180 / Math.PI;
            this._tanTheta = Math.tan(theta);
        } else {
            this._tanTheta = 0;
        }
        if (this._shape == TerrainShape.RampUpWest) {
            this._geometry = new RampUpWestGeometry(this.geometry.bounds);
        } else if (this._shape == TerrainShape.RampUpEast) {
            this._geometry = new RampUpEastGeometry(this.geometry.bounds);
        } else if (this._shape == TerrainShape.RampUpSouth) {
            this._geometry = new RampUpSouthGeometry(this.geometry.bounds);
        } else if (this._shape == TerrainShape.RampUpNorth) {
            this._geometry = new RampUpNorthGeometry(this.geometry.bounds);
        }
        let x = this.bounds.centre.x;
        let y = this.bounds.centre.y;
        let z = this.heightAt(this.bounds.centre);
        this._surfaceLocation = new Point3D(x, y, z);
        if (features == TerrainFeature.None) {
            return;
        }
        for(let key in TerrainFeature){
            if (typeof TerrainFeature[key] === "number") {
                let feature = TerrainFeature[key];
                if (Terrain.isSupportedFeature(feature) && hasFeature(features, feature)) {
                    this.addGraphic(Terrain.featureGraphics(feature));
                }
            }
        }
    }
    get gridX() {
        return this._gridX;
    }
    get gridY() {
        return this._gridY;
    }
    get gridZ() {
        return this._gridZ;
    }
    get shape() {
        return this._shape;
    }
    get type() {
        return this._type;
    }
    get surfaceLocation() {
        return this._surfaceLocation;
    }
    heightAt(location) {
        if (!this.bounds.contains(location)) {
            return null;
        }
        if (Terrain.isFlat(this._shape)) {
            return this.z + this.height;
        }
        return this.z + location.y * this._tanTheta;
    }
    _gridX;
    _gridY;
    _gridZ;
    _type;
    _shape;
}
export { Terrain as Terrain };
class PathFinder {
    _graph = new Array();
    constructor(grid){
        for(let y = 0; y < grid.depth; y++){
            this.graph[y] = new Array();
            for(let x = 0; x < grid.width; x++){
                let centre = grid.getSurfaceTerrainAt(x, y);
                this.addNode(x, y, centre);
            }
        }
        for(let y1 = 0; y1 < grid.depth; y1++){
            for(let x1 = 0; x1 < grid.width; x1++){
                let centre1 = grid.getSurfaceTerrainAt(x1, y1);
                this.addNeighbours(centre1, grid);
            }
        }
    }
    get graph() {
        return this._graph;
    }
    addNode(x, y, terrain) {
        this._graph[y][x] = new PathNode(terrain);
    }
    getNode(x, y) {
        return this._graph[y][x];
    }
    addNeighbours(centre, grid) {
        let neighbours = this.getAccessibleNeighbours(centre, grid);
        let centreNode = this.getNode(centre.x, centre.y);
        for (let neighbour of neighbours){
            let cost = this.getNeighbourCost(centre, neighbour);
            let succ = this.getNode(neighbour.x, neighbour.y);
            centreNode.addSuccessor(succ, cost);
        }
    }
    getAccessibleNeighbours(centre, grid) {
        let neighbours = grid.getNeighbours(centre);
        let centrePoint = new Point2D(centre.x, centre.y);
        return neighbours.filter(function(to) {
            console.assert(Math.abs(centre.z - to.z) <= 1, "can only handle neighbours separated by 1 terrace max");
            let toPoint = new Point2D(to.x, to.y);
            let direction = Navigation.getDirectionFromPoints(centrePoint, toPoint);
            console.assert(direction == Direction.North || direction == Direction.East || direction == Direction.South || direction == Direction.West);
            let oppositeDir = Navigation.getOppositeDirection(direction);
            if (to.z == centre.z) {
                return true;
            } else if (to.z > centre.z) {
                return Terrain.isRampUp(to.shape, direction);
            } else if (to.z < centre.z) {
                return Terrain.isRampUp(to.shape, oppositeDir);
            }
            return false;
        });
    }
    getNeighbourCost(centre, to) {
        let cost = centre.x == to.x || centre.y == to.y ? 2 : 3;
        if (Terrain.isFlat(centre.shape) && Terrain.isFlat(to.shape)) {
            return cost;
        }
        return centre.z == to.z ? cost : cost * 2;
    }
    isAccessible(centre, dx, dy) {
        let succ = this.getNode(centre.x + dx, centre.y + dy);
        return centre.hasSuccessor(succ);
    }
    findPath() {}
}
class TerrainGrid {
    static neighbourOffsets = [
        new Point2D(-1, -1),
        new Point2D(0, -1),
        new Point2D(1, -1),
        new Point2D(-1, 0),
        new Point2D(1, 0),
        new Point2D(-1, 1),
        new Point2D(0, 1),
        new Point2D(1, 1), 
    ];
    _surfaceTerrain;
    _totalSurface;
    _totalSubSurface;
    constructor(_context, _width, _depth){
        this._context = _context;
        this._width = _width;
        this._depth = _depth;
        this._surfaceTerrain = new Array();
        this._totalSurface = 0;
        this._totalSubSurface = 0;
        for(let y = 0; y < this.depth; ++y){
            this.surfaceTerrain.push(new Array(this.width));
        }
    }
    get width() {
        return this._width;
    }
    get depth() {
        return this._depth;
    }
    get totalSurface() {
        return this._totalSurface;
    }
    get totalSubSurface() {
        return this._totalSubSurface;
    }
    get surfaceTerrain() {
        return this._surfaceTerrain;
    }
    addSurfaceTerrain(x, y, z, ty, shape, feature) {
        let terrain = Terrain.create(this._context, x, y, z, ty, shape, feature);
        this.surfaceTerrain[y][x] = terrain;
        this._totalSurface++;
    }
    addSubSurfaceTerrain(x, y, z, ty, shape) {
        console.assert(this.getSurfaceTerrainAt(x, y).z > z, "adding sub-surface terrain which is above surface!");
        Terrain.create(this._context, x, y, z, ty, shape, TerrainFeature.None);
        this._totalSubSurface++;
    }
    getSurfaceTerrainAt(x, y) {
        if (x < 0 || x >= this.width || y < 0 || y >= this.depth) {
            return null;
        }
        return this.surfaceTerrain[y][x];
    }
    getNeighbours(centre) {
        let neighbours = new Array();
        for (let offset of TerrainGrid.neighbourOffsets){
            let neighbour = this.getSurfaceTerrainAt(centre.x + offset.x, centre.y + offset.y);
            if (!neighbour) {
                continue;
            }
            neighbours.push(neighbour);
        }
        return neighbours;
    }
    _context;
    _width;
    _depth;
}
function generateStaticGraphics(sheet, width, height, xBegin, yBegin, columns, rows) {
    var graphics = new Array();
    const xEnd = xBegin + columns;
    const yEnd = yBegin + rows;
    for(let y = yBegin; y < yEnd; y++){
        for(let x = xBegin; x < xEnd; x++){
            const sprite = new Sprite(sheet, x * width, y * height, width, height);
            graphics.push(new StaticGraphicComponent(sprite.id));
        }
    }
    return graphics;
}
class AnimatedGraphicComponent extends GraphicComponent {
    _nextUpdate;
    _currentSpriteIdx;
    _spriteIds;
    constructor(sprites, _interval){
        super(sprites[0].id);
        this._interval = _interval;
        this._nextUpdate = 0;
        this._currentSpriteIdx = 0;
        this._spriteIds = new Array();
        for(let i in sprites){
            this._spriteIds.push(sprites[i].id);
        }
        this._nextUpdate = Date.now() + _interval;
    }
    update() {
        return this._spriteIds[this._currentSpriteIdx];
    }
    get firstId() {
        return this._spriteIds[0];
    }
    get lastId() {
        return this._spriteIds[this._spriteIds.length - 1];
    }
    get currentSpriteId() {
        console.assert(this._currentSpriteIdx >= 0);
        console.assert(this._currentSpriteIdx < this._spriteIds.length);
        return this._spriteIds[this._currentSpriteIdx];
    }
    _interval;
}
class OssilateGraphicComponent extends AnimatedGraphicComponent {
    _increase = true;
    constructor(sprites, interval){
        super(sprites, interval);
        this._currentSpriteIdx = Math.floor(Math.random() * (this._spriteIds.length - 1));
    }
    update() {
        if (this._nextUpdate > Date.now()) {
            return this.currentSpriteId;
        }
        if (this._currentSpriteIdx == this._spriteIds.length - 1) {
            this._increase = false;
        } else if (this._currentSpriteIdx == 0) {
            this._increase = true;
        }
        if (this._increase) {
            this._currentSpriteIdx++;
        } else {
            this._currentSpriteIdx--;
        }
        this._nextUpdate = Date.now() + this._interval;
        return this.currentSpriteId;
    }
}
class LoopGraphicComponent extends AnimatedGraphicComponent {
    constructor(sprites, interval){
        super(sprites, interval);
        this._currentSpriteIdx = 0;
    }
    update() {
        if (this._nextUpdate > Date.now()) {
            return this.currentSpriteId;
        }
        this._currentSpriteIdx = (this._currentSpriteIdx + 1) % this._spriteIds.length;
        this._nextUpdate = Date.now() + this._interval;
        return this.currentSpriteId;
    }
}
class DirectionalGraphicComponent extends GraphicComponent {
    _direction;
    constructor(_staticGraphics){
        super(0);
        this._staticGraphics = _staticGraphics;
        this._direction = Direction.North;
    }
    get direction() {
        return this._direction;
    }
    set direction(direction) {
        if (this._staticGraphics.has(direction)) {
            this._direction = direction;
        } else {
            console.log("graphic direction unsupported");
        }
    }
    update() {
        if (this._staticGraphics.has(this.direction)) {
            const component = this._staticGraphics.get(this.direction);
            const spriteId = component.update();
            return spriteId;
        }
        console.error("unhandled stationary graphic:", Navigation.getDirectionName(this.direction));
        return 0;
    }
    _staticGraphics;
}
class AnimatedDirectionalGraphicComponent extends GraphicComponent {
    _stationary;
    _direction;
    constructor(_staticGraphics, _movementGraphics){
        super(0);
        this._staticGraphics = _staticGraphics;
        this._movementGraphics = _movementGraphics;
        this._stationary = true;
        this._direction = Direction.North;
    }
    get stationary() {
        return this._stationary;
    }
    get direction() {
        return this._direction;
    }
    set stationary(stationary) {
        this._stationary = stationary;
    }
    set direction(direction) {
        if (this._staticGraphics.has(direction) && this._movementGraphics.has(direction)) {
            this._direction = direction;
        } else {
            console.log("graphic direction unsupported");
        }
    }
    update() {
        if (!this.stationary && this._movementGraphics.has(this.direction)) {
            const spriteId = this._movementGraphics.get(this.direction).update();
            return spriteId;
        }
        if (this.stationary && this._staticGraphics.has(this.direction)) {
            const component = this._staticGraphics.get(this.direction);
            const spriteId1 = component.update();
            return spriteId1;
        }
        if (this.stationary) {
            console.error("unhandled stationary graphic:", Navigation.getDirectionName(this.direction));
        } else {
            console.error("unhandled movement graphic:", Navigation.getDirectionName(this.direction));
        }
        return 0;
    }
    _staticGraphics;
    _movementGraphics;
}
export { Direction as Direction };
export { Navigation as Navigation };
export { PathFinder as PathFinder };
export { TerrainShape as TerrainShape };
export { TerrainType as TerrainType };
export { TerrainFeature as TerrainFeature };
export { TerrainGrid as TerrainGrid };
export { DummySpriteSheet as DummySpriteSheet };
export { SpriteSheet as SpriteSheet };
export { generateSprites as generateSprites };
export { GraphicComponent as GraphicComponent };
export { DummyGraphicComponent as DummyGraphicComponent };
export { generateStaticGraphics as generateStaticGraphics };
export { AnimatedGraphicComponent as AnimatedGraphicComponent };
export { OssilateGraphicComponent as OssilateGraphicComponent };
export { LoopGraphicComponent as LoopGraphicComponent };
export { DirectionalGraphicComponent as DirectionalGraphicComponent };
export { AnimatedDirectionalGraphicComponent as AnimatedDirectionalGraphicComponent };
class QueueItem {
    constructor(_element, _key){
        this._element = _element;
        this._key = _key;
    }
    get element() {
        return this._element;
    }
    get key() {
        return this._key;
    }
    set key(k) {
        this._key = k;
    }
    _element;
    _key;
}
class MinPriorityQueue {
    _items = new Array();
    _indices = new Map();
    constructor(){}
    get indices() {
        return this._indices;
    }
    get items() {
        return this._items;
    }
    get size() {
        return this.items.length - 1;
    }
    get length() {
        return this.items.length;
    }
    pop() {
        let minItem = this.items[0];
        this.items.splice(0, 1);
        this.indices.delete(minItem.element);
        for(let i = 0; i < this.items.length; ++i){
            let item = this.items[i];
            this.indices.set(item.element, i);
        }
        this.build();
        return minItem.element;
    }
    parentIdx(i) {
        return i - 1 >> 1;
    }
    leftIdx(i) {
        return 2 * i + 1;
    }
    rightIdx(i) {
        return 2 * i + 2;
    }
    keyAt(i) {
        console.assert(i < this.length);
        let item = this.items[i];
        return item.key;
    }
    insert(x, k) {
        console.assert(!this.indices.has(x));
        this.items.push(new QueueItem(x, Number.MAX_VALUE));
        this.indices.set(x, this.size);
        this.setKey(x, k);
    }
    setKey(x, k) {
        console.assert(this.indices.has(x));
        let i = this.indices.get(x);
        console.assert(i < this.length);
        let item = this.items[i];
        console.assert(k <= item.key);
        item.key = k;
        while(i > 0 && this.keyAt(this.parentIdx(i)) > this.keyAt(i)){
            this.exchange(i, this.parentIdx(i));
            i = this.parentIdx(i);
        }
    }
    exchange(idxA, idxB) {
        console.assert(idxA < this.length);
        console.assert(idxB < this.length);
        let itemA = this.items[idxA];
        let itemB = this.items[idxB];
        this.items[idxA] = itemB;
        this.items[idxB] = itemA;
        this.indices.set(itemA.element, idxB);
        this.indices.set(itemB.element, idxA);
    }
    build() {
        for(let i = this.size >> 1; i >= 0; i--){
            this.heapify(i);
        }
    }
    heapify(i) {
        let left = this.leftIdx(i);
        let right = this.rightIdx(i);
        let smallest = i;
        if (left < this.length && this.keyAt(left) < this.keyAt(i)) {
            smallest = left;
        }
        if (right < this.length && this.keyAt(right) < this.keyAt(i)) {
            smallest = right;
        }
        if (smallest != i) {
            this.exchange(i, smallest);
            this.heapify(smallest);
        }
    }
}
export { MinPriorityQueue as MinPriorityQueue };
var RenderOrder;
(function(RenderOrder) {
    RenderOrder[RenderOrder["Before"] = -1] = "Before";
    RenderOrder[RenderOrder["Any"] = 0] = "Any";
    RenderOrder[RenderOrder["After"] = 1] = "After";
})(RenderOrder || (RenderOrder = {}));
class SceneNode {
    _preds;
    _succs;
    _level;
    _topOutlineSegments;
    _sideOutlineSegments;
    _baseOutlineSegments;
    _drawCoord;
    constructor(_entity, _minDrawCoord){
        this._entity = _entity;
        this._minDrawCoord = _minDrawCoord;
        this._preds = new Array();
        this._succs = new Array();
        this._topOutlineSegments = new Array();
        this._sideOutlineSegments = new Array();
        this._baseOutlineSegments = new Array();
        this.drawCoord = _minDrawCoord;
    }
    overlapX(other) {
        return this.entity.bounds.minX >= other.entity.bounds.minX && this.entity.bounds.minX < other.entity.bounds.maxX || this.entity.bounds.maxX > other.entity.bounds.minX && this.entity.bounds.maxX <= other.entity.bounds.maxX;
    }
    overlapY(other) {
        return this.entity.bounds.minY >= other.entity.bounds.minY && this.entity.bounds.minY < other.entity.bounds.maxY || this.entity.bounds.maxY > other.entity.bounds.minY && this.entity.bounds.maxY <= other.entity.bounds.maxY;
    }
    overlapZ(other) {
        return this.entity.bounds.minZ >= other.entity.bounds.minZ && this.entity.bounds.minZ < other.entity.bounds.maxZ || this.entity.bounds.maxZ > other.entity.bounds.minZ && this.entity.bounds.maxZ <= other.entity.bounds.maxZ;
    }
    updateSegments(diff) {
        this.topSegments[0] = this.topSegments[0].add(diff);
        this.topSegments[1] = this.topSegments[1].add(diff);
        this.baseSegments[0] = this.baseSegments[0].add(diff);
        this.baseSegments[1] = this.baseSegments[1].add(diff);
        this.sideSegments[0] = this.sideSegments[0].add(diff);
        this.sideSegments[1] = this.sideSegments[1].add(diff);
        this.drawCoord = this.drawCoord.add(diff);
        this.minDrawCoord = this.minDrawCoord.add(diff);
    }
    intersectsTop(other) {
        for (const otherTop of other.topSegments){
            if (this.baseSegments[0].intersects(otherTop) || this.baseSegments[1].intersects(otherTop)) {
                return true;
            }
            if (this.sideSegments[0].intersects(otherTop) || this.sideSegments[1].intersects(otherTop)) {
                return true;
            }
        }
        return false;
    }
    clear() {
        this._succs = [];
    }
    addSucc(succ) {
        const idx = this._succs.indexOf(succ);
        if (idx != -1) return;
        this._succs.push(succ);
    }
    removeSucc(succ) {
        const idx = this._succs.indexOf(succ);
        if (idx == -1) return;
        this._succs.splice(idx, 1);
    }
    get id() {
        return this._entity.id;
    }
    get drawCoord() {
        return this._drawCoord;
    }
    set drawCoord(coord) {
        this._drawCoord = coord;
    }
    get minDrawCoord() {
        return this._minDrawCoord;
    }
    set minDrawCoord(coord) {
        this._minDrawCoord = coord;
    }
    get topSegments() {
        return this._topOutlineSegments;
    }
    get baseSegments() {
        return this._baseOutlineSegments;
    }
    get sideSegments() {
        return this._sideOutlineSegments;
    }
    get entity() {
        return this._entity;
    }
    get succs() {
        return this._succs;
    }
    get level() {
        return this._level;
    }
    set level(level) {
        this._level = level;
    }
    get minZ() {
        return this._entity.bounds.minZ;
    }
    get maxZ() {
        return this._entity.bounds.maxZ;
    }
    get isRoot() {
        return this._preds.length == 0;
    }
    _entity;
    _minDrawCoord;
}
class SceneLevel {
    _nodes = new Array();
    _order = new Array();
    _minZ;
    _maxZ;
    _dirty = true;
    constructor(root){
        this._minZ = root.minZ;
        this._maxZ = root.maxZ;
        this._nodes.push(root);
        root.level = this;
    }
    get nodes() {
        return this._nodes;
    }
    get order() {
        return this._order;
    }
    set order(o) {
        this._order = o;
    }
    get minZ() {
        return this._minZ;
    }
    get maxZ() {
        return this._maxZ;
    }
    get dirty() {
        return this._dirty;
    }
    set dirty(d) {
        this._dirty = d;
    }
    inrange(entity) {
        return entity.bounds.minZ >= this._minZ && entity.bounds.minZ < this._maxZ;
    }
    add(node, graph) {
        this.dirty = true;
        node.level = this;
        this._nodes.push(node);
        this.update(node, graph);
    }
    remove(node) {
        this.dirty = true;
        const idx = this._nodes.indexOf(node);
        console.assert(idx != -1);
        this._nodes.splice(idx, 1);
        this._nodes.forEach((pred)=>pred.removeSucc(node));
    }
    update(node, graph) {
        node.clear();
        for(let i = 0; i < this._nodes.length; i++){
            const existing = this._nodes[i];
            if (existing.id == node.id) {
                continue;
            }
            const order = graph.drawOrder(node, existing);
            if (RenderOrder.Before == order) {
                node.addSucc(existing);
            } else if (RenderOrder.After == order) {
                existing.addSucc(node);
            } else {
                existing.removeSucc(node);
            }
        }
        this.dirty = true;
    }
    shouldDraw(node, camera) {
        const entity = node.entity;
        if (entity.visible && entity.drawable) {
            const width = entity.graphics[0].width;
            const height = entity.graphics[0].height;
            return camera.isOnScreen(node.drawCoord, width, height);
        } else {
            return false;
        }
    }
    buildGraph(graph, camera, force) {
        if (!force && !this.dirty) {
            return;
        }
        const toDraw = this._nodes.filter((node)=>this.shouldDraw(node, camera));
        toDraw.sort((a, b)=>graph.drawOrder(a, b));
        this.order = [];
        const discovered = new Set();
        const topoSort = (node)=>{
            if (discovered.has(node)) {
                return;
            }
            discovered.add(node);
            for (const succ of node.succs){
                topoSort(succ);
            }
            this.order.push(node);
        };
        for(const i in toDraw){
            if (discovered.has(toDraw[i])) {
                continue;
            }
            topoSort(toDraw[i]);
        }
        this.dirty = false;
    }
}
class SceneGraph {
    _levels = new Array();
    _numNodes = 0;
    _prevCameraLower = new Point2D(0, 0);
    _prevCameraUpper = new Point2D(0, 0);
    constructor(){}
    updateDrawOutline(node) {
        const entity = node.entity;
        const min = entity.bounds.minLocation;
        const minDraw = this.getDrawCoord(min);
        const diff = minDraw.diff(node.minDrawCoord);
        node.updateSegments(diff);
    }
    setDrawOutline(node) {
        const entity = node.entity;
        const min = entity.bounds.minLocation;
        const max = entity.bounds.maxLocation;
        node.topSegments.length = 0;
        node.baseSegments.length = 0;
        node.sideSegments.length = 0;
        const min2D = this.getDrawCoord(min);
        const base1 = this.getDrawCoord(new Point3D(min.x, max.y, min.z));
        const base2 = this.getDrawCoord(new Point3D(max.x, max.y, min.z));
        node.baseSegments.push(new Segment2D(min2D, base1));
        node.baseSegments.push(new Segment2D(base1, base2));
        const max2D = this.getDrawCoord(max);
        const top1 = this.getDrawCoord(new Point3D(min.x, min.y, max.z));
        const top2 = this.getDrawCoord(new Point3D(max.x, min.y, max.z));
        node.topSegments.push(new Segment2D(top1, top2));
        node.topSegments.push(new Segment2D(top2, max2D));
        node.sideSegments.push(new Segment2D(min2D, top1));
        node.sideSegments.push(new Segment2D(base2, max2D));
        const drawHeightOffset = min2D.diff(top2);
        const coord = this.getDrawCoord(entity.bounds.minLocation);
        const adjustedCoord = new Point2D(coord.x, coord.y - drawHeightOffset.y);
        node.drawCoord = adjustedCoord;
    }
    get levels() {
        return this._levels;
    }
    get initialised() {
        return this.levels.length != 0;
    }
    get numNodes() {
        return this._numNodes;
    }
    updateNode(node) {
        if (!this.initialised) {
            return;
        }
        this.updateDrawOutline(node);
        console.assert(node.level != null, "node with id:", node.entity.id, "isn't assigned a level!");
        const level = node.level;
        if (level.inrange(node.entity)) {
            level.update(node, this);
        } else {
            level.remove(node);
            this.insertIntoLevel(node);
        }
    }
    insertIntoLevel(node) {
        for (const level of this.levels){
            if (level.inrange(node.entity)) {
                level.add(node, this);
                return;
            }
        }
        this.levels.push(new SceneLevel(node));
    }
    insertNode(node) {
        this.setDrawOutline(node);
        if (this.initialised) {
            this.insertIntoLevel(node);
        }
    }
    initialise(nodes) {
        const nodeList = new Array();
        for (const node of nodes.values()){
            nodeList.push(node);
            this.setDrawOutline(node);
        }
        nodeList.sort((a, b)=>{
            if (a.minZ < b.minZ) return RenderOrder.Before;
            if (a.minZ > b.minZ) return RenderOrder.After;
            return RenderOrder.Any;
        });
        nodeList.forEach((node)=>this.insertIntoLevel(node));
    }
    cameraHasMoved(camera) {
        const lower = camera.min;
        const upper = camera.max;
        const needsRedraw = this._prevCameraLower.x != lower.x || this._prevCameraLower.y != lower.y || this._prevCameraUpper.x != upper.x || this._prevCameraUpper.y != upper.y;
        this._prevCameraLower = lower;
        this._prevCameraUpper = upper;
        return needsRedraw;
    }
    buildLevels(camera, force) {
        if (this.cameraHasMoved(camera)) {
            force = true;
        }
        this._levels.forEach((level)=>level.buildGraph(this, camera, force));
    }
}
class BaseSceneRenderer {
    _nodes;
    _numEntities;
    constructor(_graph){
        this._graph = _graph;
        this._nodes = new Map();
        this._numEntities = 0;
    }
    get graph() {
        return this._graph;
    }
    get numEntities() {
        return this._numEntities;
    }
    get nodes() {
        return this._nodes;
    }
    get ctx() {
        return null;
    }
    insertEntity(entity) {
        const node = new SceneNode(entity, this.graph.getDrawCoord(entity.bounds.minLocation));
        this.nodes.set(node.id, node);
        if (this.graph.initialised) {
            this.graph.insertNode(node);
        }
        this._numEntities++;
    }
    updateEntity(entity) {
        console.assert(this._nodes.has(entity.id));
        const node = this._nodes.get(entity.id);
        this.graph.updateNode(node);
    }
    getNode(id) {
        console.assert(this.nodes.has(id));
        return this.nodes.get(id);
    }
    getLocationAt(_x, _y, _camera) {
        return null;
    }
    getEntityDrawnAt(_x, _y, _camera) {
        return null;
    }
    render(_camera, _force) {
        return 0;
    }
    addTimedEvent(_callback) {}
    verifyRenderer(entities) {
        if (this.graph.numNodes != entities.length) {
            console.error("top-level comparison between scene node and entities failed");
        }
        let counted = 0;
        const levelNodeIds = new Array();
        const nodeIds = new Array();
        const entityIds = new Array();
        for (const level of this.graph.levels){
            counted += level.nodes.length;
            level.nodes.forEach((node)=>levelNodeIds.push(node.id));
        }
        for (const node of this.nodes.values()){
            nodeIds.push(node.id);
        }
        entities.forEach((entity)=>entityIds.push(entity.id));
        if (nodeIds.length != entityIds.length || nodeIds.length != levelNodeIds.length) {
            console.error("number of scene nodes and entities don't match up");
            return false;
        }
        if (this.numEntities != entities.length) {
            console.error("mismatch in number of entities in context and scene");
        }
        nodeIds.sort((a, b)=>{
            if (a < b) return -1;
            else return 1;
        });
        entityIds.sort((a, b)=>{
            if (a < b) return -1;
            else return 1;
        });
        levelNodeIds.sort((a, b)=>{
            if (a < b) return -1;
            else return 1;
        });
        for(let i = 0; i < nodeIds.length; ++i){
            if (i != nodeIds[i]) {
                console.error("mismatch in expected ids:", i, nodeIds[i]);
                return false;
            }
            if (nodeIds[i] != entityIds[i]) {
                console.error("mismatch node vs entity ids:", nodeIds[i], entityIds[i]);
                return false;
            }
            if (nodeIds[i] != levelNodeIds[i]) {
                console.error("mismatch top level node vs found in level ids:", nodeIds[i], levelNodeIds[i]);
                return false;
            }
        }
        return true;
    }
    _graph;
}
class OffscreenSceneRenderer extends BaseSceneRenderer {
    constructor(graph){
        super(graph);
    }
    render(camera, force) {
        let drawn = 0;
        if (!this.graph.initialised) {
            this.graph.initialise(this.nodes);
        }
        this.graph.buildLevels(camera, force);
        this.graph.levels.forEach((level)=>{
            for(let i = level.order.length - 1; i >= 0; i--){
                const node = level.order[i];
                const entity = node.entity;
                if (!entity.visible || !entity.drawable) {
                    continue;
                }
                drawn++;
            }
        });
        return drawn;
    }
}
class OnscreenSceneRenderer extends BaseSceneRenderer {
    _width;
    _height;
    _ctx;
    _handler;
    constructor(_canvas, graph){
        super(graph);
        this._canvas = _canvas;
        this._handler = new TimedEventHandler();
        this._width = _canvas.width;
        this._height = _canvas.height;
        this._ctx = this._canvas.getContext("2d", {
            alpha: false
        });
    }
    get width() {
        return this._width;
    }
    get height() {
        return this._height;
    }
    get ctx() {
        return this._ctx;
    }
    addTimedEvent(callback) {
        this._handler.add(callback);
    }
    getLocationAt(x, y, camera) {
        const entity = this.getEntityDrawnAt(x, y, camera);
        if (entity != null) {
            return entity.bounds.minLocation;
        }
        return null;
    }
    getEntityDrawnAt(x, y, camera) {
        for(let i = this.graph.levels.length - 1; i >= 0; i--){
            const level = this.graph.levels[i];
            for(let j = 0; j < level.nodes.length; j++){
                const node = level.nodes[j];
                const entity = node.entity;
                if (!entity.visible || !entity.drawable) {
                    continue;
                }
                if (!camera.isOnScreen(node.drawCoord, entity.width, entity.depth)) {
                    continue;
                }
                const onScreenCoord = camera.getDrawCoord(node.drawCoord);
                const graphic = entity.graphic;
                if (x < onScreenCoord.x || y < onScreenCoord.y || x > onScreenCoord.x + graphic.width || y > onScreenCoord.y + graphic.height) {
                    continue;
                }
                if (!graphic.isTransparentAt(x - onScreenCoord.x, y - onScreenCoord.y)) {
                    return entity;
                }
            }
        }
        return null;
    }
    renderNode(node, camera) {
        const entity = node.entity;
        const coord = camera.getDrawCoord(node.drawCoord);
        entity.graphics.forEach((component)=>{
            const spriteId = component.update();
            Sprite.sprites[spriteId].draw(coord, this.ctx);
        });
    }
    render(camera, force) {
        if (!this.graph.initialised) {
            this.graph.initialise(this.nodes);
        }
        this.graph.buildLevels(camera, force);
        this.ctx.clearRect(0, 0, this._width, this._height);
        this.graph.levels.forEach((level)=>{
            for(let i = level.order.length - 1; i >= 0; i--){
                const node = level.order[i];
                this.renderNode(node, camera);
            }
        });
        this._handler.service();
        return 0;
    }
    _canvas;
}
var Perspective;
(function(Perspective) {
    Perspective[Perspective["TrueIsometric"] = 0] = "TrueIsometric";
    Perspective[Perspective["TwoByOneIsometric"] = 1] = "TwoByOneIsometric";
})(Perspective || (Perspective = {}));
class IsometricPhysicalDimensions extends Dimensions {
    static _oneOverSqrt3 = 1 / Math.sqrt(3);
    static physicalWidth(spriteWidth) {
        return Math.round(spriteWidth * this._oneOverSqrt3);
    }
    static physicalDepth(physicalWidth, relativeDims) {
        const depthRatio = relativeDims.depth / relativeDims.width;
        return Math.round(physicalWidth * depthRatio);
    }
    static physicalHeight(physicalWidth, relativeDims) {
        const heightRatio = relativeDims.height / relativeDims.width;
        return Math.round(physicalWidth * heightRatio);
    }
    constructor(spriteWidth, relativeDims){
        const width = IsometricPhysicalDimensions.physicalWidth(spriteWidth);
        const depth = IsometricPhysicalDimensions.physicalDepth(width, relativeDims);
        const height = IsometricPhysicalDimensions.physicalHeight(width, relativeDims);
        super(width, depth, height);
    }
}
class TrueIsometric extends SceneGraph {
    constructor(){
        super();
    }
    static _sqrt3 = Math.sqrt(3);
    static _halfSqrt3 = Math.sqrt(3) * 0.5;
    static getDrawCoord(loc) {
        const dx = Math.round(this._halfSqrt3 * (loc.x + loc.y));
        const dy = Math.round(0.5 * (loc.y - loc.x) - loc.z);
        return new Point2D(dx, dy);
    }
    getDrawCoord(location) {
        return TrueIsometric.getDrawCoord(location);
    }
    drawOrder(first, second) {
        if (first.overlapX(second)) {
            return first.entity.bounds.minY <= second.entity.bounds.minY ? RenderOrder.Before : RenderOrder.After;
        }
        if (first.overlapY(second)) {
            return first.entity.bounds.minX >= second.entity.bounds.minX ? RenderOrder.Before : RenderOrder.After;
        }
        if (!first.overlapZ(second)) {
            return RenderOrder.Any;
        }
        if (first.intersectsTop(second)) {
            return RenderOrder.Before;
        }
        if (second.intersectsTop(first)) {
            return RenderOrder.After;
        }
        return RenderOrder.Any;
    }
}
class TwoByOneIsometric extends SceneGraph {
    constructor(){
        super();
    }
    static _magicRatio = Math.cos(Math.atan(0.5));
    static _oneOverMagicRatio = 1 / Math.cos(Math.atan(0.5));
    static getDrawCoord(loc) {
        const dx = Math.round((loc.x + loc.y) * 2 * this._oneOverMagicRatio);
        const dy = Math.round((loc.y - loc.x - loc.z) * this._oneOverMagicRatio);
        return new Point2D(dx, dy);
    }
    static getDimensions(spriteWidth, spriteHeight) {
        const oneUnit = spriteWidth * 0.25;
        const twoUnits = spriteWidth * 0.5;
        const width = oneUnit * this._magicRatio;
        const depth = twoUnits * Math.sin(Math.atan(0.5));
        const height = (spriteHeight - twoUnits) * this._magicRatio;
        return new Dimensions(Math.round(width), Math.round(depth), Math.round(height));
    }
    static drawOrder(first, second) {
        if (first.overlapX(second)) {
            return first.entity.bounds.minY < second.entity.bounds.minY ? RenderOrder.Before : RenderOrder.After;
        }
        if (first.overlapY(second)) {
            return first.entity.bounds.minX > second.entity.bounds.minX ? RenderOrder.Before : RenderOrder.After;
        }
        if (!first.overlapZ(second)) {
            return RenderOrder.Any;
        }
        if (first.intersectsTop(second)) {
            return RenderOrder.Before;
        }
        if (second.intersectsTop(first)) {
            return RenderOrder.After;
        }
        return RenderOrder.Any;
    }
    getDrawCoord(location) {
        return TwoByOneIsometric.getDrawCoord(location);
    }
    drawOrder(first, second) {
        return TwoByOneIsometric.drawOrder(first, second);
    }
}
export { RenderOrder as RenderOrder };
export { SceneNode as SceneNode };
export { SceneLevel as SceneLevel };
export { SceneGraph as SceneGraph };
export { OffscreenSceneRenderer as OffscreenSceneRenderer };
export { OnscreenSceneRenderer as OnscreenSceneRenderer };
export { Perspective as Perspective };
export { IsometricPhysicalDimensions as IsometricPhysicalDimensions };
export { TrueIsometric as TrueIsometric };
export { TwoByOneIsometric as TwoByOneIsometric };
class Cloud {
    constructor(_pos, _moisture, _direction, _rain){
        this._pos = _pos;
        this._moisture = _moisture;
        this._direction = _direction;
        this._rain = _rain;
    }
    get x() {
        return this._pos.x;
    }
    get y() {
        return this._pos.y;
    }
    get pos() {
        return this._pos;
    }
    get moisture() {
        return this._moisture;
    }
    get rain() {
        return this._rain;
    }
    get minHeight() {
        return this.rain.minHeight;
    }
    get direction() {
        return this._direction;
    }
    get surface() {
        return this.rain.surface;
    }
    set pos(p) {
        this._pos = p;
    }
    set moisture(m) {
        this._moisture = m;
    }
    dropMoisture(multiplier) {
        let moisture = this.moisture * 0.1 * multiplier;
        this.moisture -= moisture;
        this.rain.addMoistureAt(this.pos, moisture);
    }
    move() {
        while(this.surface.inbounds(this.pos)){
            let nextCoord = Navigation.getAdjacentCoord(this.pos, this.direction);
            if (!this.surface.inbounds(nextCoord)) {
                this.dropMoisture(1);
                return;
            }
            let current = this.surface.at(this.x, this.y);
            if (current.height <= this.minHeight || current.terrace < 1) {
                this.pos = nextCoord;
                continue;
            }
            let next = this.surface.at(nextCoord.x, nextCoord.y);
            const multiplier = next.terrace > current.terrace ? 1.5 : 1;
            this.dropMoisture(multiplier);
            this.pos = nextCoord;
        }
    }
    _pos;
    _moisture;
    _direction;
    _rain;
}
class Rain {
    _clouds;
    _totalClouds;
    _moistureGrid;
    constructor(_surface, _minHeight, moisture, direction){
        this._surface = _surface;
        this._minHeight = _minHeight;
        this._clouds = Array();
        this._totalClouds = 0;
        this._moistureGrid = new Array();
        for(let y = 0; y < this.surface.depth; y++){
            this._moistureGrid.push(new Float32Array(this.surface.width));
        }
        switch(direction){
            default:
                console.error('unhandled direction');
                break;
            case Direction.North:
                {
                    const y1 = this.surface.depth - 1;
                    for(let x = 0; x < this.surface.width; x++){
                        this.addCloud(new Point2D(x, y1), moisture, direction);
                    }
                    break;
                }
            case Direction.East:
                {
                    for(let y2 = 0; y2 < this.surface.depth; y2++){
                        this.addCloud(new Point2D(0, y2), moisture, direction);
                    }
                    break;
                }
            case Direction.South:
                {
                    for(let x2 = 0; x2 < this.surface.width; x2++){
                        this.addCloud(new Point2D(x2, 0), moisture, direction);
                    }
                    break;
                }
            case Direction.West:
                {
                    const x3 = this.surface.width - 1;
                    for(let y4 = 0; y4 < this.surface.depth; y4++){
                        this.addCloud(new Point2D(x3, y4), moisture, direction);
                    }
                    break;
                }
        }
    }
    get clouds() {
        return this._clouds;
    }
    get totalClouds() {
        return this._totalClouds;
    }
    get surface() {
        return this._surface;
    }
    get minHeight() {
        return this._minHeight;
    }
    get moistureGrid() {
        return this._moistureGrid;
    }
    moistureAt(x, y) {
        return this._moistureGrid[y][x];
    }
    addMoistureAt(pos, moisture) {
        this.moistureGrid[pos.y][pos.x] += moisture;
    }
    addCloud(pos, moisture, direction) {
        this.clouds.push(new Cloud(pos, moisture, direction, this));
        this._totalClouds++;
    }
    run() {
        while(this.clouds.length != 0){
            let cloud = this.clouds[this.clouds.length - 1];
            this.clouds.pop();
            cloud.move();
        }
    }
    _surface;
    _minHeight;
}
var Biome;
(function(Biome) {
    Biome[Biome["Water"] = 0] = "Water";
    Biome[Biome["Desert"] = 1] = "Desert";
    Biome[Biome["Grassland"] = 2] = "Grassland";
    Biome[Biome["Shrubland"] = 3] = "Shrubland";
    Biome[Biome["MoistForest"] = 4] = "MoistForest";
    Biome[Biome["WetForest"] = 5] = "WetForest";
    Biome[Biome["RainForest"] = 6] = "RainForest";
    Biome[Biome["Rock"] = 7] = "Rock";
    Biome[Biome["Tundra"] = 8] = "Tundra";
    Biome[Biome["AlpineGrassland"] = 9] = "AlpineGrassland";
    Biome[Biome["AlpineMeadow"] = 10] = "AlpineMeadow";
    Biome[Biome["AlpineForest"] = 11] = "AlpineForest";
    Biome[Biome["Taiga"] = 12] = "Taiga";
})(Biome || (Biome = {}));
function getBiomeName(biome) {
    switch(biome){
        default:
            console.error("unhandled biome type:", biome);
            return "invalid biome";
        case Biome.Water:
            return "water";
        case Biome.Desert:
            return "desert";
        case Biome.Grassland:
            return "grassland";
        case Biome.Shrubland:
            return "shrubland";
        case Biome.MoistForest:
            return "moist forest";
        case Biome.WetForest:
            return "wet forest";
        case Biome.RainForest:
            return "rain forest";
        case Biome.Tundra:
            return "tundra";
        case Biome.AlpineGrassland:
            return "alpine grassland";
        case Biome.AlpineMeadow:
            return "alpine meadow";
        case Biome.AlpineForest:
            return "alpine forest";
        case Biome.Taiga:
            return "taiga";
    }
}
function mean(grid) {
    let total = 0;
    let numElements = 0;
    for (const row of grid){
        const acc = row.reduce(function(acc, value) {
            return acc + value;
        }, 0);
        total += acc;
        numElements += row.length;
    }
    return total / numElements;
}
function meanWindow(grid, centreX, centreY, offsets) {
    let total = 0;
    const numElements = offsets.length * offsets.length;
    for(const dy in offsets){
        const y = centreY + offsets[dy];
        for(const dx in offsets){
            const x = centreX + offsets[dx];
            total += grid[y][x];
        }
    }
    return total / numElements;
}
function standardDevWindow(grid, centreX, centreY, offsets) {
    const avg = meanWindow(grid, centreX, centreY, offsets);
    if (avg == 0) {
        return 0;
    }
    const diffsSquared = new Array();
    const size = offsets.length;
    for(const dy in offsets){
        const y = centreY + offsets[dy];
        const row = new Float32Array(size);
        let wx = 0;
        for(const dx in offsets){
            const x = centreX + offsets[dx];
            const diff = grid[y][x] - avg;
            row[wx] = diff * diff;
            wx++;
        }
        diffsSquared.push(row);
    }
    return Math.sqrt(mean(diffsSquared));
}
function gaussianBlur(grid, width, depth) {
    const halfSize = Math.floor(5 / 2);
    const offsets = [
        -2,
        -1,
        0,
        1,
        2
    ];
    const distancesSquared = [
        4,
        1,
        0,
        1,
        4
    ];
    const result = new Array();
    for(let y = 0; y < halfSize; y++){
        result[y] = grid[y];
    }
    for(let y1 = depth - halfSize; y1 < depth; y1++){
        result[y1] = grid[y1];
    }
    const filter = new Float32Array(5);
    for(let y2 = halfSize; y2 < depth - halfSize; y2++){
        result[y2] = new Float32Array(width);
        for(let x = 0; x < halfSize; x++){
            result[y2][x] = grid[y2][x];
        }
        for(let x1 = width - halfSize; x1 < width; x1++){
            result[y2][x1] = grid[y2][x1];
        }
        for(let x2 = halfSize; x2 < width - halfSize; x2++){
            const sigma = standardDevWindow(grid, x2, y2, offsets);
            if (sigma == 0) {
                continue;
            }
            const sigmaSquared = sigma * sigma;
            const denominator = Math.sqrt(2 * Math.PI * sigmaSquared);
            let sum = 0;
            for(const i in distancesSquared){
                const numerator = Math.exp(-(distancesSquared[i] / (2 * sigmaSquared)));
                filter[i] = numerator / denominator;
                sum += filter[i];
            }
            for (let coeff of filter){
                coeff /= sum;
            }
            let blurred = 0;
            for(const i1 in offsets){
                const dx = offsets[i1];
                blurred += grid[y2][x2 + dx] * filter[i1];
            }
            for(const i2 in offsets){
                const dy = offsets[i2];
                blurred += grid[y2 + dy][x2] * filter[i2];
            }
            result[y2][x2] = blurred;
        }
    }
    return result;
}
class TerrainAttributes {
    _moisture;
    _terrace;
    _biome;
    _type;
    _shape;
    _features;
    _fixed;
    constructor(_x, _y, _height){
        this._x = _x;
        this._y = _y;
        this._height = _height;
        this._fixed = false;
        this._moisture = 0.0;
        this._biome = Biome.Water;
        this._terrace = 0;
        this._type = TerrainType.Water;
        this._shape = TerrainShape.Flat;
        this._features = TerrainFeature.None;
    }
    get x() {
        return this._x;
    }
    get y() {
        return this._y;
    }
    get pos() {
        return new Point2D(this._x, this._y);
    }
    get height() {
        return this._height;
    }
    get terrace() {
        return this._terrace;
    }
    set terrace(t) {
        this._terrace = t;
    }
    get type() {
        return this._type;
    }
    set type(t) {
        this._type = t;
    }
    get shape() {
        return this._shape;
    }
    set shape(s) {
        this._shape = s;
    }
    get features() {
        return this._features;
    }
    set features(f) {
        this._features |= f;
    }
    get moisture() {
        return this._moisture;
    }
    set moisture(m) {
        this._moisture = m;
    }
    get biome() {
        return this._biome;
    }
    set biome(b) {
        this._biome = b;
    }
    get fixed() {
        return this._fixed;
    }
    set fixed(f) {
        this._fixed = f;
    }
    _x;
    _y;
    _height;
}
class Surface {
    _surface;
    constructor(_width, _depth){
        this._width = _width;
        this._depth = _depth;
        this._surface = new Array();
    }
    get width() {
        return this._width;
    }
    get depth() {
        return this._depth;
    }
    init(heightMap) {
        for(let y = 0; y < this._depth; y++){
            this._surface.push(new Array());
            for(let x = 0; x < this._width; x++){
                const height = heightMap[y][x];
                this._surface[y].push(new TerrainAttributes(x, y, height));
            }
        }
    }
    inbounds(coord) {
        if (coord.x < 0 || coord.x >= this._width || coord.y < 0 || coord.y >= this._depth) return false;
        return true;
    }
    at(x, y) {
        return this._surface[y][x];
    }
    getNeighbours(centreX, centreY) {
        const neighbours = new Array();
        for(let yDiff = -1; yDiff < 2; yDiff++){
            const y = centreY + yDiff;
            if (y < 0 || y >= this._depth) {
                continue;
            }
            for(let xDiff = -1; xDiff < 2; xDiff++){
                const x = centreX + xDiff;
                if (x < 0 || x >= this._width) {
                    continue;
                }
                if (x == centreX && y == centreY) {
                    continue;
                }
                neighbours.push(this._surface[y][x]);
            }
        }
        return neighbours;
    }
    _width;
    _depth;
}
class TerrainBuilderConfig {
    _waterLine;
    _wetLimit;
    _dryLimit;
    _uplandThreshold;
    _hasWater;
    _hasRamps;
    _hasBiomes;
    _rainfall;
    _rainDirection;
    constructor(_numTerraces, _defaultFloor, _defaultWall){
        this._numTerraces = _numTerraces;
        this._defaultFloor = _defaultFloor;
        this._defaultWall = _defaultWall;
        this._waterLine = 0;
        this._wetLimit = 0;
        this._dryLimit = 0;
        this._uplandThreshold = 0;
        this._hasWater = false;
        this._hasRamps = false;
        this._hasBiomes = false;
        this._rainfall = 0;
        this._rainDirection = Direction.North;
        console.assert(_numTerraces > 0);
    }
    get waterLine() {
        return this._waterLine;
    }
    set waterLine(level) {
        this._waterLine = level;
    }
    get wetLimit() {
        return this._wetLimit;
    }
    set wetLimit(level) {
        this._wetLimit = level;
    }
    get rainfall() {
        return this._rainfall;
    }
    set rainfall(level) {
        this._rainfall = level;
    }
    get uplandThreshold() {
        return this._uplandThreshold;
    }
    set uplandThreshold(level) {
        this._uplandThreshold = level;
    }
    get rainDirection() {
        return this._rainDirection;
    }
    set rainDirection(direction) {
        this._rainDirection = direction;
    }
    get dryLimit() {
        return this._dryLimit;
    }
    set dryLimit(level) {
        this._dryLimit = level;
    }
    get hasWater() {
        return this._hasWater;
    }
    set hasWater(enable) {
        this._hasWater = enable;
    }
    set hasRamps(enable) {
        this._hasRamps = enable;
    }
    set hasBiomes(enable) {
        this._hasBiomes = enable;
    }
    get numTerraces() {
        return this._numTerraces;
    }
    get floor() {
        return this._defaultFloor;
    }
    get wall() {
        return this._defaultWall;
    }
    get ramps() {
        return this._hasRamps;
    }
    get biomes() {
        return this._hasBiomes;
    }
    _numTerraces;
    _defaultFloor;
    _defaultWall;
}
class TerrainBuilder {
    _surface;
    _terraceSpacing;
    constructor(width, depth, heightMap, _config, physicalDims){
        this._config = _config;
        Terrain.init(physicalDims);
        let minHeight = 0;
        let maxHeight = 0;
        for(let y = 0; y < depth; y++){
            const row = heightMap[y];
            const max = row.reduce(function(a, b) {
                return Math.max(a, b);
            });
            const min = row.reduce(function(a, b) {
                return Math.min(a, b);
            });
            minHeight = Math.min(minHeight, min);
            maxHeight = Math.max(maxHeight, max);
        }
        if (minHeight < 0) {
            minHeight = Math.abs(minHeight);
            for(let y1 = 0; y1 < depth; y1++){
                for(let x = 0; x < width; x++){
                    heightMap[y1][x] += minHeight;
                }
            }
            maxHeight += minHeight;
        }
        this._terraceSpacing = maxHeight / this.config.numTerraces;
        this._surface = new Surface(width, depth);
        this.surface.init(heightMap);
        for(let y2 = 0; y2 < this.surface.depth; y2++){
            for(let x1 = 0; x1 < this.surface.width; x1++){
                const surface = this.surface.at(x1, y2);
                surface.terrace = Math.floor(surface.height / this._terraceSpacing);
                surface.shape = TerrainShape.Flat;
                surface.type = this.config.floor;
                console.assert(surface.terrace <= this.config.numTerraces && surface.terrace >= 0, "terrace out of range:", surface.terrace);
            }
        }
    }
    get config() {
        return this._config;
    }
    get surface() {
        return this._surface;
    }
    get terraceSpacing() {
        return this._terraceSpacing;
    }
    hasFeature(x, y, feature) {
        console.assert(x >= 0 && x < this.surface.width && y >= 0 && y < this.surface.depth);
        return (this.surface.at(x, y).features & feature) != 0;
    }
    terrainTypeAt(x, y) {
        console.assert(x >= 0 && x < this.surface.width && y >= 0 && y < this.surface.depth);
        return this.surface.at(x, y).type;
    }
    terrainShapeAt(x, y) {
        console.assert(x >= 0 && x < this.surface.width && y >= 0 && y < this.surface.depth);
        return this.surface.at(x, y).shape;
    }
    moistureAt(x, y) {
        console.assert(x >= 0 && x < this.surface.width && y >= 0 && y < this.surface.depth);
        return this.surface.at(x, y).moisture;
    }
    isFlatAt(x, y) {
        console.assert(x >= 0 && x < this.surface.width && y >= 0 && y < this.surface.depth);
        return Terrain.isFlat(this.surface.at(x, y).shape);
    }
    biomeAt(x, y) {
        console.assert(x >= 0 && x < this.surface.width && y >= 0 && y < this.surface.depth);
        return this.surface.at(x, y).biome;
    }
    relativeHeightAt(x, y) {
        console.assert(x >= 0 && x < this.surface.width && y >= 0 && y < this.surface.depth);
        return this.surface.at(x, y).terrace;
    }
    generateMap(context) {
        if (this.config.ramps) {
            this.setShapes();
        }
        if (this.config.rainfall > 0) {
            this.addRain(this.config.rainDirection, this.config.rainfall, this.config.waterLine);
        }
        if (this.config.biomes || this.config.hasWater) {
            this.setBiomes();
        }
        this.setEdges();
        this.setFeatures();
        const grid = new TerrainGrid(context, this.surface.width, this.surface.depth);
        for(let y = 0; y < this.surface.depth; y++){
            for(let x = 0; x < this.surface.width; x++){
                const surface = this.surface.at(x, y);
                console.assert(surface.terrace <= this.config.numTerraces && surface.terrace >= 0, "terrace out-of-range", surface.terrace);
                grid.addSurfaceTerrain(x, y, surface.terrace, surface.type, surface.shape, surface.features);
            }
        }
        for(let y1 = 0; y1 < this.surface.depth; y1++){
            for(let x1 = 0; x1 < this.surface.width; x1++){
                let z = this.surface.at(x1, y1).terrace;
                const zStop = z - this.calcRelativeHeight(x1, y1);
                const terrain = grid.getSurfaceTerrainAt(x1, y1);
                if (terrain == null) {
                    console.error("didn't find terrain in map at", x1, y1, z);
                }
                const shape = Terrain.isFlat(terrain.shape) ? terrain.shape : TerrainShape.Flat;
                while(z > zStop){
                    z--;
                    grid.addSubSurfaceTerrain(x1, y1, z, terrain.type, shape);
                }
            }
        }
    }
    setShapes() {
        const coordOffsets = [
            new Point2D(0, 1),
            new Point2D(-1, 0),
            new Point2D(0, -1),
            new Point2D(1, 0)
        ];
        const ramps = [
            TerrainShape.RampUpSouth,
            TerrainShape.RampUpWest,
            TerrainShape.RampUpNorth,
            TerrainShape.RampUpEast
        ];
        let totalRamps = 0;
        for(let y = this.surface.depth - 3; y > 1; y--){
            for(let x = 2; x < this.surface.width - 2; x++){
                const centre = this.surface.at(x, y);
                if (!Terrain.isFlat(centre.shape)) {
                    continue;
                }
                const roundUpHeight = centre.height + this.terraceSpacing / 2;
                if (roundUpHeight != (centre.terrace + 1) * this.terraceSpacing) {
                    continue;
                }
                for(const i in coordOffsets){
                    const offset = coordOffsets[i];
                    const neighbour = this.surface.at(centre.x + offset.x, centre.y + offset.y);
                    const nextNeighbour = this.surface.at(neighbour.x + offset.x, neighbour.y + offset.y);
                    if (!neighbour.fixed && !nextNeighbour.fixed && neighbour.terrace == centre.terrace + 1 && neighbour.terrace == nextNeighbour.terrace) {
                        neighbour.shape = ramps[i];
                        neighbour.fixed = true;
                        nextNeighbour.fixed = true;
                        totalRamps++;
                    }
                }
            }
        }
    }
    setEdges() {
        for(let y = 0; y < this.surface.depth; y++){
            for(let x = 0; x < this.surface.width; x++){
                const centre = this.surface.at(x, y);
                if (centre.type == TerrainType.Water) {
                    continue;
                }
                const neighbours = this.surface.getNeighbours(x, y);
                let shapeType = centre.shape;
                let northEdge = false;
                let eastEdge = false;
                let southEdge = false;
                let westEdge = false;
                for (const neighbour of neighbours){
                    if (neighbour.terrace > centre.terrace) {
                        continue;
                    }
                    if (neighbour.x != centre.x && neighbour.y != centre.y) {
                        continue;
                    }
                    if (neighbour.terrace == centre.terrace && Terrain.isFlat(centre.shape) == Terrain.isFlat(neighbour.shape)) {
                        continue;
                    }
                    northEdge = northEdge || neighbour.y < centre.y;
                    southEdge = southEdge || neighbour.y > centre.y;
                    eastEdge = eastEdge || neighbour.x > centre.x;
                    westEdge = westEdge || neighbour.x < centre.x;
                    if (northEdge && eastEdge && southEdge && westEdge) break;
                }
                if (shapeType == TerrainShape.Flat) {
                    if (northEdge && eastEdge && southEdge && westEdge) {
                        shapeType = TerrainShape.FlatAloneOut;
                    } else if (northEdge && eastEdge && westEdge) {
                        shapeType = TerrainShape.FlatNorthOut;
                    } else if (northEdge && eastEdge && southEdge) {
                        shapeType = TerrainShape.FlatEastOut;
                    } else if (eastEdge && southEdge && westEdge) {
                        shapeType = TerrainShape.FlatSouthOut;
                    } else if (southEdge && westEdge && northEdge) {
                        shapeType = TerrainShape.FlatWestOut;
                    } else if (northEdge && eastEdge) {
                        shapeType = TerrainShape.FlatNorthEast;
                    } else if (northEdge && westEdge) {
                        shapeType = TerrainShape.FlatNorthWest;
                    } else if (northEdge) {
                        shapeType = TerrainShape.FlatNorth;
                    } else if (southEdge && eastEdge) {
                        shapeType = TerrainShape.FlatSouthEast;
                    } else if (southEdge && westEdge) {
                        shapeType = TerrainShape.FlatSouthWest;
                    } else if (southEdge) {
                        shapeType = TerrainShape.FlatSouth;
                    } else if (eastEdge) {
                        shapeType = TerrainShape.FlatEast;
                    } else if (westEdge) {
                        shapeType = TerrainShape.FlatWest;
                    }
                } else if (shapeType == TerrainShape.RampUpNorth && eastEdge) {
                    if (Terrain.isSupportedShape(centre.type, TerrainShape.RampUpNorthEdge)) {
                        shapeType = TerrainShape.RampUpNorthEdge;
                    }
                } else if (shapeType == TerrainShape.RampUpEast && northEdge) {
                    if (Terrain.isSupportedShape(centre.type, TerrainShape.RampUpEastEdge)) {
                        shapeType = TerrainShape.RampUpEastEdge;
                    }
                } else if (shapeType == TerrainShape.RampUpSouth && eastEdge) {
                    if (Terrain.isSupportedShape(centre.type, TerrainShape.RampUpSouthEdge)) {
                        shapeType = TerrainShape.RampUpSouthEdge;
                    }
                } else if (shapeType == TerrainShape.RampUpWest && northEdge) {
                    if (Terrain.isSupportedShape(centre.type, TerrainShape.RampUpWestEdge)) {
                        shapeType = TerrainShape.RampUpWestEdge;
                    }
                }
                if (centre.terrace > 0 && shapeType == TerrainShape.Flat && neighbours.length != 8) {
                    shapeType = TerrainShape.Wall;
                }
                if (Terrain.isFlat(shapeType) && Terrain.isEdge(shapeType)) {
                    if (!this.config.biomes) {
                        centre.type = this.config.wall;
                    }
                    if (!Terrain.isSupportedShape(centre.type, shapeType)) {
                        switch(shapeType){
                            default:
                                shapeType = TerrainShape.Wall;
                                break;
                            case TerrainShape.FlatNorthOut:
                                if (Terrain.isSupportedShape(centre.type, TerrainShape.FlatNorth)) {
                                    shapeType = TerrainShape.FlatNorth;
                                } else {
                                    shapeType = TerrainShape.Wall;
                                }
                                break;
                            case TerrainShape.FlatNorthEast:
                            case TerrainShape.FlatSouthEast:
                                if (Terrain.isSupportedShape(centre.type, TerrainShape.FlatEast)) {
                                    shapeType = TerrainShape.FlatEast;
                                } else {
                                    shapeType = TerrainShape.Wall;
                                }
                                break;
                            case TerrainShape.FlatNorthWest:
                                if (Terrain.isSupportedShape(centre.type, TerrainShape.FlatWestOut)) {
                                    shapeType = TerrainShape.FlatWestOut;
                                } else {
                                    shapeType = TerrainShape.Wall;
                                }
                                break;
                            case TerrainShape.FlatSouthWest:
                                if (Terrain.isSupportedShape(centre.type, TerrainShape.FlatWest)) {
                                    shapeType = TerrainShape.FlatWest;
                                } else {
                                    shapeType = TerrainShape.Wall;
                                }
                                break;
                        }
                    }
                }
                if (!Terrain.isFlat(shapeType) && !Terrain.isSupportedShape(centre.type, shapeType)) {
                    if (Terrain.isSupportedShape(this.config.floor, shapeType)) {
                        centre.type = this.config.floor;
                    } else if (Terrain.isSupportedShape(this.config.wall, shapeType)) {
                        centre.type = this.config.wall;
                    }
                }
                if (!Terrain.isSupportedShape(centre.type, shapeType)) {
                    shapeType = TerrainShape.Flat;
                }
                centre.shape = shapeType;
            }
        }
    }
    calcRelativeHeight(x, y) {
        const neighbours = this.surface.getNeighbours(x, y);
        let relativeHeight = 0;
        const centre = this.surface.at(x, y);
        for (const neighbour of neighbours){
            console.assert(neighbour.terrace >= 0, "Found neighbour with negative terrace!", neighbour.terrace);
            const height = centre.terrace - neighbour.terrace;
            relativeHeight = Math.max(height, relativeHeight);
        }
        console.assert(relativeHeight <= this.config.numTerraces, "impossible relative height:", relativeHeight, "\ncentre:", centre);
        return relativeHeight;
    }
    addRain(towards, water, waterLine) {
        const rain = new Rain(this.surface, waterLine, water, towards);
        rain.run();
        const blurred = gaussianBlur(rain.moistureGrid, this.surface.width, this.surface.depth);
        for(let y = 0; y < this.surface.depth; y++){
            for(let x = 0; x < this.surface.width; x++){
                const surface = this.surface.at(x, y);
                surface.moisture = blurred[y][x];
            }
        }
    }
    setBiomes() {
        for(let y = 0; y < this.surface.depth; y++){
            for(let x = 0; x < this.surface.width; x++){
                const surface = this.surface.at(x, y);
                let biome = Biome.Water;
                let terrain = TerrainType.Water;
                const moisturePercent = Math.min(1, surface.moisture / 6);
                const moistureScaled = Math.floor(5 * moisturePercent);
                if (surface.height <= this.config.waterLine) {
                    biome = Biome.Water;
                    terrain = TerrainType.Water;
                } else if (surface.height >= this.config.uplandThreshold) {
                    console.log("height, threshold", surface.height, this.config.uplandThreshold);
                    switch(moistureScaled){
                        default:
                            console.error('unhandled moisture scale');
                            break;
                        case 0:
                            biome = Biome.Rock;
                            terrain = TerrainType.Upland0;
                            break;
                        case 1:
                            biome = Biome.Tundra;
                            terrain = TerrainType.Upland1;
                            break;
                        case 2:
                            biome = Biome.AlpineGrassland;
                            terrain = TerrainType.Upland2;
                            break;
                        case 3:
                            biome = Biome.AlpineMeadow;
                            terrain = TerrainType.Upland3;
                            break;
                        case 4:
                            biome = Biome.AlpineForest;
                            terrain = TerrainType.Upland4;
                            break;
                        case 5:
                            biome = Biome.Taiga;
                            terrain = TerrainType.Upland5;
                            break;
                    }
                } else {
                    switch(moistureScaled){
                        default:
                            console.error('unhandled moisture scale');
                            break;
                        case 0:
                            biome = Biome.Desert;
                            terrain = TerrainType.Lowland0;
                            break;
                        case 1:
                            biome = Biome.Grassland;
                            terrain = TerrainType.Lowland1;
                            break;
                        case 2:
                            biome = Biome.Shrubland;
                            terrain = TerrainType.Lowland2;
                            break;
                        case 3:
                            biome = Biome.MoistForest;
                            terrain = TerrainType.Lowland3;
                            break;
                        case 4:
                            biome = Biome.WetForest;
                            terrain = TerrainType.Lowland4;
                            break;
                        case 5:
                            biome = Biome.RainForest;
                            terrain = TerrainType.Lowland5;
                            break;
                    }
                }
                if (Terrain.isSupportedType(terrain)) {
                    surface.type = terrain;
                } else {
                    console.log("unsupported biome terrain type:", Terrain.getTypeName(terrain));
                }
                surface.biome = biome;
            }
        }
    }
    setFeatures() {
        for(let y = 0; y < this.surface.depth; y++){
            for(let x = 0; x < this.surface.width; x++){
                const surface = this.surface.at(x, y);
                if (Terrain.isFlat(surface.shape)) {
                    const neighbours = this.surface.getNeighbours(surface.x, surface.y);
                    for (const neighbour of neighbours){
                        if (neighbour.biome != Biome.Water) {
                            continue;
                        }
                        switch(Navigation.getDirectionFromPoints(surface.pos, neighbour.pos)){
                            default:
                                break;
                            case Direction.North:
                                surface.features |= TerrainFeature.ShorelineNorth;
                                break;
                            case Direction.East:
                                surface.features |= TerrainFeature.ShorelineEast;
                                break;
                            case Direction.South:
                                surface.features |= TerrainFeature.ShorelineSouth;
                                break;
                            case Direction.West:
                                surface.features |= TerrainFeature.ShorelineWest;
                                break;
                        }
                    }
                    if (surface.biome == Biome.Grassland) {
                        surface.features |= TerrainFeature.DryGrass;
                    } else if (surface.biome == Biome.Tundra) {
                        surface.features |= TerrainFeature.DryGrass;
                    }
                }
            }
        }
    }
    _config;
}
export { Biome as Biome };
export { getBiomeName as getBiomeName };
export { Surface as Surface };
export { TerrainBuilderConfig as TerrainBuilderConfig };
export { TerrainBuilder as TerrainBuilder };
class OctNode {
    static MaxEntities = 30;
    _children;
    _entities;
    get children() {
        return this._children;
    }
    get entities() {
        return this._entities;
    }
    get bounds() {
        return this._bounds;
    }
    get centre() {
        return this._bounds.centre;
    }
    get width() {
        return this._bounds.width;
    }
    get height() {
        return this._bounds.height;
    }
    get depth() {
        return this._bounds.depth;
    }
    get recursiveCountNumEntities() {
        if (this.entities.length != 0) {
            return this.entities.length;
        }
        let total = 0;
        for (let child of this.children){
            total += child.recursiveCountNumEntities;
        }
        return total;
    }
    constructor(_bounds){
        this._bounds = _bounds;
        this._children = new Array();
        this._entities = new Array();
    }
    insert(entity) {
        let inserted = false;
        if (this.children.length == 0) {
            this.entities.push(entity);
            this.bounds.insert(entity.bounds);
            if (this.entities.length > OctNode.MaxEntities) {
                inserted = this.split();
            } else {
                inserted = true;
            }
        } else {
            for (let child of this.children){
                if (child.bounds.containsBounds(entity.bounds)) {
                    inserted = child.insert(entity);
                    break;
                }
            }
            if (!inserted) {
                for (let child1 of this.children){
                    if (child1.containsLocation(entity.centre)) {
                        inserted = child1.insert(entity);
                        break;
                    }
                }
            }
        }
        console.assert(inserted, "failed to insert entity into octree node");
        return inserted;
    }
    split() {
        this._children = new Array();
        const width = this.bounds.width / 2;
        const depth = this.bounds.depth / 2;
        const height = this.bounds.height / 2;
        const dimensions = new Dimensions(width, depth, height);
        const offset = [
            -0.5,
            0.5
        ];
        for(let z = 0; z < 2; z++){
            for(let y = 0; y < 2; y++){
                for(let x = 0; x < 2; x++){
                    let offsetX = offset[x] * dimensions.width;
                    let offsetY = offset[y] * dimensions.depth;
                    let offsetZ = offset[z] * dimensions.height;
                    let centre = new Point3D(this.centre.x + offsetX, this.centre.y + offsetY, this.centre.z + offsetZ);
                    let bounds = new BoundingCuboid(centre, dimensions);
                    this.children.push(new OctNode(bounds));
                }
            }
        }
        const insertIntoChild = function(child, entity) {
            if (child.containsLocation(entity.bounds.centre)) {
                return child.insert(entity);
            }
            return false;
        };
        for (let entity of this._entities){
            let inserted = false;
            for (let child of this._children){
                if (insertIntoChild(child, entity)) {
                    inserted = true;
                    break;
                }
            }
            console.assert(inserted, "failed to insert into children, entity centred at:", entity.bounds.centre);
        }
        this._entities = [];
        return true;
    }
    containsBounds(bounds) {
        return this.bounds.containsBounds(bounds);
    }
    containsLocation(location) {
        return this.bounds.contains(location);
    }
    containsEntity(entity) {
        return this.entities.indexOf(entity) != -1;
    }
    recursivelyContainsEntity(entity) {
        if (this.containsEntity(entity)) {
            return true;
        }
        for (let child of this._children){
            if (child.recursivelyContainsEntity(entity)) {
                return true;
            }
        }
        return false;
    }
    recursiveRemoveEntity(entity) {
        const idx = this.entities.indexOf(entity);
        if (idx != -1) {
            this.entities.splice(idx, 1);
            return true;
        }
        for (let child of this.children){
            if (child.recursiveRemoveEntity(entity)) {
                return true;
            }
        }
        return false;
    }
    _bounds;
}
class Octree {
    _root;
    _numEntities = 0;
    _worldBounds;
    constructor(dimensions){
        let x = dimensions.width / 2;
        let y = dimensions.depth / 2;
        let z = dimensions.height / 2;
        let centre = new Point3D(x, y, z);
        this._worldBounds = new BoundingCuboid(centre, dimensions);
        this._root = new OctNode(this._worldBounds);
    }
    get root() {
        return this._root;
    }
    get bounds() {
        return this.root.bounds;
    }
    insert(entity) {
        let inserted = this._root.insert(entity);
        console.assert(inserted, "failed to insert");
        this._numEntities++;
    }
    findEntitiesInArea(root, area, entities) {
        if (root.entities.length != 0) {
            root.entities.forEach((entity)=>entities.push(entity));
        } else {
            for (let child of root.children){
                if (!child.bounds.intersects(area)) {
                    continue;
                }
                this.findEntitiesInArea(child, area, entities);
            }
        }
    }
    getEntities(area) {
        let entities = new Array();
        this.findEntitiesInArea(this.root, area, entities);
        return entities;
    }
    update(entity) {
        const removed = this.root.recursiveRemoveEntity(entity);
        console.assert(removed);
        this._numEntities--;
        this.insert(entity);
    }
    verify(entities) {
        for (let entity of entities){
            if (!this._root.recursivelyContainsEntity(entity)) {
                console.error("tree doesn't contain entity at (x,y,z):", entity.x, entity.y, entity.z);
                return false;
            }
        }
        return true;
    }
}
class ContextImpl {
    _scene;
    _entities = new Array();
    _updateables = new Array();
    _movables = new Array();
    _controllers = new Array();
    _spatialGraph;
    _totalEntities = 0;
    static reset() {
        PhysicalEntity.reset();
        Terrain.reset();
        SpriteSheet.reset();
    }
    constructor(worldDims){
        this._spatialGraph = new Octree(worldDims);
        CollisionDetector.init(this._spatialGraph);
    }
    get scene() {
        return this._scene;
    }
    set scene(s) {
        this._scene = s;
    }
    get entities() {
        return this._entities;
    }
    get bounds() {
        return this._spatialGraph.bounds;
    }
    get spatial() {
        return this._spatialGraph;
    }
    get controllers() {
        return this._controllers;
    }
    verify() {
        return this.entities.length == PhysicalEntity.getNumEntities() && this.entities.length == this._totalEntities && this.spatial.verify(this.entities) && this.scene.verifyRenderer(this.entities);
    }
    addOnscreenRenderer(canvas, perspective) {
        switch(perspective){
            default:
                console.error("unhandled perspective");
                break;
            case Perspective.TrueIsometric:
                this.scene = new OnscreenSceneRenderer(canvas, new TrueIsometric());
                break;
            case Perspective.TwoByOneIsometric:
                this.scene = new OnscreenSceneRenderer(canvas, new TwoByOneIsometric());
                break;
        }
        this.entities.forEach((entity)=>this.scene.insertEntity(entity));
        this._movables.forEach((entity)=>entity.addEventListener(EntityEvent.Moving, ()=>{
                this.spatial.update(entity);
                this.scene.updateEntity(entity);
            }));
    }
    addOffscreenRenderer(perspective) {
        switch(perspective){
            default:
                console.error("unhandled perspective");
                break;
            case Perspective.TrueIsometric:
                this.scene = new OffscreenSceneRenderer(new TrueIsometric());
                break;
            case Perspective.TwoByOneIsometric:
                this.scene = new OffscreenSceneRenderer(new TwoByOneIsometric());
                break;
        }
        this.entities.forEach((entity)=>this.scene.insertEntity(entity));
        this._movables.forEach((entity)=>entity.addEventListener(EntityEvent.Moving, ()=>{
                this.spatial.update(entity);
                this.scene.updateEntity(entity);
            }));
    }
    addController(controller) {
        this._controllers.push(controller);
    }
    addEntity(entity) {
        if (this.entities.length == 0) {
            if (entity.id != 0) {
                console.error("Adding entity with unexpected id:", entity.id);
            }
        } else if (this.entities.length > 0) {
            if (entity.id != this.entities[this.entities.length - 1].id + 1) {
                console.error("Adding entity with unexpected id:", entity.id);
            }
        }
        this.entities.push(entity);
        this.spatial.insert(entity);
        this.scene.insertEntity(entity);
        this._totalEntities++;
    }
    addUpdateableEntity(entity) {
        this._updateables.push(entity);
    }
    addMovableEntity(entity) {
        this._movables.push(entity);
        entity.addEventListener(EntityEvent.Moving, ()=>{
            this.spatial.update(entity);
            this.scene.updateEntity(entity);
        });
    }
    update(camera) {
        camera.update();
        this._scene.render(camera, false);
        Gravity.update(this._movables);
        this._updateables.forEach((entity)=>{
            entity.update();
        });
        this._controllers.forEach((controller)=>{
            controller.update();
        });
    }
}
function createContext(canvas, worldDims, perspective) {
    const context = new ContextImpl(worldDims);
    context.addOnscreenRenderer(canvas, perspective);
    return context;
}
function createTestContext(worldDims, perspective) {
    ContextImpl.reset();
    const context = new ContextImpl(worldDims);
    context.addOffscreenRenderer(perspective);
    return context;
}
export { ContextImpl as ContextImpl };
export { createContext as createContext };
export { createTestContext as createTestContext };
class Camera {
    _lowerX;
    _lowerY;
    _upperX;
    _upperY;
    _width;
    _height;
    _handler;
    _surfaceLocation;
    constructor(_scene, width, height){
        this._scene = _scene;
        this._lowerX = 0;
        this._lowerY = 0;
        this._handler = new EventHandler();
        this._width = Math.floor(width);
        this._height = Math.floor(height);
        this._upperX = Math.floor(width);
        this._upperY = Math.floor(height);
        this._surfaceLocation = _scene.getLocationAt(this._lowerX, this._lowerY, this);
    }
    isOnScreen(coord, width, depth) {
        if (coord.x + width < this._lowerX || coord.y + depth < this._lowerY || coord.x - width > this._upperX || coord.y - depth > this._upperY) {
            return false;
        }
        return true;
    }
    get min() {
        return new Point2D(this._lowerX, this._lowerY);
    }
    get max() {
        return new Point2D(this._upperX, this._upperY);
    }
    get width() {
        return this._width;
    }
    get height() {
        return this._height;
    }
    get location() {
        return this._surfaceLocation;
    }
    set location(newLocation) {
        if (newLocation == undefined) {
            console.log("undefined camera surface location");
            return;
        }
        const newPoint = this._scene.graph.getDrawCoord(newLocation);
        this.x = newPoint.x;
        this.y = newPoint.y;
        this._handler.post(InputEvent.CameraMove);
        this._surfaceLocation = newLocation;
    }
    set x(x) {
        this._lowerX = x - Math.floor(this.width / 2);
        this._upperX = x + Math.floor(this.width / 2);
    }
    set y(y) {
        this._lowerY = y - Math.floor(this.height / 2);
        this._upperY = y + Math.floor(this.height / 2);
    }
    getDrawCoord(coord) {
        return new Point2D(coord.x - this._lowerX, coord.y - this._lowerY);
    }
    update() {
        this._handler.service();
    }
    addEventListener(event, callback) {
        this._handler.addEventListener(event, callback);
    }
    removeEventListener(event, callback) {
        this._handler.removeEventListener(event, callback);
    }
    _scene;
}
class MouseCamera extends Camera {
    constructor(scene, canvas, width, height){
        super(scene, width, height);
        canvas.addEventListener('mousedown', (e)=>{
            if (e.button == 0) {
                this.location = scene.getLocationAt(e.offsetX, e.offsetY, this);
            }
        });
        canvas.addEventListener('touchstart', (e)=>{
            const touch = e.touches[0];
            this.location = scene.getLocationAt(touch.pageX, touch.pageY, this);
        });
    }
}
class TrackerCamera extends Camera {
    constructor(scene, width, height, movable){
        super(scene, width, height);
        this.location = movable.centre;
        movable.addEventListener(EntityEvent.Moving, ()=>{
            this.location = movable.centre;
        });
    }
}
export { Camera as Camera };
export { MouseCamera as MouseCamera };
export { TrackerCamera as TrackerCamera };
class Action {
    constructor(_actor){
        this._actor = _actor;
    }
    get actor() {
        return this._actor;
    }
    set actor(actor) {
        this._actor = actor;
    }
    _actor;
}
class MoveAction extends Action {
    constructor(actor){
        super(actor);
    }
    obstructed(from, to) {
        const bounds = this._actor.bounds;
        const path = to.vec_diff(from);
        const area = new BoundingCuboid(to, bounds.dimensions);
        area.insert(bounds);
        return CollisionDetector.detectInArea(this._actor, path, area);
    }
    perform() {
        return true;
    }
}
class MoveDirection extends MoveAction {
    constructor(actor, _d, _bounds){
        super(actor);
        this._d = _d;
        this._bounds = _bounds;
    }
    perform() {
        const currentPos = this.actor.bounds.bottomCentre;
        const nextPos = currentPos.add(this._d);
        const obstruction = this.obstructed(currentPos, nextPos);
        if (obstruction == null) {
            this.actor.updatePosition(this._d);
            return false;
        }
        if (obstruction.blocking) {
            this.actor.postEvent(EntityEvent.EndMove);
            return true;
        }
        console.log("adjusting movement with max angle");
        this.actor.updatePosition(this._d);
        return false;
    }
    _d;
    _bounds;
}
class MoveDestination extends MoveAction {
    _d;
    constructor(actor, _step, _destination){
        super(actor);
        this._step = _step;
        this._destination = _destination;
        this.destination = _destination;
    }
    set speed(speed) {
        this._step = speed;
    }
    get destination() {
        return this._destination;
    }
    set destination(destination) {
        this._destination = destination;
        const currentPos = this.actor.bounds.minLocation;
        const maxD = destination.vec_diff(currentPos);
        console.assert(maxD.x == 0 || maxD.y == 0 || maxD.z == 0, "can only change distance along two axes simultaneously");
        let dx = 0;
        let dy = 0;
        let dz = 0;
        if (maxD.x == 0 && maxD.y == 0 && maxD.z == 0) {
            return;
        } else if (maxD.x == 0 && maxD.z == 0) {
            dx = 0;
            dy = this._step;
            dz = 0;
        } else if (maxD.y == 0 && maxD.z == 0) {
            dy = 0;
            dx = this._step;
            dz = 0;
        } else if (maxD.x == 0 && maxD.y == 0) {
            dx = 0;
            dy = 0;
            dz = this._step;
        } else {
            let adjacent = 0;
            let opposite = 0;
            if (maxD.z == 0) {
                adjacent = maxD.y > 0 ? maxD.y : maxD.x;
                opposite = maxD.y > 0 ? maxD.x : maxD.y;
            } else if (maxD.x == 0) {
                adjacent = maxD.z > 0 ? maxD.y : maxD.z;
                opposite = maxD.z > 0 ? maxD.z : maxD.y;
            } else if (maxD.y == 0) {
                adjacent = maxD.z > 0 ? maxD.x : maxD.z;
                opposite = maxD.z > 0 ? maxD.z : maxD.x;
            }
            const theta = Math.atan(opposite / adjacent) * 180 / Math.PI;
            const oppDiff = Math.sin(theta) * this._step;
            const adjDiff = Math.cos(theta) * this._step;
            if (maxD.z == 0) {
                dx = adjacent == maxD.y ? oppDiff : adjDiff;
                dy = adjacent == maxD.y ? adjDiff : oppDiff;
            } else if (maxD.x == 0) {
                dz = adjacent == maxD.y ? oppDiff : adjDiff;
                dy = adjacent == maxD.y ? adjDiff : oppDiff;
            } else if (maxD.y == 0) {
                dx = adjacent == maxD.z ? oppDiff : adjDiff;
                dz = adjacent == maxD.z ? adjDiff : oppDiff;
            }
        }
        this._d = new Vector3D(dx, dy, dz);
    }
    perform() {
        console.log("perform action");
        const bounds = this.actor.bounds;
        const location = bounds.minLocation;
        const maxD = this.destination.vec_diff(location);
        const minD = maxD.absMin(this._d);
        this.actor.updatePosition(minD);
        this.actor.postEvent(EntityEvent.Moving);
        return bounds.minLocation.isSameAsRounded(this.destination);
    }
    _step;
    _destination;
}
class Navigate extends Action {
    _currentStep;
    _waypoints;
    _index;
    constructor(actor, _step, _destination){
        super(actor);
        this._step = _step;
        this._destination = _destination;
        this._index = 0;
        this._waypoints = this.findPath();
        if (this._waypoints.length != 0) {
            this._currentStep = new MoveDestination(actor, _step, this._waypoints[0]);
        }
    }
    perform() {
        if (this._waypoints.length == 0) {
            return true;
        }
        const finishedStep = this._currentStep.perform();
        if (!finishedStep) {
            return false;
        }
        if (!this._currentStep.destination.isSameAsRounded(this._actor.bounds.minLocation)) {
            this._waypoints = this.findPath();
            if (this._waypoints.length != 0) {
                this._index = 0;
                this._currentStep = new MoveDestination(this._actor, this._step, this._waypoints[0]);
                return false;
            }
            return true;
        }
        this._index++;
        if (this._index == this._waypoints.length) {
            return true;
        }
        const nextLocation = this._waypoints[this._index];
        this._currentStep = new MoveDestination(this._actor, this._step, nextLocation);
        return false;
    }
    findPath() {
        const path = new Array();
        return path;
    }
    _step;
    _destination;
}
export { Action as Action };
export { MoveDirection as MoveDirection };
export { MoveDestination as MoveDestination };
export { Navigate as Navigate };
class Sound {
    static _tracks = new Array();
    static _maxVolume = 0.8;
    _id;
    _track;
    static pause(id) {
        this._tracks[id].pause();
    }
    static play(id, volume) {
        if (volume > this._maxVolume) {
            volume = this._maxVolume;
        }
        let track = this._tracks[id];
        console.log("play music at:", volume);
        track.volume = volume;
        if (!track.playing) {
            track.play();
        }
    }
    constructor(name, loop){
        this._id = Sound._tracks.length;
        this._track = new Audio(name);
        console.assert(this._track != undefined, "failed to create audio");
        this._track.loop = loop;
        Sound._tracks.push(this);
    }
    set volume(volume) {
        this._track.volume = volume;
    }
    get playing() {
        return !this._track.paused && this._track.currentTime != 0;
    }
    pause() {
        this._track.pause();
    }
    play() {
        this._track.play();
    }
}
class ZonalAudioLoop extends Sound {
    constructor(name, area, scene, camera){
        super(name, true);
        let id = this._id;
        let maxDistance = Math.sqrt(Math.pow(area.maxX - area.minX, 2) + Math.pow(area.maxY - area.minY, 2) + Math.pow(area.maxZ - area.minZ, 2)) / 2;
        console.log("centre of audio zone (x,y):", area.centre.x, area.centre.y);
        console.log("max distance from centre:", maxDistance);
        let maybePlay = function() {
            let location = camera.location;
            if (location == undefined) {
                console.log("couldn't get camera location");
                return;
            }
            if (!area.contains(camera.location)) {
                console.log("camera location not inbounds");
                Sound.pause(id);
                return;
            }
            let dx = location.x - area.centre.x;
            let dy = location.y - area.centre.y;
            dx = Math.abs(dx / maxDistance);
            dy = Math.abs(dy / maxDistance);
            let volume = Sound._maxVolume * Math.exp(-8 * (dx + dy));
            Sound.play(id, volume);
        };
        camera.addEventListener(InputEvent.CameraMove, maybePlay);
        window.addEventListener("focus", maybePlay);
        window.addEventListener("blur", (event)=>{
            Sound.pause(id);
        });
    }
}
export { Sound as Sound };
export { ZonalAudioLoop as ZonalAudioLoop };
function getAllSegments(node) {
    let allSegments = new Array();
    node.topSegments.forEach((segment)=>allSegments.push(segment));
    node.baseSegments.forEach((segment)=>allSegments.push(segment));
    node.sideSegments.forEach((segment)=>allSegments.push(segment));
    return allSegments;
}
class MovableEntityDebug {
    constructor(movable, camera, debugCollision){
        if (debugCollision) {
            this.debugCollision(movable, camera);
        }
    }
    debugCollision(movable, camera) {
        const context = movable.context;
        movable.addEventListener(EntityEvent.Moving, function() {
            if (!CollisionDetector.hasMissInfo(movable)) {
                return;
            }
            let missedEntities = CollisionDetector.getMissInfo(movable);
            let scene = context.scene;
            const start = Date.now();
            scene.addTimedEvent(function() {
                if (scene.ctx != null) {
                    scene.ctx.strokeStyle = "Green";
                    for (let entity of missedEntities){
                        let sceneNode = scene.getNode(entity.id);
                        for (const segment of getAllSegments(sceneNode)){
                            scene.ctx.beginPath();
                            let drawP0 = camera.getDrawCoord(segment.p0);
                            let drawP1 = camera.getDrawCoord(segment.p1);
                            scene.ctx.moveTo(drawP0.x, drawP0.y);
                            scene.ctx.lineTo(drawP1.x, drawP1.y);
                            scene.ctx.stroke();
                        }
                    }
                }
                return Date.now() > start + 1000;
            });
        });
        movable.addEventListener(EntityEvent.Collision, function() {
            console.log("collision detected");
            if (!CollisionDetector.hasCollideInfo(movable)) {
                console.log("but no info available");
                return;
            }
            const collisionInfo = CollisionDetector.getCollideInfo(movable);
            const intersectInfo = collisionInfo.intersectInfo;
            const collidedEntity = collisionInfo.entity;
            const collidedFace = intersectInfo.face;
            let scene = context.scene;
            const start = Date.now();
            scene.addTimedEvent(function() {
                if (scene.ctx != null) {
                    let ctx = scene.ctx;
                    ctx.strokeStyle = "Green";
                    for (const segment of getAllSegments(scene.getNode(movable.id))){
                        ctx.beginPath();
                        let drawP0 = camera.getDrawCoord(segment.p0);
                        let drawP1 = camera.getDrawCoord(segment.p1);
                        ctx.moveTo(drawP0.x, drawP0.y);
                        ctx.lineTo(drawP1.x, drawP1.y);
                        ctx.stroke();
                    }
                    ctx.strokeStyle = "Orange";
                    for (const segment1 of getAllSegments(scene.getNode(collidedEntity.id))){
                        ctx.beginPath();
                        let drawP01 = camera.getDrawCoord(segment1.p0);
                        let drawP11 = camera.getDrawCoord(segment1.p1);
                        ctx.moveTo(drawP01.x, drawP01.y);
                        ctx.lineTo(drawP11.x, drawP11.y);
                        ctx.stroke();
                    }
                    ctx.strokeStyle = "Red";
                    ctx.fillStyle = "Red";
                    for (let vertex of collidedFace.vertices()){
                        ctx.beginPath();
                        let p0 = camera.getDrawCoord(scene.graph.getDrawCoord(vertex.point));
                        let p1 = camera.getDrawCoord(scene.graph.getDrawCoord(vertex.point.add(vertex.u)));
                        let p2 = camera.getDrawCoord(scene.graph.getDrawCoord(vertex.point.add(vertex.v)));
                        ctx.beginPath();
                        ctx.moveTo(p0.x, p0.y);
                        ctx.lineTo(p1.x, p1.y);
                        ctx.lineTo(p2.x, p2.y);
                        ctx.closePath();
                        ctx.stroke();
                        ctx.fill();
                    }
                }
                return Date.now() > start + 1000;
            });
            CollisionDetector.removeInfo(movable);
        });
    }
}
export { MovableEntityDebug as MovableEntityDebug };
