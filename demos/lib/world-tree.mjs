var __async = (__this, __arguments, generator) => {
  return new Promise((resolve, reject) => {
    var fulfilled = (value) => {
      try {
        step(generator.next(value));
      } catch (e) {
        reject(e);
      }
    };
    var rejected = (value) => {
      try {
        step(generator.throw(value));
      } catch (e) {
        reject(e);
      }
    };
    var step = (x) => x.done ? resolve(x.value) : Promise.resolve(x.value).then(fulfilled, rejected);
    step((generator = generator.apply(__this, __arguments)).next());
  });
};

// src/render.ts
var DrawElementList = class {
  constructor(_buffer, _length) {
    this._buffer = _buffer;
    this._length = _length;
  }
  get buffer() {
    return this._buffer;
  }
  get length() {
    return this._length;
  }
};
var DummyRenderer = class {
  addBitmap(id, bitmap) {
  }
  draw(elements) {
  }
};
var OffscreenRenderer = class {
  constructor(_width, _height) {
    this._width = _width;
    this._height = _height;
    this._bitmaps = new Array();
    this._canvas = new OffscreenCanvas(_width, _height);
    this._ctx = this._canvas.getContext("2d");
  }
  get bitmaps() {
    return this._bitmaps;
  }
  addBitmap(id, bitmap) {
    if (id >= this.bitmaps.length) {
      this.bitmaps.length = id + 1;
    }
    this.bitmaps[id] = bitmap;
  }
  draw(elements) {
    this._ctx.clearRect(0, 0, this._width, this._height);
    const buffer = elements.buffer;
    for (let i = 0; i < elements.length - 2; i += 3) {
      const spriteId = buffer[i];
      const x = buffer[i + 1];
      const y = buffer[i + 2];
      console.assert(spriteId < this.bitmaps.length, "bitmap length mismatch");
      this._ctx.drawImage(this.bitmaps[spriteId], x, y);
    }
  }
};
var OnscreenRenderer = class {
  constructor(_canvas) {
    this._canvas = _canvas;
    this._bitmaps = new Array();
    this._width = this.canvas.width;
    this._height = this.canvas.height;
    this._ctx = this.canvas.getContext("2d");
  }
  get width() {
    return this._width;
  }
  get height() {
    return this._height;
  }
  get canvas() {
    return this._canvas;
  }
  get ctx() {
    return this._ctx;
  }
  get bitmaps() {
    return this._bitmaps;
  }
  get worker() {
    return this._worker;
  }
  addBitmap(id, bitmap) {
    console.log("OnscreenRenderer::addBitmap");
    if (id >= this.bitmaps.length) {
      this.bitmaps.length = id + 1;
    }
    this.bitmaps[id] = bitmap;
  }
  draw(elements) {
    this.ctx.clearRect(0, 0, this.width, this.height);
    console.assert(elements.length % 3 == 0, "elements not mod 3");
    const buffer = elements.buffer;
    for (let i = 0; i < elements.length - 2; i += 3) {
      const spriteId = buffer[i];
      const x = buffer[i + 1];
      const y = buffer[i + 2];
      if (spriteId >= this.bitmaps.length)
        continue;
      console.assert(
        spriteId < this.bitmaps.length,
        "bitmap length mismatch",
        spriteId
      );
      this.ctx.drawImage(this.bitmaps[spriteId], x, y);
    }
  }
};

// src/geometry.ts
var Orientation = /* @__PURE__ */ ((Orientation2) => {
  Orientation2[Orientation2["Colinear"] = 0] = "Colinear";
  Orientation2[Orientation2["Clockwise"] = 1] = "Clockwise";
  Orientation2[Orientation2["CounterClockwise"] = 2] = "CounterClockwise";
  return Orientation2;
})(Orientation || {});
var Vector2D = class {
  constructor(_x, _y) {
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
    const x = this.x * other.y - other.x * this.y;
    const y = this.dot(other);
    return Math.atan2(x, y);
  }
};
var Point2D = class {
  constructor(_x, _y) {
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
      return 0 /* Colinear */;
    }
    return res > 0 ? 1 /* Clockwise */ : 2 /* CounterClockwise */;
  }
};
var Segment2D = class {
  constructor(_p0, _p1) {
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
    const p0 = this.p0.add(diff);
    const p1 = this.p1.add(diff);
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
    if (o1 == 0 /* Colinear */ && this.contains(other.p0)) {
      return true;
    }
    if (o2 == 0 /* Colinear */ && this.contains(other.p1)) {
      return true;
    }
    if (o3 == 0 /* Colinear */ && other.contains(this.p0)) {
      return true;
    }
    if (o4 == 0 /* Colinear */ && other.contains(this.p1)) {
      return true;
    }
    return false;
  }
  distance(p) {
    const vl = this.p0.x * this.p1.y - this.p1.x * this.p0.y;
    const w = this.p0.x * p.y - p.x * this.p0.y;
    const u = 1 / Math.sqrt(
      Math.pow(this.p1.x - this.p0.x, 2) + Math.pow(this.p1.y - this.p0.y, 2)
    );
    return vl * w * u;
  }
};
var Point3D = class {
  constructor(_x, _y, _z) {
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
};
var Vector3D = class {
  constructor(_x, _y, _z) {
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
    const x = this.cross(other).mag();
    const y = this.dot(other);
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
};
var Vertex3D = class {
  constructor(_point, a, b) {
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
  // http://www.geomalgorithms.com/a04-_planes.html#Distance-Point-to-Plane
  distance(p) {
    const sn = -this.normal.dot(p.vec_diff(this.point));
    const sd = this.normal.dot(this.normal);
    const sb = sn / sd;
    const closest = p.addScalar(sb).mul(this.normal);
    const d = p.vec_diff(closest).norm();
    return d;
  }
  // https://www.geomalgorithms.com/a05-_intersect-1.html
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
};
var Face3D = class {
  constructor(_vertex) {
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
};
var TriangleFace3D = class extends Face3D {
  constructor(vertex) {
    super(vertex);
    const u = this.vertex.u;
    const v = this.vertex.v;
    this._uDotv = u.dot(v);
    this._uDotu = u.dot(u);
    this._vDotv = v.dot(v);
    this._denominator = 1 / (Math.pow(this._uDotv, 2) - this._uDotu * this._vDotv);
  }
  vertices() {
    return [this.vertex];
  }
  transform(d) {
    this.vertex.transform(d);
  }
  // https://www.geomalgorithms.com/a06-_intersect-2.html
  intersects(i) {
    const w = i.vec_diff(this.vertex.point);
    const u = this.vertex.u;
    const v = this.vertex.v;
    const wDotv = w.dot(v);
    const wDotu = w.dot(u);
    const s1 = (this._uDotv * wDotv - this._vDotv * wDotu) * this._denominator;
    const t1 = (this._uDotv * wDotu - this._uDotu * wDotv) * this._denominator;
    return s1 >= 0 && t1 >= 0 && s1 + t1 <= 1;
  }
};
var QuadFace3D = class extends Face3D {
  constructor(vertexA, vertexB) {
    super(vertexA);
    if (!vertexA.normal.equal(vertexB.normal)) {
      throw "Expected QuadFace3D vertices to have equilavent normals";
    }
    this._triangleA = new TriangleFace3D(vertexA);
    this._triangleB = new TriangleFace3D(vertexB);
  }
  vertices() {
    return [this._triangleA.vertex, this._triangleB.vertex];
  }
  transform(d) {
    this._triangleA.transform(d);
    this._triangleB.transform(d);
  }
  intersects(i) {
    return this._triangleA.intersects(i) || this._triangleB.intersects(i);
  }
};
var IntersectInfo = class {
  constructor(_face, _begin, _end, _i, _theta) {
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
};
var Geometry = class {
  constructor(_bounds) {
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
    for (const face of this._faces) {
      face.transform(d);
    }
  }
  obstructs(begin, end) {
    for (const face of this._faces) {
      const i = face.intersectsPlane(begin, end);
      if (i != null && face.intersects(i)) {
        const v0 = i.vec_diff(begin);
        const v1 = face.plane.normal;
        const theta = v0.angle(v1);
        return new IntersectInfo(face, begin, end, i, theta);
      }
    }
    return null;
  }
};
var NoGeometry = class extends Geometry {
  constructor(bounds) {
    super(bounds);
    this._name = "NoGeometry";
  }
  obstructs(_begin, _end) {
    return null;
  }
};
var CuboidGeometry = class extends Geometry {
  constructor(bounds) {
    super(bounds);
    this._name = "CuboidGeometry";
    const p = [
      this.bounds.minLocation,
      // 0
      this.bounds.minLocation.add(this.heightVec3D),
      // 1
      this.bounds.minLocation.add(this.depthVec3D),
      // 2
      this.bounds.minLocation.add(this.widthVec3D),
      // 3
      this.bounds.maxLocation.sub(this.heightVec3D),
      // 4
      this.bounds.maxLocation.sub(this.depthVec3D),
      // 5
      this.bounds.maxLocation.sub(this.widthVec3D),
      // 6
      this.bounds.maxLocation
      // 7
    ];
    const v0 = new Vertex3D(p[2], p[6], p[0]);
    const v1 = new Vertex3D(p[1], p[0], p[6]);
    this._faces.push(new QuadFace3D(v0, v1));
    const v2 = new Vertex3D(p[4], p[7], p[2]);
    const v3 = new Vertex3D(p[6], p[2], p[7]);
    this._faces.push(new QuadFace3D(v2, v3));
    const v4 = new Vertex3D(p[3], p[5], p[4]);
    const v5 = new Vertex3D(p[7], p[4], p[5]);
    this._faces.push(new QuadFace3D(v4, v5));
    const v6 = new Vertex3D(p[5], p[1], p[7]);
    const v7 = new Vertex3D(p[6], p[7], p[1]);
    this._faces.push(new QuadFace3D(v6, v7));
    const v8 = new Vertex3D(p[0], p[3], p[2]);
    const v9 = new Vertex3D(p[4], p[2], p[3]);
    this._faces.push(new QuadFace3D(v8, v9));
    const v10 = new Vertex3D(p[0], p[1], p[3]);
    const v11 = new Vertex3D(p[5], p[3], p[1]);
    this._faces.push(new QuadFace3D(v10, v11));
  }
};
var RampUpWestGeometry = class extends Geometry {
  constructor(bounds) {
    super(bounds);
    this._name = "RampUpWestGeometry";
    const p = [
      this.bounds.minLocation,
      // 0
      this.bounds.minLocation.add(this.depthVec3D),
      // 1
      this.bounds.minLocation.add(this.widthVec3D),
      // 2
      this.bounds.maxLocation.sub(this.heightVec3D),
      // 3
      this.bounds.minLocation.add(this.heightVec3D),
      // 4
      this.bounds.maxLocation.sub(this.widthVec3D)
      // 5
    ];
    const v0 = new Vertex3D(p[1], p[5], p[0]);
    const v1 = new Vertex3D(p[4], p[0], p[5]);
    this._faces.push(new QuadFace3D(v0, v1));
    this._faces.push(new TriangleFace3D(new Vertex3D(p[1], p[3], p[5])));
    const v2 = new Vertex3D(p[2], p[4], p[3]);
    const v3 = new Vertex3D(p[5], p[3], p[4]);
    this._faces.push(new QuadFace3D(v2, v3));
    const v4 = new Vertex3D(p[3], p[1], p[2]);
    const v5 = new Vertex3D(p[0], p[2], p[1]);
    this._faces.push(new QuadFace3D(v4, v5));
    this._faces.push(new TriangleFace3D(new Vertex3D(p[0], p[4], p[2])));
  }
};
var RampUpEastGeometry = class extends Geometry {
  constructor(bounds) {
    super(bounds);
    this._name = "RampUpEastGeometry";
    const p = [
      this.bounds.minLocation,
      // 0
      this.bounds.minLocation.add(this.depthVec3D),
      // 1
      this.bounds.minLocation.add(this.widthVec3D),
      // 2
      this.bounds.maxLocation.sub(this.heightVec3D),
      // 3
      this.bounds.maxLocation.sub(this.depthVec3D),
      // 4
      this.bounds.maxLocation
      // 5
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
};
var RampUpNorthGeometry = class extends Geometry {
  constructor(bounds) {
    super(bounds);
    this._name = "RampUpNorthGeometry";
    const p = [
      this.bounds.minLocation,
      // 0
      this.bounds.minLocation.add(this.depthVec3D),
      // 1
      this.bounds.minLocation.add(this.heightVec3D),
      // 2
      this.bounds.maxLocation.sub(this.depthVec3D),
      // 3
      this.bounds.maxLocation.sub(this.heightVec3D),
      // 4
      this.bounds.minLocation.add(this.widthVec3D)
      // 5
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
};
var RampUpSouthGeometry = class extends Geometry {
  constructor(bounds) {
    super(bounds);
    this._name = "RampUpSouthGeometry";
    const p = [
      this.bounds.minLocation,
      // 0
      this.bounds.minLocation.add(this.depthVec3D),
      // 1
      this.bounds.maxLocation.sub(this.widthVec3D),
      // 2
      this.bounds.maxLocation,
      // 3
      this.bounds.maxLocation.sub(this.heightVec3D),
      // 4
      this.bounds.minLocation.add(this.widthVec3D)
      // 5
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
};

// src/events.ts
var EntityEvent = /* @__PURE__ */ ((EntityEvent2) => {
  EntityEvent2["Moving"] = "moving";
  EntityEvent2["EndMove"] = "endMove";
  EntityEvent2["FaceDirection"] = "faceDirection";
  EntityEvent2["Collision"] = "collision";
  EntityEvent2["NoCollision"] = "noCollision";
  return EntityEvent2;
})(EntityEvent || {});
var InputEvent = /* @__PURE__ */ ((InputEvent2) => {
  InputEvent2["CameraMove"] = "cameraMove";
  return InputEvent2;
})(InputEvent || {});
var EventHandler = class {
  constructor() {
    this._listeners = /* @__PURE__ */ new Map();
    this._events = /* @__PURE__ */ new Set();
  }
  post(event) {
    this._events.add(event);
  }
  service() {
    for (const event of this._events) {
      if (!this._listeners.has(event)) {
        continue;
      }
      const callbacks = this._listeners.get(event);
      for (const callback of callbacks) {
        callback();
      }
    }
    this._events.clear();
  }
  addEventListener(event, callback) {
    if (!this._listeners.has(event)) {
      this._listeners.set(event, new Array());
    } else {
      const callbacks = this._listeners.get(event);
      for (const i in callbacks) {
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
    const callbacks = this._listeners.get(event);
    const index = callbacks.indexOf(callback, 0);
    if (index > -1) {
      callbacks.splice(index, 1);
    }
  }
};
var TimedEventHandler = class {
  constructor() {
    this._callbacks = new Array();
  }
  add(callback) {
    this._callbacks.push(callback);
  }
  service() {
    for (let i = this._callbacks.length - 1; i >= 0; i--) {
      const finished = this._callbacks[i]();
      if (finished) {
        this._callbacks.splice(i, 1);
      }
    }
  }
};

// src/physics.ts
var Dimensions = class {
  constructor(_width, _depth, _height) {
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
};
var BoundingCuboid = class {
  constructor(_centre, _dimensions) {
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
  get centre() {
    return this._centre;
  }
  set centre(centre) {
    this._centre = centre;
    const width = this.width / 2;
    const depth = this.depth / 2;
    const height = this.height / 2;
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
    if (location.x < this._minLocation.x || location.y < this._minLocation.y || location.z < this._minLocation.z) {
      return false;
    }
    if (location.x > this._maxLocation.x || location.y > this._maxLocation.y || location.z > this._maxLocation.z) {
      return false;
    }
    return true;
  }
  containsBounds(other) {
    return this.contains(other.minLocation) && this.contains(other.maxLocation);
  }
  intersects(other) {
    if (other.minLocation.x > this.maxLocation.x || other.maxLocation.x < this.minLocation.x) {
      return false;
    }
    if (other.minLocation.y > this.maxLocation.y || other.maxLocation.y < this.minLocation.y) {
      return false;
    }
    if (other.minLocation.z > this.maxLocation.z || other.maxLocation.z < this.minLocation.z) {
      return false;
    }
    return true;
  }
  insert(other) {
    if (this.containsBounds(other)) {
      return;
    }
    const minX = other.minLocation.x < this.minLocation.x ? other.minLocation.x : this.minLocation.x;
    const minY = other.minLocation.y < this.minLocation.y ? other.minLocation.y : this.minLocation.y;
    const minZ = other.minLocation.z < this.minLocation.z ? other.minLocation.z : this.minLocation.z;
    const maxX = other.maxLocation.x > this.maxLocation.x ? other.maxLocation.x : this.maxLocation.x;
    const maxY = other.maxLocation.y > this.maxLocation.y ? other.maxLocation.y : this.maxLocation.y;
    const maxZ = other.maxLocation.z > this.maxLocation.z ? other.maxLocation.z : this.maxLocation.z;
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
    console.log(
      " - min (x,y,z):",
      this.minLocation.x,
      this.minLocation.y,
      this.minLocation.z
    );
    console.log(
      " - max (x,y,z):",
      this.maxLocation.x,
      this.maxLocation.y,
      this.maxLocation.z
    );
    console.log(
      " - centre (x,y,z):",
      this.centre.x,
      this.centre.y,
      this.centre.z
    );
    console.log(" - dimensions (WxDxH):", this.width, this.depth, this.height);
  }
};
var CollisionInfo = class {
  constructor(_collidedEntity, _blocking, _intersectInfo) {
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
};
var CollisionDetector = class {
  static init(spatialInfo) {
    this._spatialInfo = spatialInfo;
    this._collisionInfo = /* @__PURE__ */ new Map();
    this._missInfo = /* @__PURE__ */ new Map();
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
    const misses = new Array();
    const entities = this._spatialInfo.getEntities(area);
    for (const entity of entities) {
      if (entity.id == movable.id) {
        continue;
      }
      const geometry = entity.geometry;
      for (const beginPoint of beginPoints) {
        const endPoint = beginPoint.add(path);
        const intersectInfo = geometry.obstructs(beginPoint, endPoint);
        if (intersectInfo != null) {
          const blocking = true;
          const collision = new CollisionInfo(entity, blocking, intersectInfo);
          this._collisionInfo.set(movable, collision);
          movable.postEvent("collision" /* Collision */);
          return collision;
        } else {
          misses.push(entity);
          movable.postEvent("noCollision" /* NoCollision */);
        }
      }
    }
    this.addMissInfo(movable, misses);
    return null;
  }
};
var Gravity = class {
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
      entities.forEach((movable) => {
        const bounds = movable.bounds;
        const area = new BoundingCuboid(
          bounds.centre.add(path),
          bounds.dimensions
        );
        area.insert(bounds);
        const collision = CollisionDetector.detectInArea(movable, path, area);
        if (collision == null) {
          movable.updatePosition(path);
        }
      });
    }
  }
};
Gravity._enabled = false;
Gravity._force = 0;

// src/entity.ts
var _PhysicalEntity = class {
  constructor(_context, minLocation, dimensions) {
    this._context = _context;
    this._visible = true;
    this._drawable = false;
    this._drawGeometry = false;
    this._handler = new EventHandler();
    this._graphicComponents = new Array();
    this._id = _PhysicalEntity._ids;
    _PhysicalEntity._ids++;
    const centre = new Point3D(
      minLocation.x + dimensions.width / 2,
      minLocation.y + dimensions.depth / 2,
      minLocation.z + dimensions.height / 2
    );
    const bounds = new BoundingCuboid(centre, dimensions);
    this._geometry = new CuboidGeometry(bounds);
    this._context.addEntity(this);
  }
  static reset() {
    this._ids = 0;
  }
  static getNumEntities() {
    return this._ids;
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
  set visible(visible) {
    this._visible = visible;
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
};
var PhysicalEntity = _PhysicalEntity;
PhysicalEntity._ids = 0;
var MovableEntity = class extends PhysicalEntity {
  constructor(context, location, dimensions) {
    super(context, location, dimensions);
    this._lift = 0;
    this._canSwim = false;
    context.addMovableEntity(this);
  }
  updatePosition(d) {
    this.bounds.update(d);
    this.geometry.transform(d);
    this.postEvent("moving" /* Moving */);
  }
  get lift() {
    return this._lift;
  }
  get direction() {
    return this._direction;
  }
  set direction(direction) {
    this._direction = direction;
    this.postEvent("faceDirection" /* FaceDirection */);
  }
};
var Actor = class extends MovableEntity {
  constructor(context, location, dimensions) {
    super(context, location, dimensions);
    context.addUpdateableEntity(this);
  }
  update() {
    super.update();
    if (this._action != void 0 && this._action.perform()) {
      this._action = null;
    }
  }
  set action(action) {
    this._action = action;
  }
};
function createGraphicalEntity(context, location, dimensions, graphicComponent) {
  const entity = new PhysicalEntity(context, location, dimensions);
  entity.addGraphic(graphicComponent);
  return entity;
}
function createGraphicalMovableEntity(context, location, dimensions, graphicComponent) {
  const entity = new MovableEntity(context, location, dimensions);
  entity.addGraphic(graphicComponent);
  return entity;
}
function createGraphicalActor(context, location, dimensions, graphicComponent) {
  const actor = new Actor(context, location, dimensions);
  actor.addGraphic(graphicComponent);
  return actor;
}

// src/graphics.ts
var DummySpriteSheet = {
  addForValidation: function(_sprite) {
    return true;
  },
  addBitmap: function(id, x, y, width, height) {
  }
};
var SpriteBitmap = class {
  constructor(_id, _x, _y, _width, _height) {
    this._id = _id;
    this._x = _x;
    this._y = _y;
    this._width = _width;
    this._height = _height;
    Object.freeze(this);
  }
  get id() {
    return this._id;
  }
  get x() {
    return this._x;
  }
  get y() {
    return this._y;
  }
  get width() {
    return this._width;
  }
  get height() {
    return this._height;
  }
};
var _SpriteSheet = class {
  constructor(name, context) {
    this._loaded = false;
    this._bitmapsToLoad = new Array();
    this._renderer = context.renderer;
    this._image = new Image();
    this._image.onload = () => {
      this.canvas = document.createElement("canvas");
      this.canvas.width = this.width;
      this.canvas.height = this.height;
      this.context2D = this.canvas.getContext("2d", { willReadFrequently: true });
      this.context2D.drawImage(this.image, 0, 0, this.width, this.height);
      this.loaded = true;
      for (let bitmap of this.bitmapsToLoad) {
        this.addBitmap(bitmap.id, bitmap.x, bitmap.y, bitmap.width, bitmap.height);
      }
    };
    if (name) {
      this._image.src = name + ".png";
    } else {
      throw new Error("No filename passed");
    }
    _SpriteSheet.add(this);
  }
  static add(sheet) {
    this._sheets.push(sheet);
  }
  static reset() {
    this._sheets = new Array();
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
    console.log("loaded spritesheet:", this.image.src);
    this._loaded = b;
  }
  get canvas() {
    return this._canvas;
  }
  set canvas(c) {
    this._canvas = c;
  }
  get context2D() {
    return this._context2D;
  }
  set context2D(c) {
    this._context2D = c;
  }
  get bitmapsToLoad() {
    return this._bitmapsToLoad;
  }
  isTransparentAt(x, y) {
    const data = this.context2D.getImageData(x, y, 1, 1).data;
    return data[3] == 0;
  }
  addBitmap(id, x, y, width, height) {
    return __async(this, null, function* () {
      if (this.loaded) {
        const bitmap = yield createImageBitmap(this.image, x, y, width, height);
        this._renderer.addBitmap(id, bitmap);
      } else {
        this.bitmapsToLoad.push(new SpriteBitmap(id, x, y, width, height));
      }
    });
  }
};
var SpriteSheet = _SpriteSheet;
SpriteSheet._sheets = new Array();
var _Sprite = class {
  constructor(_sheet, x, y, _width, _height) {
    this._sheet = _sheet;
    this._width = _width;
    this._height = _height;
    this._offset = new Point2D(x, y);
    console.assert(this.offset.x >= 0, "offset.x < 0");
    console.assert(this.offset.y >= 0, "offset.y < 0");
    const maxOffset = new Point2D(
      this.offset.x + this.width,
      this.offset.y + this.height
    );
    this._id = _Sprite.sprites.length;
    _Sprite.sprites.push(this);
    this.sheet.addBitmap(
      this.id,
      this.offset.x,
      this.offset.y,
      this.width,
      this.height
    );
  }
  isTransparentAt(x, y) {
    x += this.offset.x;
    y += this.offset.y;
    return this.sheet.isTransparentAt(x, y);
  }
  get sheet() {
    return this._sheet;
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
  get offset() {
    return this._offset;
  }
};
var Sprite = _Sprite;
Sprite.sprites = new Array();
var GraphicEvent = /* @__PURE__ */ ((GraphicEvent2) => {
  GraphicEvent2[GraphicEvent2["AddCanvas"] = 0] = "AddCanvas";
  GraphicEvent2[GraphicEvent2["AddSprite"] = 1] = "AddSprite";
  GraphicEvent2[GraphicEvent2["Draw"] = 2] = "Draw";
  return GraphicEvent2;
})(GraphicEvent || {});
var DrawElement = class {
  constructor(_spriteId, _coord) {
    this._spriteId = _spriteId;
    this._coord = _coord;
    Object.freeze(this);
  }
  get spriteId() {
    return this._spriteId;
  }
  get coord() {
    return this._coord;
  }
};
function generateSprites(sheet, width, height, xBegin, yBegin, columns, rows) {
  const sprites = new Array();
  const xEnd = xBegin + columns;
  const yEnd = yBegin + rows;
  for (let y = yBegin; y < yEnd; y++) {
    for (let x = xBegin; x < xEnd; x++) {
      sprites.push(new Sprite(sheet, x * width, y * height, width, height));
    }
  }
  return sprites;
}
var GraphicComponent = class {
  constructor(_currentSpriteId) {
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
};
var DummyGraphicComponent = class extends GraphicComponent {
  constructor(_width, _height) {
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
};
var StaticGraphicComponent = class extends GraphicComponent {
  constructor(id) {
    super(id);
  }
  update() {
    return this._currentSpriteId;
  }
};
function generateStaticGraphics(sheet, width, height, xBegin, yBegin, columns, rows) {
  const graphics = new Array();
  const xEnd = xBegin + columns;
  const yEnd = yBegin + rows;
  for (let y = yBegin; y < yEnd; y++) {
    for (let x = xBegin; x < xEnd; x++) {
      const sprite = new Sprite(sheet, x * width, y * height, width, height);
      graphics.push(new StaticGraphicComponent(sprite.id));
    }
  }
  return graphics;
}
var AnimatedGraphicComponent = class extends GraphicComponent {
  constructor(sprites, _interval) {
    super(sprites[0].id);
    this._interval = _interval;
    this._nextUpdate = 0;
    this._currentSpriteIdx = 0;
    this._spriteIds = new Array();
    for (const i in sprites) {
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
};
var OssilateGraphicComponent = class extends AnimatedGraphicComponent {
  constructor(sprites, interval) {
    super(sprites, interval);
    this._increase = true;
    this._currentSpriteIdx = Math.floor(
      Math.random() * (this._spriteIds.length - 1)
    );
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
};
var LoopGraphicComponent = class extends AnimatedGraphicComponent {
  constructor(sprites, interval) {
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
};
var DirectionalGraphicComponent = class extends GraphicComponent {
  constructor(_staticGraphics) {
    super(0);
    this._staticGraphics = _staticGraphics;
    this._direction = 0 /* North */;
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
      const component = this._staticGraphics.get(
        this.direction
      );
      const spriteId = component.update();
      return spriteId;
    }
    console.error(
      "unhandled stationary graphic:",
      Navigation.getDirectionName(this.direction)
    );
    return 0;
  }
};
var AnimatedDirectionalGraphicComponent = class extends GraphicComponent {
  constructor(_staticGraphics, _movementGraphics) {
    super(0);
    this._staticGraphics = _staticGraphics;
    this._movementGraphics = _movementGraphics;
    this._stationary = true;
    this._direction = 0 /* North */;
  }
  get stationary() {
    return this._stationary;
  }
  set stationary(stationary) {
    this._stationary = stationary;
  }
  get direction() {
    return this._direction;
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
      const component = this._staticGraphics.get(
        this.direction
      );
      const spriteId = component.update();
      return spriteId;
    }
    if (this.stationary) {
      console.error(
        "unhandled stationary graphic:",
        Navigation.getDirectionName(this.direction)
      );
    } else {
      console.error(
        "unhandled movement graphic:",
        Navigation.getDirectionName(this.direction)
      );
    }
    return 0;
  }
};

// src/terrain.ts
var TerrainShape = /* @__PURE__ */ ((TerrainShape2) => {
  TerrainShape2[TerrainShape2["Flat"] = 0] = "Flat";
  TerrainShape2[TerrainShape2["Wall"] = 1] = "Wall";
  TerrainShape2[TerrainShape2["FlatWest"] = 2] = "FlatWest";
  TerrainShape2[TerrainShape2["FlatEast"] = 3] = "FlatEast";
  TerrainShape2[TerrainShape2["FlatNorthWest"] = 4] = "FlatNorthWest";
  TerrainShape2[TerrainShape2["FlatNorth"] = 5] = "FlatNorth";
  TerrainShape2[TerrainShape2["FlatNorthEast"] = 6] = "FlatNorthEast";
  TerrainShape2[TerrainShape2["FlatSouthWest"] = 7] = "FlatSouthWest";
  TerrainShape2[TerrainShape2["FlatSouth"] = 8] = "FlatSouth";
  TerrainShape2[TerrainShape2["FlatSouthEast"] = 9] = "FlatSouthEast";
  TerrainShape2[TerrainShape2["FlatNorthOut"] = 10] = "FlatNorthOut";
  TerrainShape2[TerrainShape2["FlatEastOut"] = 11] = "FlatEastOut";
  TerrainShape2[TerrainShape2["FlatWestOut"] = 12] = "FlatWestOut";
  TerrainShape2[TerrainShape2["FlatSouthOut"] = 13] = "FlatSouthOut";
  TerrainShape2[TerrainShape2["FlatAloneOut"] = 14] = "FlatAloneOut";
  TerrainShape2[TerrainShape2["RampUpSouthEdge"] = 15] = "RampUpSouthEdge";
  TerrainShape2[TerrainShape2["RampUpWestEdge"] = 16] = "RampUpWestEdge";
  TerrainShape2[TerrainShape2["RampUpEastEdge"] = 17] = "RampUpEastEdge";
  TerrainShape2[TerrainShape2["RampUpNorthEdge"] = 18] = "RampUpNorthEdge";
  TerrainShape2[TerrainShape2["RampUpSouth"] = 19] = "RampUpSouth";
  TerrainShape2[TerrainShape2["RampUpWest"] = 20] = "RampUpWest";
  TerrainShape2[TerrainShape2["RampUpEast"] = 21] = "RampUpEast";
  TerrainShape2[TerrainShape2["RampUpNorth"] = 22] = "RampUpNorth";
  TerrainShape2[TerrainShape2["Max"] = 23] = "Max";
  return TerrainShape2;
})(TerrainShape || {});
var TerrainType = /* @__PURE__ */ ((TerrainType2) => {
  TerrainType2[TerrainType2["Water"] = 0] = "Water";
  TerrainType2[TerrainType2["Lowland0"] = 1] = "Lowland0";
  TerrainType2[TerrainType2["Lowland1"] = 2] = "Lowland1";
  TerrainType2[TerrainType2["Lowland2"] = 3] = "Lowland2";
  TerrainType2[TerrainType2["Lowland3"] = 4] = "Lowland3";
  TerrainType2[TerrainType2["Lowland4"] = 5] = "Lowland4";
  TerrainType2[TerrainType2["Lowland5"] = 6] = "Lowland5";
  TerrainType2[TerrainType2["Upland0"] = 7] = "Upland0";
  TerrainType2[TerrainType2["Upland1"] = 8] = "Upland1";
  TerrainType2[TerrainType2["Upland2"] = 9] = "Upland2";
  TerrainType2[TerrainType2["Upland3"] = 10] = "Upland3";
  TerrainType2[TerrainType2["Upland4"] = 11] = "Upland4";
  TerrainType2[TerrainType2["Upland5"] = 12] = "Upland5";
  return TerrainType2;
})(TerrainType || {});
var TerrainFeature = /* @__PURE__ */ ((TerrainFeature2) => {
  TerrainFeature2[TerrainFeature2["None"] = 0] = "None";
  TerrainFeature2[TerrainFeature2["Shoreline"] = 1] = "Shoreline";
  TerrainFeature2[TerrainFeature2["ShorelineNorth"] = 2] = "ShorelineNorth";
  TerrainFeature2[TerrainFeature2["ShorelineEast"] = 4] = "ShorelineEast";
  TerrainFeature2[TerrainFeature2["ShorelineSouth"] = 8] = "ShorelineSouth";
  TerrainFeature2[TerrainFeature2["ShorelineWest"] = 16] = "ShorelineWest";
  TerrainFeature2[TerrainFeature2["DryGrass"] = 32] = "DryGrass";
  TerrainFeature2[TerrainFeature2["WetGrass"] = 64] = "WetGrass";
  TerrainFeature2[TerrainFeature2["Mud"] = 128] = "Mud";
  return TerrainFeature2;
})(TerrainFeature || {});
function hasFeature(features, mask) {
  return (features & mask) == mask;
}
var _Terrain = class extends PhysicalEntity {
  constructor(context, _gridX, _gridY, _gridZ, dimensions, _type, _shape, features) {
    super(
      context,
      new Point3D(
        _gridX * dimensions.width,
        _gridY * dimensions.depth,
        _gridZ * dimensions.height
      ),
      dimensions
    );
    this._gridX = _gridX;
    this._gridY = _gridY;
    this._gridZ = _gridZ;
    this._type = _type;
    this._shape = _shape;
    this.addGraphic(_Terrain.graphics(_type, _shape));
    if (!_Terrain.isFlat(_shape)) {
      const theta = Math.atan(this.height / this.depth) * 180 / Math.PI;
      this._tanTheta = Math.tan(theta);
    } else {
      this._tanTheta = 0;
    }
    if (this._shape == 20 /* RampUpWest */) {
      this._geometry = new RampUpWestGeometry(this.geometry.bounds);
    } else if (this._shape == 21 /* RampUpEast */) {
      this._geometry = new RampUpEastGeometry(this.geometry.bounds);
    } else if (this._shape == 19 /* RampUpSouth */) {
      this._geometry = new RampUpSouthGeometry(this.geometry.bounds);
    } else if (this._shape == 22 /* RampUpNorth */) {
      this._geometry = new RampUpNorthGeometry(this.geometry.bounds);
    }
    const x = this.bounds.centre.x;
    const y = this.bounds.centre.y;
    const z = this.heightAt(this.bounds.centre);
    this._surfaceLocation = new Point3D(x, y, z);
    if (features == 0 /* None */) {
      return;
    }
    for (const value of Object.values(TerrainFeature)) {
      const feature = value;
      if (_Terrain.isSupportedFeature(feature) && hasFeature(features, feature)) {
        this.addGraphic(_Terrain.featureGraphics(feature));
      }
    }
  }
  static reset() {
    this._dimensions = new Dimensions(0, 0, 0);
    this._featureGraphics = /* @__PURE__ */ new Map();
    this._terrainGraphics = /* @__PURE__ */ new Map();
  }
  static getDimensions() {
    return this._dimensions;
  }
  static graphics(terrainType, shape) {
    if (!this._terrainGraphics.has(terrainType)) {
      console.error(
        "missing graphics for TerrainType",
        _Terrain.getTypeName(terrainType)
      );
    }
    if (!this._terrainGraphics.get(terrainType).has(shape)) {
      console.error(
        "missing graphics for TerrainShape:",
        _Terrain.getShapeName(shape)
      );
    }
    return this._terrainGraphics.get(terrainType).get(shape);
  }
  static featureGraphics(terrainFeature) {
    console.assert(
      this._featureGraphics.has(terrainFeature),
      "missing terrain feature",
      _Terrain.getFeatureName(terrainFeature)
    );
    return this._featureGraphics.get(terrainFeature);
  }
  static addGraphic(terrainType, terrainShape, sheet, x, y, width, height) {
    const sprite = new Sprite(sheet, x, y, width, height);
    const component = new StaticGraphicComponent(sprite.id);
    if (!this._terrainGraphics.has(terrainType)) {
      this._terrainGraphics.set(
        terrainType,
        /* @__PURE__ */ new Map()
      );
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
    const x = loc.x - loc.x % this.width;
    const y = loc.y - loc.y % this.depth;
    const z = loc.z - loc.z % this.height;
    return new Point3D(
      Math.floor(x / this.width),
      Math.floor(y / this.depth),
      Math.floor(z / this.height)
    );
  }
  static create(context, x, y, z, type, shape, feature) {
    return new _Terrain(
      context,
      x,
      y,
      z,
      this._dimensions,
      type,
      shape,
      feature
    );
  }
  static getFeatureName(feature) {
    switch (feature) {
      default:
        break;
      case 1 /* Shoreline */:
      case 2 /* ShorelineNorth */:
      case 4 /* ShorelineEast */:
      case 8 /* ShorelineSouth */:
      case 16 /* ShorelineWest */:
        return "Shoreline";
      case 32 /* DryGrass */:
        return "Dry Grass";
      case 64 /* WetGrass */:
        return "Wet Grass";
      case 128 /* Mud */:
        return "Mud";
    }
    return "None";
  }
  static getShapeName(terrain) {
    switch (terrain) {
      default:
        console.error("unhandled terrain shape:", terrain);
        return "invalid shape";
      case 0 /* Flat */:
        return "flat";
      case 1 /* Wall */:
        return "wall";
      case 5 /* FlatNorth */:
        return "flat north";
      case 6 /* FlatNorthEast */:
        return "flat north east";
      case 4 /* FlatNorthWest */:
        return "flat north west";
      case 3 /* FlatEast */:
        return "flat east";
      case 2 /* FlatWest */:
        return "flat west";
      case 8 /* FlatSouth */:
        return "flat south";
      case 9 /* FlatSouthEast */:
        return "flat south east";
      case 7 /* FlatSouthWest */:
        return "flat south west";
      case 22 /* RampUpNorth */:
        return "ramp up north";
      case 18 /* RampUpNorthEdge */:
        return "ramp up north edge";
      case 21 /* RampUpEast */:
        return "ramp up east";
      case 17 /* RampUpEastEdge */:
        return "ramp up east edge";
      case 19 /* RampUpSouth */:
        return "ramp up south";
      case 15 /* RampUpSouthEdge */:
        return "ramp up south edge";
      case 20 /* RampUpWest */:
        return "ramp up west";
      case 16 /* RampUpWestEdge */:
        return "ramp up west edge";
      case 10 /* FlatNorthOut */:
        return "flat north out";
      case 11 /* FlatEastOut */:
        return "flat east out";
      case 12 /* FlatWestOut */:
        return "flat west out";
      case 13 /* FlatSouthOut */:
        return "flat south out";
      case 14 /* FlatAloneOut */:
        return "flat alone out";
    }
  }
  static getTypeName(terrain) {
    switch (terrain) {
      default:
        console.error("unhandled terrain type:", terrain);
        return "invalid terrain";
      case 0 /* Water */:
        return "water";
      case 1 /* Lowland0 */:
        return "lowland 0";
      case 2 /* Lowland1 */:
        return "lowland 1";
      case 3 /* Lowland2 */:
        return "lowland 2";
      case 4 /* Lowland3 */:
        return "lowland 3";
      case 5 /* Lowland4 */:
        return "lowland 4";
      case 6 /* Lowland5 */:
        return "lowland 5";
      case 7 /* Upland0 */:
        return "upland 0";
      case 8 /* Upland1 */:
        return "upland 1";
      case 9 /* Upland2 */:
        return "upland 2";
      case 10 /* Upland3 */:
        return "upland 3";
      case 11 /* Upland4 */:
        return "upland 4";
      case 12 /* Upland5 */:
        return "upland 5";
    }
  }
  static isFlat(terrain) {
    switch (terrain) {
      default:
        break;
      case 4 /* FlatNorthWest */:
      case 5 /* FlatNorth */:
      case 6 /* FlatNorthEast */:
      case 2 /* FlatWest */:
      case 0 /* Flat */:
      case 1 /* Wall */:
      case 3 /* FlatEast */:
      case 7 /* FlatSouthWest */:
      case 8 /* FlatSouth */:
      case 9 /* FlatSouthEast */:
      case 10 /* FlatNorthOut */:
      case 11 /* FlatEastOut */:
      case 13 /* FlatSouthOut */:
      case 12 /* FlatWestOut */:
      case 14 /* FlatAloneOut */:
        return true;
    }
    return false;
  }
  static isEdge(terrain) {
    switch (terrain) {
      default:
        break;
      case 4 /* FlatNorthWest */:
      case 5 /* FlatNorth */:
      case 6 /* FlatNorthEast */:
      case 2 /* FlatWest */:
      case 1 /* Wall */:
      case 3 /* FlatEast */:
      case 7 /* FlatSouthWest */:
      case 8 /* FlatSouth */:
      case 9 /* FlatSouthEast */:
      case 10 /* FlatNorthOut */:
      case 11 /* FlatEastOut */:
      case 13 /* FlatSouthOut */:
      case 12 /* FlatWestOut */:
      case 14 /* FlatAloneOut */:
      case 15 /* RampUpSouthEdge */:
      case 16 /* RampUpWestEdge */:
      case 17 /* RampUpEastEdge */:
      case 18 /* RampUpNorthEdge */:
        return true;
    }
    return false;
  }
  static isRampUp(shape, direction) {
    switch (direction) {
      default:
        break;
      case 0 /* North */:
        return shape == 18 /* RampUpNorthEdge */ || shape == 22 /* RampUpNorth */;
      case 2 /* East */:
        return shape == 17 /* RampUpEastEdge */ || shape == 21 /* RampUpEast */;
      case 4 /* South */:
        return shape == 15 /* RampUpSouthEdge */ || shape == 19 /* RampUpSouth */;
      case 6 /* West */:
        return shape == 16 /* RampUpWestEdge */ || shape == 20 /* RampUpWest */;
    }
    return false;
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
    if (_Terrain.isFlat(this._shape)) {
      return this.z + this.height;
    }
    return this.z + location.y * this._tanTheta;
  }
};
var Terrain = _Terrain;
Terrain._featureGraphics = /* @__PURE__ */ new Map();
Terrain._terrainGraphics = /* @__PURE__ */ new Map();
var _TerrainGrid = class {
  constructor(_context, _width, _depth) {
    this._context = _context;
    this._width = _width;
    this._depth = _depth;
    this._surfaceTerrain = new Array();
    this._totalSurface = 0;
    this._totalSubSurface = 0;
    for (let y = 0; y < this.depth; ++y) {
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
    const terrain = Terrain.create(this._context, x, y, z, ty, shape, feature);
    this.surfaceTerrain[y][x] = terrain;
    this._totalSurface++;
  }
  addSubSurfaceTerrain(x, y, z, ty, shape) {
    console.assert(
      this.getSurfaceTerrainAt(x, y).z > z,
      "adding sub-surface terrain which is above surface!"
    );
    Terrain.create(this._context, x, y, z, ty, shape, 0 /* None */);
    this._totalSubSurface++;
  }
  getSurfaceTerrainAt(x, y) {
    if (x < 0 || x >= this.width || y < 0 || y >= this.depth) {
      return null;
    }
    return this.surfaceTerrain[y][x];
  }
  getSurfaceTerrainAtPoint(loc) {
    const scaled = Terrain.scaleLocation(loc);
    const terrain = this.getSurfaceTerrainAt(scaled.x, scaled.y);
    if (terrain != null) {
      if (terrain.surfaceLocation.z == loc.z) {
        return terrain;
      }
    }
    return null;
  }
  getNeighbours(centre) {
    const neighbours = new Array();
    for (const offset of _TerrainGrid.neighbourOffsets) {
      const scaled = Terrain.scaleLocation(centre.surfaceLocation);
      const neighbour = this.getSurfaceTerrainAt(
        scaled.x + offset.x,
        scaled.y + offset.y
      );
      if (!neighbour) {
        continue;
      }
      neighbours.push(neighbour);
    }
    return neighbours;
  }
};
var TerrainGrid = _TerrainGrid;
TerrainGrid.neighbourOffsets = [
  new Point2D(-1, -1),
  new Point2D(0, -1),
  new Point2D(1, -1),
  new Point2D(-1, 0),
  new Point2D(1, 0),
  new Point2D(-1, 1),
  new Point2D(0, 1),
  new Point2D(1, 1)
];

// src/queue.ts
var QueueItem = class {
  constructor(_element, _key) {
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
};
var MinPriorityQueue = class {
  constructor() {
    this._items = new Array();
    this._indices = /* @__PURE__ */ new Map();
  }
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
  empty() {
    return this.length == 0;
  }
  pop() {
    const minItem = this.items[0];
    this.items.splice(0, 1);
    this.indices.delete(minItem.element);
    for (let i = 0; i < this.items.length; ++i) {
      const item = this.items[i];
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
    const item = this.items[i];
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
    const item = this.items[i];
    console.assert(k <= item.key);
    item.key = k;
    while (i > 0 && this.keyAt(this.parentIdx(i)) > this.keyAt(i)) {
      this.exchange(i, this.parentIdx(i));
      i = this.parentIdx(i);
    }
  }
  exchange(idxA, idxB) {
    console.assert(idxA < this.length);
    console.assert(idxB < this.length);
    const itemA = this.items[idxA];
    const itemB = this.items[idxB];
    this.items[idxA] = itemB;
    this.items[idxB] = itemA;
    this.indices.set(itemA.element, idxB);
    this.indices.set(itemB.element, idxA);
  }
  build() {
    for (let i = this.size >> 1; i >= 0; i--) {
      this.heapify(i);
    }
  }
  heapify(i) {
    const left = this.leftIdx(i);
    const right = this.rightIdx(i);
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
};

// src/navigation.ts
var Direction = /* @__PURE__ */ ((Direction2) => {
  Direction2[Direction2["North"] = 0] = "North";
  Direction2[Direction2["NorthEast"] = 1] = "NorthEast";
  Direction2[Direction2["East"] = 2] = "East";
  Direction2[Direction2["SouthEast"] = 3] = "SouthEast";
  Direction2[Direction2["South"] = 4] = "South";
  Direction2[Direction2["SouthWest"] = 5] = "SouthWest";
  Direction2[Direction2["West"] = 6] = "West";
  Direction2[Direction2["NorthWest"] = 7] = "NorthWest";
  Direction2[Direction2["Max"] = 8] = "Max";
  return Direction2;
})(Direction || {});
var Navigation = class {
  static getDirectionName(direction) {
    switch (direction) {
      default:
        break;
      case 0 /* North */:
        return "north";
      case 1 /* NorthEast */:
        return "north east";
      case 2 /* East */:
        return "east";
      case 3 /* SouthEast */:
        return "south east";
      case 4 /* South */:
        return "south";
      case 5 /* SouthWest */:
        return "south west";
      case 6 /* West */:
        return "west";
      case 7 /* NorthWest */:
        return "north west";
    }
    console.error("unhandled direction when getting name:", direction);
    return "error";
  }
  static getVector2D(direction) {
    let xDiff = 0;
    let yDiff = 0;
    switch (direction) {
      default:
        console.error("unhandled direction");
        break;
      case 0 /* North */:
        yDiff = -1;
        break;
      case 1 /* NorthEast */:
        xDiff = 1;
        yDiff = -1;
        break;
      case 2 /* East */:
        xDiff = 1;
        break;
      case 3 /* SouthEast */:
        xDiff = 1;
        yDiff = 1;
        break;
      case 4 /* South */:
        yDiff = 1;
        break;
      case 5 /* SouthWest */:
        xDiff = -1;
        yDiff = 1;
        break;
      case 6 /* West */:
        xDiff = -1;
        break;
      case 7 /* NorthWest */:
        xDiff = -1;
        yDiff = -1;
        break;
    }
    return new Vector2D(xDiff, yDiff);
  }
  static getAdjacentCoord(p, direction) {
    const v = this.getVector2D(direction);
    return p.add(v);
  }
  static getDirectionFromPoints(from, to) {
    return this.getDirectionFromVector(to.diff(from));
  }
  static getDirectionFromVector(w) {
    const mag = w.mag();
    const u = new Vector2D(0, -mag);
    let theta = 180 * u.angle(w) / Math.PI;
    if (theta < 0) {
      const rotate = 180 + theta;
      theta = 180 + rotate;
    }
    const direction = Math.round(theta / 45);
    return direction;
  }
  static getOppositeDirection(direction) {
    return (direction + 8 /* Max */ / 2) % 8 /* Max */;
  }
};
var PathNode = class {
  constructor(terrain) {
    this._edgeCosts = /* @__PURE__ */ new Map();
    this._waypoint = terrain.surfaceLocation;
  }
  addNeighbour(neighbour, cost) {
    this._edgeCosts.set(neighbour, cost);
  }
  hasNeighbour(neighbour) {
    return this._edgeCosts.has(neighbour);
  }
  get neighbours() {
    return this._edgeCosts;
  }
  get waypoint() {
    return this._waypoint;
  }
};
var PathFinder = class {
  constructor(_grid) {
    this._grid = _grid;
    this._nodes = /* @__PURE__ */ new Map();
    for (let y = 0; y < this.grid.depth; y++) {
      for (let x = 0; x < this.grid.width; x++) {
        const centre = this.grid.getSurfaceTerrainAt(x, y);
        this._nodes.set(centre, new PathNode(centre));
      }
    }
    for (let y = 0; y < this.grid.depth; y++) {
      for (let x = 0; x < this.grid.width; x++) {
        const centre = this.grid.getSurfaceTerrainAt(x, y);
        this.addNeighbours(centre);
      }
    }
  }
  get grid() {
    return this._grid;
  }
  get nodes() {
    return this._nodes;
  }
  getNeighbourCost(centre, to) {
    const cost = centre.x == to.x || centre.y == to.y ? 2 : 3;
    if (Terrain.isFlat(centre.shape) && Terrain.isFlat(to.shape)) {
      return cost;
    }
    return centre.z == to.z ? cost : cost * 2;
  }
  addNeighbours(centre) {
    console.assert(
      this.nodes.has(centre),
      "object not in node map: %o",
      centre
    );
    const neighbours = this.getAccessibleNeighbours(centre);
    if (neighbours.length == 0) {
      return;
    }
    const centreNode = this.nodes.get(centre);
    for (const neighbour of neighbours) {
      console.assert(
        this.nodes.has(neighbour),
        "object not in node map: %o",
        neighbour
      );
      const cost = this.getNeighbourCost(centre, neighbour);
      centreNode.addNeighbour(this.nodes.get(neighbour), cost);
    }
  }
  getAccessibleNeighbours(centre) {
    const neighbours = this.grid.getNeighbours(centre);
    const centrePoint = new Point2D(centre.x, centre.y);
    return neighbours.filter(function(to) {
      console.assert(
        Math.abs(centre.z - to.z) <= 1,
        "can only handle neighbours separated by 1 terrace max"
      );
      const toPoint = new Point2D(to.x, to.y);
      const direction = Navigation.getDirectionFromPoints(
        centrePoint,
        toPoint
      );
      const diagonal = direction != 0 /* North */ && direction != 2 /* East */ && direction != 4 /* South */ && direction != 6 /* West */;
      const oppositeDir = Navigation.getOppositeDirection(direction);
      if (to.z == centre.z) {
        return true;
      } else if (to.z > centre.z && !diagonal) {
        return Terrain.isRampUp(to.shape, direction);
      } else if (to.z < centre.z && !diagonal) {
        return Terrain.isRampUp(to.shape, oppositeDir);
      }
      return false;
    });
  }
  findPath(startPoint, endPoint) {
    const startTerrain = this.grid.getSurfaceTerrainAtPoint(startPoint);
    const endTerrain = this.grid.getSurfaceTerrainAtPoint(endPoint);
    if (startTerrain == null || endTerrain == null) {
      return new Array();
    }
    const start = this.nodes.get(startTerrain);
    if (start.neighbours.size == 0) {
      return new Array();
    }
    const end = this.nodes.get(endTerrain);
    if (end.neighbours.size == 0) {
      return new Array();
    }
    const frontier = new MinPriorityQueue();
    const cameFrom = /* @__PURE__ */ new Map();
    const costs = /* @__PURE__ */ new Map();
    frontier.insert(start, 0);
    cameFrom.set(start, null);
    costs.set(start, 0);
    let current = start;
    while (!frontier.empty()) {
      current = frontier.pop();
      if (current == end) {
        break;
      }
      current.neighbours.forEach((cost, next) => {
        const new_cost = costs.get(current) + cost;
        if (!costs.has(next) || new_cost < costs.get(next)) {
          costs.set(next, new_cost);
          const priority = new_cost;
          frontier.insert(next, priority);
          cameFrom.set(next, current);
        }
      });
    }
    if (current != end) {
      return Array();
    }
    const path = new Array(current.waypoint);
    while (current != start) {
      current = cameFrom.get(current);
      path.push(current.waypoint);
    }
    path.reverse();
    return path.splice(1);
  }
};

// src/scene.ts
var RenderOrder = /* @__PURE__ */ ((RenderOrder2) => {
  RenderOrder2[RenderOrder2["Before"] = -1] = "Before";
  RenderOrder2[RenderOrder2["Any"] = 0] = "Any";
  RenderOrder2[RenderOrder2["After"] = 1] = "After";
  return RenderOrder2;
})(RenderOrder || {});
var SceneNode = class {
  constructor(_entity, _minDrawCoord) {
    this._entity = _entity;
    this._minDrawCoord = _minDrawCoord;
    this._preds = new Array();
    this._succs = new Array();
    // FIXME: Just store the six points, not six segments.
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
    for (const otherTop of other.topSegments) {
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
    if (idx != -1)
      return;
    this._succs.push(succ);
  }
  removeSucc(succ) {
    const idx = this._succs.indexOf(succ);
    if (idx == -1)
      return;
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
};
var SceneLevel = class {
  constructor(root) {
    this._nodes = new Array();
    this._order = new Array();
    this._dirty = true;
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
    this._nodes.forEach((pred) => pred.removeSucc(node));
  }
  update(node, graph) {
    node.clear();
    for (let i = 0; i < this._nodes.length; i++) {
      const existing = this._nodes[i];
      if (existing.id == node.id) {
        continue;
      }
      const order = graph.drawOrder(node, existing);
      if (-1 /* Before */ == order) {
        node.addSucc(existing);
      } else if (1 /* After */ == order) {
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
    const toDraw = this._nodes.filter(
      (node) => this.shouldDraw(node, camera)
    );
    toDraw.sort((a, b) => graph.drawOrder(a, b));
    this.order = [];
    const discovered = /* @__PURE__ */ new Set();
    const topoSort = (node) => {
      if (discovered.has(node)) {
        return;
      }
      discovered.add(node);
      for (const succ of node.succs) {
        topoSort(succ);
      }
      this.order.push(node);
    };
    for (const i in toDraw) {
      if (discovered.has(toDraw[i])) {
        continue;
      }
      topoSort(toDraw[i]);
    }
    this.dirty = false;
  }
};
var SceneGraph = class {
  constructor() {
    this._levels = new Array();
    this._numNodes = 0;
    this._prevCameraLower = new Point2D(0, 0);
    this._prevCameraUpper = new Point2D(0, 0);
  }
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
    const drawHeightOffset = min2D.diff(top1);
    const adjustedCoord = new Point2D(min2D.x, min2D.y - drawHeightOffset.y);
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
    console.assert(
      node.level != null,
      "node with id:",
      node.entity.id,
      "isn't assigned a level!"
    );
    const level = node.level;
    if (level.inrange(node.entity)) {
      level.update(node, this);
    } else {
      level.remove(node);
      this.insertIntoLevel(node);
    }
  }
  insertIntoLevel(node) {
    for (const level of this.levels) {
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
    for (const node of nodes.values()) {
      nodeList.push(node);
      this.setDrawOutline(node);
    }
    nodeList.sort((a, b) => {
      if (a.minZ < b.minZ) {
        return -1 /* Before */;
      }
      if (a.minZ > b.minZ) {
        return 1 /* After */;
      }
      return 0 /* Any */;
    });
    nodeList.forEach((node) => this.insertIntoLevel(node));
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
    this._levels.forEach((level) => level.buildGraph(this, camera, force));
  }
};
var Scene = class {
  constructor(_graph) {
    this._graph = _graph;
    this._nodes = /* @__PURE__ */ new Map();
    this._numEntities = 0;
    this._handler = new TimedEventHandler();
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
    const node = new SceneNode(
      entity,
      this.graph.getDrawCoord(entity.bounds.minLocation)
    );
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
  getLocationAt(x, y, camera) {
    const entity = this.getEntityDrawnAt(x, y, camera);
    if (entity != null) {
      return entity.bounds.minLocation;
    }
    return null;
  }
  getEntityDrawnAt(x, y, camera) {
    for (let i = this.graph.levels.length - 1; i >= 0; i--) {
      const level = this.graph.levels[i];
      for (let j = 0; j < level.nodes.length; j++) {
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
  addTimedEvent(callback) {
    this._handler.add(callback);
  }
  numToDraw() {
    let num = 0;
    this.graph.levels.forEach((level) => {
      num += level.order.length;
    });
    return num;
  }
  render(camera, force) {
    if (!this.graph.initialised) {
      this.graph.initialise(this.nodes);
    }
    this.graph.buildLevels(camera, force);
    const elements = this.numToDraw();
    const initByteLength = elements * 2 * 3 * 2;
    let buffer = new ArrayBuffer(initByteLength);
    let drawElements = new Int16Array(buffer);
    let idx = 0;
    this.graph.levels.forEach((level) => {
      for (let i = level.order.length - 1; i >= 0; i--) {
        const node = level.order[i];
        const entity = node.entity;
        const coord = camera.getDrawCoord(node.drawCoord);
        if (entity.graphics.length * 3 + idx >= drawElements.length) {
          let new_buffer = new ArrayBuffer(buffer.byteLength * 2);
          new Int16Array(new_buffer).set(new Int16Array(buffer));
          buffer = new_buffer;
          drawElements = new Int16Array(buffer);
        }
        entity.graphics.forEach((component) => {
          const spriteId = component.update();
          drawElements[idx] = spriteId;
          drawElements[idx + 1] = coord.x;
          drawElements[idx + 2] = coord.y;
          idx += 3;
        });
      }
    });
    this._handler.service();
    return new DrawElementList(drawElements, idx);
  }
  verifyRenderer(entities) {
    if (this.graph.numNodes != entities.length) {
      console.error(
        "top-level comparison between scene node and entities failed"
      );
    }
    let counted = 0;
    const levelNodeIds = new Array();
    const nodeIds = new Array();
    const entityIds = new Array();
    for (const level of this.graph.levels) {
      counted += level.nodes.length;
      level.nodes.forEach((node) => levelNodeIds.push(node.id));
    }
    for (const node of this.nodes.values()) {
      nodeIds.push(node.id);
    }
    entities.forEach((entity) => entityIds.push(entity.id));
    if (nodeIds.length != entityIds.length || nodeIds.length != levelNodeIds.length) {
      console.error("number of scene nodes and entities don't match up");
      return false;
    }
    if (this.numEntities != entities.length) {
      console.error("mismatch in number of entities in context and scene");
    }
    nodeIds.sort((a, b) => {
      if (a < b) {
        return -1;
      } else {
        return 1;
      }
    });
    entityIds.sort((a, b) => {
      if (a < b) {
        return -1;
      } else {
        return 1;
      }
    });
    levelNodeIds.sort((a, b) => {
      if (a < b) {
        return -1;
      } else {
        return 1;
      }
    });
    for (let i = 0; i < nodeIds.length; ++i) {
      if (i != nodeIds[i]) {
        console.error("mismatch in expected ids:", i, nodeIds[i]);
        return false;
      }
      if (nodeIds[i] != entityIds[i]) {
        console.error("mismatch node vs entity ids:", nodeIds[i], entityIds[i]);
        return false;
      }
      if (nodeIds[i] != levelNodeIds[i]) {
        console.error(
          "mismatch top level node vs found in level ids:",
          nodeIds[i],
          levelNodeIds[i]
        );
        return false;
      }
    }
    return true;
  }
};
var Perspective = /* @__PURE__ */ ((Perspective2) => {
  Perspective2[Perspective2["TrueIsometric"] = 0] = "TrueIsometric";
  Perspective2[Perspective2["TwoByOneIsometric"] = 1] = "TwoByOneIsometric";
  return Perspective2;
})(Perspective || {});
var _IsometricPhysicalDimensions = class extends Dimensions {
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
  constructor(spriteWidth, relativeDims) {
    const width = _IsometricPhysicalDimensions.physicalWidth(spriteWidth);
    const depth = _IsometricPhysicalDimensions.physicalDepth(
      width,
      relativeDims
    );
    const height = _IsometricPhysicalDimensions.physicalHeight(
      width,
      relativeDims
    );
    super(width, depth, height);
  }
};
var IsometricPhysicalDimensions = _IsometricPhysicalDimensions;
IsometricPhysicalDimensions._oneOverSqrt3 = 1 / Math.sqrt(3);
var _TrueIsometric = class extends SceneGraph {
  constructor() {
    super();
  }
  static getDrawCoord(loc) {
    const dx = Math.round(this._halfSqrt3 * (loc.x + loc.y));
    const dy = Math.round(0.5 * (loc.y - loc.x) - loc.z);
    return new Point2D(dx, dy);
  }
  getDrawCoord(location) {
    return _TrueIsometric.getDrawCoord(location);
  }
  drawOrder(first, second) {
    if (first.overlapX(second)) {
      return first.entity.bounds.minY <= second.entity.bounds.minY ? -1 /* Before */ : 1 /* After */;
    }
    if (first.overlapY(second)) {
      return first.entity.bounds.minX >= second.entity.bounds.minX ? -1 /* Before */ : 1 /* After */;
    }
    if (!first.overlapZ(second)) {
      return 0 /* Any */;
    }
    if (first.intersectsTop(second)) {
      return -1 /* Before */;
    }
    if (second.intersectsTop(first)) {
      return 1 /* After */;
    }
    return 0 /* Any */;
  }
};
var TrueIsometric = _TrueIsometric;
TrueIsometric._sqrt3 = Math.sqrt(3);
TrueIsometric._halfSqrt3 = Math.sqrt(3) * 0.5;
var _TwoByOneIsometric = class extends SceneGraph {
  constructor() {
    super();
  }
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
    return new Dimensions(
      Math.round(width),
      Math.round(depth),
      Math.round(height)
    );
  }
  static drawOrder(first, second) {
    if (first.overlapX(second)) {
      return first.entity.bounds.minY < second.entity.bounds.minY ? -1 /* Before */ : 1 /* After */;
    }
    if (first.overlapY(second)) {
      return first.entity.bounds.minX > second.entity.bounds.minX ? -1 /* Before */ : 1 /* After */;
    }
    if (!first.overlapZ(second)) {
      return 0 /* Any */;
    }
    if (first.intersectsTop(second)) {
      return -1 /* Before */;
    }
    if (second.intersectsTop(first)) {
      return 1 /* After */;
    }
    return 0 /* Any */;
  }
  getDrawCoord(location) {
    return _TwoByOneIsometric.getDrawCoord(location);
  }
  drawOrder(first, second) {
    return _TwoByOneIsometric.drawOrder(first, second);
  }
};
var TwoByOneIsometric = _TwoByOneIsometric;
TwoByOneIsometric._magicRatio = Math.cos(Math.atan(0.5));
TwoByOneIsometric._oneOverMagicRatio = 1 / Math.cos(Math.atan(0.5));

// src/weather.ts
var Cloud = class {
  constructor(_pos, _moisture, _direction, _rain) {
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
  set pos(p) {
    this._pos = p;
  }
  get moisture() {
    return this._moisture;
  }
  set moisture(m) {
    this._moisture = m;
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
  dropMoisture(multiplier) {
    const moisture = this.moisture * 0.1 * multiplier;
    this.moisture -= moisture;
    this.rain.addMoistureAt(this.pos, moisture);
  }
  move() {
    while (this.surface.inbounds(this.pos)) {
      const nextCoord = Navigation.getAdjacentCoord(this.pos, this.direction);
      if (!this.surface.inbounds(nextCoord)) {
        this.dropMoisture(1);
        return;
      }
      const current = this.surface.at(this.x, this.y);
      if (current.height <= this.minHeight || current.terrace < 1) {
        this.pos = nextCoord;
        continue;
      }
      const next = this.surface.at(nextCoord.x, nextCoord.y);
      const multiplier = next.terrace > current.terrace ? 1.5 : 1;
      this.dropMoisture(multiplier);
      this.pos = nextCoord;
    }
  }
};
var Rain = class {
  constructor(_surface, _minHeight, moisture, direction) {
    this._surface = _surface;
    this._minHeight = _minHeight;
    this._clouds = Array();
    this._totalClouds = 0;
    this._moistureGrid = new Array();
    for (let y = 0; y < this.surface.depth; y++) {
      this._moistureGrid.push(new Float32Array(this.surface.width));
    }
    switch (direction) {
      default:
        console.error("unhandled direction");
        break;
      case 0 /* North */: {
        const y = this.surface.depth - 1;
        for (let x = 0; x < this.surface.width; x++) {
          this.addCloud(new Point2D(x, y), moisture, direction);
        }
        break;
      }
      case 2 /* East */: {
        const x = 0;
        for (let y = 0; y < this.surface.depth; y++) {
          this.addCloud(new Point2D(x, y), moisture, direction);
        }
        break;
      }
      case 4 /* South */: {
        const y = 0;
        for (let x = 0; x < this.surface.width; x++) {
          this.addCloud(new Point2D(x, y), moisture, direction);
        }
        break;
      }
      case 6 /* West */: {
        const x = this.surface.width - 1;
        for (let y = 0; y < this.surface.depth; y++) {
          this.addCloud(new Point2D(x, y), moisture, direction);
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
    while (this.clouds.length != 0) {
      const cloud = this.clouds[this.clouds.length - 1];
      this.clouds.pop();
      cloud.move();
    }
  }
};

// src/builder.ts
var Biome = /* @__PURE__ */ ((Biome2) => {
  Biome2[Biome2["Water"] = 0] = "Water";
  Biome2[Biome2["Desert"] = 1] = "Desert";
  Biome2[Biome2["Grassland"] = 2] = "Grassland";
  Biome2[Biome2["Shrubland"] = 3] = "Shrubland";
  Biome2[Biome2["MoistForest"] = 4] = "MoistForest";
  Biome2[Biome2["WetForest"] = 5] = "WetForest";
  Biome2[Biome2["RainForest"] = 6] = "RainForest";
  Biome2[Biome2["Rock"] = 7] = "Rock";
  Biome2[Biome2["Tundra"] = 8] = "Tundra";
  Biome2[Biome2["AlpineGrassland"] = 9] = "AlpineGrassland";
  Biome2[Biome2["AlpineMeadow"] = 10] = "AlpineMeadow";
  Biome2[Biome2["AlpineForest"] = 11] = "AlpineForest";
  Biome2[Biome2["Taiga"] = 12] = "Taiga";
  return Biome2;
})(Biome || {});
function getBiomeName(biome) {
  switch (biome) {
    default:
      console.error("unhandled biome type:", biome);
      return "invalid biome";
    case 0 /* Water */:
      return "water";
    case 1 /* Desert */:
      return "desert";
    case 2 /* Grassland */:
      return "grassland";
    case 3 /* Shrubland */:
      return "shrubland";
    case 4 /* MoistForest */:
      return "moist forest";
    case 5 /* WetForest */:
      return "wet forest";
    case 6 /* RainForest */:
      return "rain forest";
    case 8 /* Tundra */:
      return "tundra";
    case 9 /* AlpineGrassland */:
      return "alpine grassland";
    case 10 /* AlpineMeadow */:
      return "alpine meadow";
    case 11 /* AlpineForest */:
      return "alpine forest";
    case 12 /* Taiga */:
      return "taiga";
  }
}
function mean(grid) {
  let total = 0;
  let numElements = 0;
  for (const row of grid) {
    const acc = row.reduce(function(acc2, value) {
      return acc2 + value;
    }, 0);
    total += acc;
    numElements += row.length;
  }
  return total / numElements;
}
function meanWindow(grid, centreX, centreY, offsets) {
  let total = 0;
  const numElements = offsets.length * offsets.length;
  for (const dy in offsets) {
    const y = centreY + offsets[dy];
    for (const dx in offsets) {
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
  for (const dy in offsets) {
    const y = centreY + offsets[dy];
    const row = new Float32Array(size);
    let wx = 0;
    for (const dx in offsets) {
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
  const filterSize = 5;
  const halfSize = Math.floor(filterSize / 2);
  const offsets = [-2, -1, 0, 1, 2];
  const distancesSquared = [4, 1, 0, 1, 4];
  const result = new Array();
  for (let y = 0; y < halfSize; y++) {
    result[y] = grid[y];
  }
  for (let y = depth - halfSize; y < depth; y++) {
    result[y] = grid[y];
  }
  const filter = new Float32Array(filterSize);
  for (let y = halfSize; y < depth - halfSize; y++) {
    result[y] = new Float32Array(width);
    for (let x = 0; x < halfSize; x++) {
      result[y][x] = grid[y][x];
    }
    for (let x = width - halfSize; x < width; x++) {
      result[y][x] = grid[y][x];
    }
    for (let x = halfSize; x < width - halfSize; x++) {
      const sigma = standardDevWindow(grid, x, y, offsets);
      if (sigma == 0) {
        continue;
      }
      const sigmaSquared = sigma * sigma;
      const denominator = Math.sqrt(2 * Math.PI * sigmaSquared);
      let sum = 0;
      for (const i in distancesSquared) {
        const numerator = Math.exp(-(distancesSquared[i] / (2 * sigmaSquared)));
        filter[i] = numerator / denominator;
        sum += filter[i];
      }
      for (let coeff of filter) {
        coeff /= sum;
      }
      let blurred = 0;
      for (const i in offsets) {
        const dx = offsets[i];
        blurred += grid[y][x + dx] * filter[i];
      }
      for (const i in offsets) {
        const dy = offsets[i];
        blurred += grid[y + dy][x] * filter[i];
      }
      result[y][x] = blurred;
    }
  }
  return result;
}
var TerrainAttributes = class {
  constructor(_x, _y, _height) {
    this._x = _x;
    this._y = _y;
    this._height = _height;
    this._fixed = false;
    this._moisture = 0;
    this._biome = 0 /* Water */;
    this._terrace = 0;
    this._type = 0 /* Water */;
    this._shape = 0 /* Flat */;
    this._features = 0 /* None */;
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
};
var Surface = class {
  constructor(_width, _depth) {
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
    for (let y = 0; y < this._depth; y++) {
      this._surface.push(new Array());
      for (let x = 0; x < this._width; x++) {
        const height = heightMap[y][x];
        this._surface[y].push(new TerrainAttributes(x, y, height));
      }
    }
  }
  inbounds(coord) {
    if (coord.x < 0 || coord.x >= this._width || coord.y < 0 || coord.y >= this._depth) {
      return false;
    }
    return true;
  }
  at(x, y) {
    return this._surface[y][x];
  }
  // Return surface neighbours in a 3x3 radius.
  getNeighbours(centreX, centreY) {
    const neighbours = new Array();
    for (let yDiff = -1; yDiff < 2; yDiff++) {
      const y = centreY + yDiff;
      if (y < 0 || y >= this._depth) {
        continue;
      }
      for (let xDiff = -1; xDiff < 2; xDiff++) {
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
};
var TerrainBuilderConfig = class {
  constructor(_numTerraces, _defaultFloor, _defaultWall) {
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
    this._rainDirection = 0 /* North */;
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
};
var TerrainBuilder = class {
  constructor(width, depth, heightMap, _config, physicalDims) {
    this._config = _config;
    Terrain.init(physicalDims);
    let minHeight = 0;
    let maxHeight = 0;
    for (let y = 0; y < depth; y++) {
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
      for (let y = 0; y < depth; y++) {
        for (let x = 0; x < width; x++) {
          heightMap[y][x] += minHeight;
        }
      }
      maxHeight += minHeight;
    }
    this._terraceSpacing = maxHeight / this.config.numTerraces;
    this._surface = new Surface(width, depth);
    this.surface.init(heightMap);
    for (let y = 0; y < this.surface.depth; y++) {
      for (let x = 0; x < this.surface.width; x++) {
        const surface = this.surface.at(x, y);
        surface.terrace = Math.floor(surface.height / this._terraceSpacing);
        surface.shape = 0 /* Flat */;
        surface.type = this.config.floor;
        console.assert(
          surface.terrace <= this.config.numTerraces && surface.terrace >= 0,
          "terrace out of range:",
          surface.terrace
        );
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
    console.assert(
      x >= 0 && x < this.surface.width && y >= 0 && y < this.surface.depth
    );
    return (this.surface.at(x, y).features & feature) != 0;
  }
  terrainTypeAt(x, y) {
    console.assert(
      x >= 0 && x < this.surface.width && y >= 0 && y < this.surface.depth
    );
    return this.surface.at(x, y).type;
  }
  terrainShapeAt(x, y) {
    console.assert(
      x >= 0 && x < this.surface.width && y >= 0 && y < this.surface.depth
    );
    return this.surface.at(x, y).shape;
  }
  moistureAt(x, y) {
    console.assert(
      x >= 0 && x < this.surface.width && y >= 0 && y < this.surface.depth
    );
    return this.surface.at(x, y).moisture;
  }
  isFlatAt(x, y) {
    console.assert(
      x >= 0 && x < this.surface.width && y >= 0 && y < this.surface.depth
    );
    return Terrain.isFlat(this.surface.at(x, y).shape);
  }
  biomeAt(x, y) {
    console.assert(
      x >= 0 && x < this.surface.width && y >= 0 && y < this.surface.depth
    );
    return this.surface.at(x, y).biome;
  }
  relativeHeightAt(x, y) {
    console.assert(
      x >= 0 && x < this.surface.width && y >= 0 && y < this.surface.depth
    );
    return this.surface.at(x, y).terrace;
  }
  generateMap(context) {
    if (this.config.ramps) {
      this.setShapes();
    }
    if (this.config.rainfall > 0) {
      this.addRain(
        this.config.rainDirection,
        this.config.rainfall,
        this.config.waterLine
      );
    }
    if (this.config.biomes || this.config.hasWater) {
      this.setBiomes();
    }
    this.setEdges();
    this.setFeatures();
    const grid = new TerrainGrid(
      context,
      this.surface.width,
      this.surface.depth
    );
    for (let y = 0; y < this.surface.depth; y++) {
      for (let x = 0; x < this.surface.width; x++) {
        const surface = this.surface.at(x, y);
        console.assert(
          surface.terrace <= this.config.numTerraces && surface.terrace >= 0,
          "terrace out-of-range",
          surface.terrace
        );
        grid.addSurfaceTerrain(
          x,
          y,
          surface.terrace,
          surface.type,
          surface.shape,
          surface.features
        );
      }
    }
    for (let y = 0; y < this.surface.depth; y++) {
      for (let x = 0; x < this.surface.width; x++) {
        let z = this.surface.at(x, y).terrace;
        const zStop = z - this.calcRelativeHeight(x, y);
        const terrain = grid.getSurfaceTerrainAt(x, y);
        if (terrain == null) {
          console.error("didn't find terrain in map at", x, y, z);
        }
        const shape = Terrain.isFlat(terrain.shape) ? terrain.shape : 0 /* Flat */;
        while (z > zStop) {
          z--;
          grid.addSubSurfaceTerrain(x, y, z, terrain.type, shape);
        }
      }
    }
    return grid;
  }
  setShapes() {
    const coordOffsets = [
      new Point2D(0, 1),
      new Point2D(-1, 0),
      new Point2D(0, -1),
      new Point2D(1, 0)
    ];
    const ramps = [
      19 /* RampUpSouth */,
      20 /* RampUpWest */,
      22 /* RampUpNorth */,
      21 /* RampUpEast */
    ];
    let totalRamps = 0;
    for (let y = this.surface.depth - 3; y > 1; y--) {
      for (let x = 2; x < this.surface.width - 2; x++) {
        const centre = this.surface.at(x, y);
        if (!Terrain.isFlat(centre.shape)) {
          continue;
        }
        const roundUpHeight = centre.height + this.terraceSpacing / 2;
        if (roundUpHeight != (centre.terrace + 1) * this.terraceSpacing) {
          continue;
        }
        for (const i in coordOffsets) {
          const offset = coordOffsets[i];
          const neighbour = this.surface.at(
            centre.x + offset.x,
            centre.y + offset.y
          );
          const nextNeighbour = this.surface.at(
            neighbour.x + offset.x,
            neighbour.y + offset.y
          );
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
    for (let y = 0; y < this.surface.depth; y++) {
      for (let x = 0; x < this.surface.width; x++) {
        const centre = this.surface.at(x, y);
        if (centre.type == 0 /* Water */) {
          continue;
        }
        const neighbours = this.surface.getNeighbours(x, y);
        let shapeType = centre.shape;
        let northEdge = false;
        let eastEdge = false;
        let southEdge = false;
        let westEdge = false;
        for (const neighbour of neighbours) {
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
          if (northEdge && eastEdge && southEdge && westEdge) {
            break;
          }
        }
        if (shapeType == 0 /* Flat */) {
          if (northEdge && eastEdge && southEdge && westEdge) {
            shapeType = 14 /* FlatAloneOut */;
          } else if (northEdge && eastEdge && westEdge) {
            shapeType = 10 /* FlatNorthOut */;
          } else if (northEdge && eastEdge && southEdge) {
            shapeType = 11 /* FlatEastOut */;
          } else if (eastEdge && southEdge && westEdge) {
            shapeType = 13 /* FlatSouthOut */;
          } else if (southEdge && westEdge && northEdge) {
            shapeType = 12 /* FlatWestOut */;
          } else if (northEdge && eastEdge) {
            shapeType = 6 /* FlatNorthEast */;
          } else if (northEdge && westEdge) {
            shapeType = 4 /* FlatNorthWest */;
          } else if (northEdge) {
            shapeType = 5 /* FlatNorth */;
          } else if (southEdge && eastEdge) {
            shapeType = 9 /* FlatSouthEast */;
          } else if (southEdge && westEdge) {
            shapeType = 7 /* FlatSouthWest */;
          } else if (southEdge) {
            shapeType = 8 /* FlatSouth */;
          } else if (eastEdge) {
            shapeType = 3 /* FlatEast */;
          } else if (westEdge) {
            shapeType = 2 /* FlatWest */;
          }
        } else if (shapeType == 22 /* RampUpNorth */ && eastEdge) {
          if (Terrain.isSupportedShape(centre.type, 18 /* RampUpNorthEdge */)) {
            shapeType = 18 /* RampUpNorthEdge */;
          }
        } else if (shapeType == 21 /* RampUpEast */ && northEdge) {
          if (Terrain.isSupportedShape(centre.type, 17 /* RampUpEastEdge */)) {
            shapeType = 17 /* RampUpEastEdge */;
          }
        } else if (shapeType == 19 /* RampUpSouth */ && eastEdge) {
          if (Terrain.isSupportedShape(centre.type, 15 /* RampUpSouthEdge */)) {
            shapeType = 15 /* RampUpSouthEdge */;
          }
        } else if (shapeType == 20 /* RampUpWest */ && northEdge) {
          if (Terrain.isSupportedShape(centre.type, 16 /* RampUpWestEdge */)) {
            shapeType = 16 /* RampUpWestEdge */;
          }
        }
        if (centre.terrace > 0 && shapeType == 0 /* Flat */ && neighbours.length != 8) {
          shapeType = 1 /* Wall */;
        }
        if (Terrain.isFlat(shapeType) && Terrain.isEdge(shapeType)) {
          if (!this.config.biomes) {
            centre.type = this.config.wall;
          }
          if (!Terrain.isSupportedShape(centre.type, shapeType)) {
            switch (shapeType) {
              default:
                shapeType = 1 /* Wall */;
                break;
              case 10 /* FlatNorthOut */:
                if (Terrain.isSupportedShape(centre.type, 5 /* FlatNorth */)) {
                  shapeType = 5 /* FlatNorth */;
                } else {
                  shapeType = 1 /* Wall */;
                }
                break;
              case 6 /* FlatNorthEast */:
              case 9 /* FlatSouthEast */:
                if (Terrain.isSupportedShape(centre.type, 3 /* FlatEast */)) {
                  shapeType = 3 /* FlatEast */;
                } else {
                  shapeType = 1 /* Wall */;
                }
                break;
              case 4 /* FlatNorthWest */:
                if (Terrain.isSupportedShape(
                  centre.type,
                  12 /* FlatWestOut */
                )) {
                  shapeType = 12 /* FlatWestOut */;
                } else {
                  shapeType = 1 /* Wall */;
                }
                break;
              case 7 /* FlatSouthWest */:
                if (Terrain.isSupportedShape(centre.type, 2 /* FlatWest */)) {
                  shapeType = 2 /* FlatWest */;
                } else {
                  shapeType = 1 /* Wall */;
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
          shapeType = 0 /* Flat */;
        }
        centre.shape = shapeType;
      }
    }
  }
  calcRelativeHeight(x, y) {
    const neighbours = this.surface.getNeighbours(x, y);
    let relativeHeight = 0;
    const centre = this.surface.at(x, y);
    for (const neighbour of neighbours) {
      console.assert(
        neighbour.terrace >= 0,
        "Found neighbour with negative terrace!",
        neighbour.terrace
      );
      const height = centre.terrace - neighbour.terrace;
      relativeHeight = Math.max(height, relativeHeight);
    }
    console.assert(
      relativeHeight <= this.config.numTerraces,
      "impossible relative height:",
      relativeHeight,
      "\ncentre:",
      centre
    );
    return relativeHeight;
  }
  addRain(towards, water, waterLine) {
    const rain = new Rain(this.surface, waterLine, water, towards);
    rain.run();
    const blurred = gaussianBlur(
      rain.moistureGrid,
      this.surface.width,
      this.surface.depth
    );
    for (let y = 0; y < this.surface.depth; y++) {
      for (let x = 0; x < this.surface.width; x++) {
        const surface = this.surface.at(x, y);
        surface.moisture = blurred[y][x];
      }
    }
  }
  setBiomes() {
    const moistureRange = 6;
    for (let y = 0; y < this.surface.depth; y++) {
      for (let x = 0; x < this.surface.width; x++) {
        const surface = this.surface.at(x, y);
        let biome = 0 /* Water */;
        let terrain = 0 /* Water */;
        const moisturePercent = Math.min(1, surface.moisture / moistureRange);
        const moistureScaled = Math.floor(5 * moisturePercent);
        if (surface.height <= this.config.waterLine) {
          biome = 0 /* Water */;
          terrain = 0 /* Water */;
        } else if (surface.height >= this.config.uplandThreshold) {
          console.log(
            "height, threshold",
            surface.height,
            this.config.uplandThreshold
          );
          switch (moistureScaled) {
            default:
              console.error("unhandled moisture scale");
              break;
            case 0:
              biome = 7 /* Rock */;
              terrain = 7 /* Upland0 */;
              break;
            case 1:
              biome = 8 /* Tundra */;
              terrain = 8 /* Upland1 */;
              break;
            case 2:
              biome = 9 /* AlpineGrassland */;
              terrain = 9 /* Upland2 */;
              break;
            case 3:
              biome = 10 /* AlpineMeadow */;
              terrain = 10 /* Upland3 */;
              break;
            case 4:
              biome = 11 /* AlpineForest */;
              terrain = 11 /* Upland4 */;
              break;
            case 5:
              biome = 12 /* Taiga */;
              terrain = 12 /* Upland5 */;
              break;
          }
        } else {
          switch (moistureScaled) {
            default:
              console.error("unhandled moisture scale");
              break;
            case 0:
              biome = 1 /* Desert */;
              terrain = 1 /* Lowland0 */;
              break;
            case 1:
              biome = 2 /* Grassland */;
              terrain = 2 /* Lowland1 */;
              break;
            case 2:
              biome = 3 /* Shrubland */;
              terrain = 3 /* Lowland2 */;
              break;
            case 3:
              biome = 4 /* MoistForest */;
              terrain = 4 /* Lowland3 */;
              break;
            case 4:
              biome = 5 /* WetForest */;
              terrain = 5 /* Lowland4 */;
              break;
            case 5:
              biome = 6 /* RainForest */;
              terrain = 6 /* Lowland5 */;
              break;
          }
        }
        if (Terrain.isSupportedType(terrain)) {
          surface.type = terrain;
        } else {
          console.log(
            "unsupported biome terrain type:",
            Terrain.getTypeName(terrain)
          );
        }
        surface.biome = biome;
      }
    }
  }
  setFeatures() {
    for (let y = 0; y < this.surface.depth; y++) {
      for (let x = 0; x < this.surface.width; x++) {
        const surface = this.surface.at(x, y);
        if (Terrain.isFlat(surface.shape)) {
          const neighbours = this.surface.getNeighbours(surface.x, surface.y);
          for (const neighbour of neighbours) {
            if (neighbour.biome != 0 /* Water */) {
              continue;
            }
            switch (Navigation.getDirectionFromPoints(surface.pos, neighbour.pos)) {
              default:
                break;
              case 0 /* North */:
                surface.features |= 2 /* ShorelineNorth */;
                break;
              case 2 /* East */:
                surface.features |= 4 /* ShorelineEast */;
                break;
              case 4 /* South */:
                surface.features |= 8 /* ShorelineSouth */;
                break;
              case 6 /* West */:
                surface.features |= 16 /* ShorelineWest */;
                break;
            }
          }
          if (surface.biome == 2 /* Grassland */) {
            surface.features |= 32 /* DryGrass */;
          } else if (surface.biome == 8 /* Tundra */) {
            surface.features |= 32 /* DryGrass */;
          }
        }
      }
    }
  }
};

// src/tree.ts
var _OctNode = class {
  constructor(_bounds) {
    this._bounds = _bounds;
    this._children = new Array();
    this._entities = new Array();
  }
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
    for (const child of this.children) {
      total += child.recursiveCountNumEntities;
    }
    return total;
  }
  insert(entity) {
    let inserted = false;
    if (this.children.length == 0) {
      this.entities.push(entity);
      this.bounds.insert(entity.bounds);
      if (this.entities.length > _OctNode.MaxEntities) {
        inserted = this.split();
      } else {
        inserted = true;
      }
    } else {
      for (const child of this.children) {
        if (child.bounds.containsBounds(entity.bounds)) {
          inserted = child.insert(entity);
          break;
        }
      }
      if (!inserted) {
        for (const child of this.children) {
          if (child.containsLocation(entity.centre)) {
            inserted = child.insert(entity);
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
    const offset = [-0.5, 0.5];
    for (let z = 0; z < 2; z++) {
      for (let y = 0; y < 2; y++) {
        for (let x = 0; x < 2; x++) {
          const offsetX = offset[x] * dimensions.width;
          const offsetY = offset[y] * dimensions.depth;
          const offsetZ = offset[z] * dimensions.height;
          const centre = new Point3D(
            this.centre.x + offsetX,
            this.centre.y + offsetY,
            this.centre.z + offsetZ
          );
          const bounds = new BoundingCuboid(centre, dimensions);
          this.children.push(new _OctNode(bounds));
        }
      }
    }
    const insertIntoChild = function(child, entity) {
      if (child.containsLocation(entity.bounds.centre)) {
        return child.insert(entity);
      }
      return false;
    };
    for (const entity of this._entities) {
      let inserted = false;
      for (const child of this._children) {
        if (insertIntoChild(child, entity)) {
          inserted = true;
          break;
        }
      }
      console.assert(
        inserted,
        "failed to insert into children, entity centred at:",
        entity.bounds.centre
      );
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
    for (const child of this._children) {
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
    for (const child of this.children) {
      if (child.recursiveRemoveEntity(entity)) {
        return true;
      }
    }
    return false;
  }
};
var OctNode = _OctNode;
// 3x3x3 rounded up to a nice number.
OctNode.MaxEntities = 30;
var Octree = class {
  constructor(dimensions) {
    this._numEntities = 0;
    const x = dimensions.width / 2;
    const y = dimensions.depth / 2;
    const z = dimensions.height / 2;
    const centre = new Point3D(x, y, z);
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
    const inserted = this._root.insert(entity);
    console.assert(inserted, "failed to insert");
    this._numEntities++;
  }
  findEntitiesInArea(root, area, entities) {
    if (root.entities.length != 0) {
      root.entities.forEach((entity) => entities.push(entity));
    } else {
      for (const child of root.children) {
        if (!child.bounds.intersects(area)) {
          continue;
        }
        this.findEntitiesInArea(child, area, entities);
      }
    }
  }
  getEntities(area) {
    const entities = new Array();
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
    for (const entity of entities) {
      if (!this._root.recursivelyContainsEntity(entity)) {
        console.error(
          "tree doesn't contain entity at (x,y,z):",
          entity.x,
          entity.y,
          entity.z
        );
        return false;
      }
    }
    return true;
  }
};

// src/context.ts
var ContextImpl = class {
  constructor(worldDims, perspective) {
    this._entities = new Array();
    this._updateables = new Array();
    this._movables = new Array();
    this._controllers = new Array();
    this._totalEntities = 0;
    this._spatialGraph = new Octree(worldDims);
    CollisionDetector.init(this._spatialGraph);
    switch (perspective) {
      default:
        console.error("unhandled perspective");
        break;
      case 0 /* TrueIsometric */:
        this._scene = new Scene(new TrueIsometric());
        break;
      case 1 /* TwoByOneIsometric */:
        this._scene = new Scene(new TwoByOneIsometric());
        break;
    }
    this._renderer = new DummyRenderer();
  }
  static reset() {
    PhysicalEntity.reset();
    Terrain.reset();
    SpriteSheet.reset();
  }
  get scene() {
    return this._scene;
  }
  get renderer() {
    return this._renderer;
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
  addOnscreenRenderer(canvas) {
    this._renderer = new OnscreenRenderer(canvas);
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
    entity.addEventListener("moving" /* Moving */, () => {
      this.spatial.update(entity);
      this.scene.updateEntity(entity);
    });
  }
  update(camera) {
    camera.update();
    const elements = this._scene.render(camera, false);
    this.renderer.draw(elements);
    Gravity.update(this._movables);
    this._updateables.forEach((entity) => {
      entity.update();
    });
    this._controllers.forEach((controller) => {
      controller.update();
    });
  }
};
function createContext(canvas, worldDims, perspective) {
  ContextImpl.reset();
  const context = new ContextImpl(worldDims, perspective);
  context.addOnscreenRenderer(canvas);
  return context;
}
function createTestContext(worldDims, perspective) {
  ContextImpl.reset();
  const context = new ContextImpl(worldDims, perspective);
  return context;
}

// src/camera.ts
var Camera = class {
  constructor(_scene, width, height) {
    this._scene = _scene;
    this._lowerX = 0;
    this._lowerY = 0;
    this._handler = new EventHandler();
    this._width = Math.floor(width);
    this._height = Math.floor(height);
    this._upperX = Math.floor(width);
    this._upperY = Math.floor(height);
    this._surfaceLocation = _scene.getLocationAt(
      this._lowerX,
      this._lowerY,
      this
    );
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
    if (newLocation == void 0) {
      console.log("undefined camera surface location");
      return;
    }
    const newPoint = this._scene.graph.getDrawCoord(newLocation);
    this.x = newPoint.x;
    this.y = newPoint.y;
    this._handler.post("cameraMove" /* CameraMove */);
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
};
var MouseCamera = class extends Camera {
  constructor(scene, canvas, width, height) {
    super(scene, width, height);
    canvas.addEventListener("mousedown", (e) => {
      if (e.button == 0) {
        this.location = scene.getLocationAt(e.offsetX, e.offsetY, this);
      }
    });
    canvas.addEventListener("touchstart", (e) => {
      const touch = e.touches[0];
      this.location = scene.getLocationAt(touch.pageX, touch.pageY, this);
    });
  }
};
var TrackerCamera = class extends Camera {
  constructor(scene, width, height, movable) {
    super(scene, width, height);
    this.location = movable.centre;
    movable.addEventListener("moving" /* Moving */, () => {
      this.location = movable.centre;
    });
  }
};

// src/action.ts
var Action = class {
  constructor(_actor) {
    this._actor = _actor;
  }
  get actor() {
    return this._actor;
  }
  set actor(actor) {
    this._actor = actor;
  }
};
var MoveAction = class extends Action {
  constructor(actor) {
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
};
var MoveDirection = class extends MoveAction {
  constructor(actor, _d, _bounds) {
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
      this.actor.postEvent("endMove" /* EndMove */);
      return true;
    }
    console.log("adjusting movement with max angle");
    this.actor.updatePosition(this._d);
    return false;
  }
};
var MoveDestination = class extends MoveAction {
  constructor(actor, _step, _destination) {
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
    console.assert(
      maxD.x == 0 || maxD.y == 0 || maxD.z == 0,
      "can only change distance along two axes simultaneously"
    );
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
    this.actor.postEvent("moving" /* Moving */);
    return bounds.minLocation.isSameAsRounded(this.destination);
  }
};
var Navigate = class extends Action {
  constructor(actor, _step, _destination) {
    super(actor);
    this._step = _step;
    this._destination = _destination;
    this._index = 0;
  }
  perform() {
    if (this._waypoints.length == 0) {
      return true;
    }
    const finishedStep = this._currentStep.perform();
    if (!finishedStep) {
      return false;
    }
    if (!this._currentStep.destination.isSameAsRounded(
      this._actor.bounds.minLocation
    )) {
      return true;
    }
    this._index++;
    if (this._index == this._waypoints.length) {
      return true;
    }
    const nextLocation = this._waypoints[this._index];
    this._currentStep = new MoveDestination(
      this._actor,
      this._step,
      nextLocation
    );
    return false;
  }
};

// src/sound.ts
var _Sound = class {
  static pause(id) {
    this._tracks[id].pause();
  }
  static play(id, volume) {
    if (volume > this._maxVolume) {
      volume = this._maxVolume;
    }
    const track = this._tracks[id];
    console.log("play music at:", volume);
    track.volume = volume;
    if (!track.playing) {
      track.play();
    }
  }
  constructor(name, loop) {
    this._id = _Sound._tracks.length;
    this._track = new Audio(name);
    console.assert(this._track != void 0, "failed to create audio");
    this._track.loop = loop;
    _Sound._tracks.push(this);
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
};
var Sound = _Sound;
Sound._tracks = new Array();
Sound._maxVolume = 0.8;
var ZonalAudioLoop = class extends Sound {
  constructor(name, area, camera) {
    super(name, true);
    const id = this._id;
    const maxDistance = Math.sqrt(
      Math.pow(area.maxX - area.minX, 2) + Math.pow(area.maxY - area.minY, 2) + Math.pow(area.maxZ - area.minZ, 2)
    ) / 2;
    console.log("centre of audio zone (x,y):", area.centre.x, area.centre.y);
    console.log("max distance from centre:", maxDistance);
    const maybePlay = function() {
      const location = camera.location;
      if (location == void 0) {
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
      const volume = Sound._maxVolume * Math.exp(-8 * (dx + dy));
      Sound.play(id, volume);
    };
    camera.addEventListener("cameraMove" /* CameraMove */, maybePlay);
    window.addEventListener("focus", maybePlay);
    window.addEventListener("blur", () => {
      Sound.pause(id);
    });
  }
};

// src/debug.ts
function getAllSegments(node) {
  const allSegments = new Array();
  node.topSegments.forEach((segment) => allSegments.push(segment));
  node.baseSegments.forEach((segment) => allSegments.push(segment));
  node.sideSegments.forEach((segment) => allSegments.push(segment));
  return allSegments;
}
var MovableEntityDebug = class {
  constructor(movable, camera, debugCollision) {
    if (debugCollision) {
      this.debugCollision(movable, camera);
    }
  }
  debugCollision(movable, camera) {
    const context = movable.context;
    movable.addEventListener("moving" /* Moving */, function() {
      if (!CollisionDetector.hasMissInfo(movable)) {
        return;
      }
      const missedEntities = CollisionDetector.getMissInfo(movable);
      const scene = context.scene;
      const start = Date.now();
      scene.addTimedEvent(function() {
        if (scene.ctx != null) {
          scene.ctx.strokeStyle = "Green";
          for (const entity of missedEntities) {
            const sceneNode = scene.getNode(entity.id);
            for (const segment of getAllSegments(sceneNode)) {
              scene.ctx.beginPath();
              const drawP0 = camera.getDrawCoord(segment.p0);
              const drawP1 = camera.getDrawCoord(segment.p1);
              scene.ctx.moveTo(drawP0.x, drawP0.y);
              scene.ctx.lineTo(drawP1.x, drawP1.y);
              scene.ctx.stroke();
            }
          }
        }
        return Date.now() > start + 1e3;
      });
    });
    movable.addEventListener("collision" /* Collision */, function() {
      console.log("collision detected");
      if (!CollisionDetector.hasCollideInfo(movable)) {
        console.log("but no info available");
        return;
      }
      const collisionInfo = CollisionDetector.getCollideInfo(movable);
      const intersectInfo = collisionInfo.intersectInfo;
      const collidedEntity = collisionInfo.entity;
      const collidedFace = intersectInfo.face;
      const scene = context.scene;
      const start = Date.now();
      scene.addTimedEvent(function() {
        if (scene.ctx != null) {
          const ctx = scene.ctx;
          ctx.strokeStyle = "Green";
          for (const segment of getAllSegments(scene.getNode(movable.id))) {
            ctx.beginPath();
            const drawP0 = camera.getDrawCoord(segment.p0);
            const drawP1 = camera.getDrawCoord(segment.p1);
            ctx.moveTo(drawP0.x, drawP0.y);
            ctx.lineTo(drawP1.x, drawP1.y);
            ctx.stroke();
          }
          ctx.strokeStyle = "Orange";
          for (const segment of getAllSegments(
            scene.getNode(collidedEntity.id)
          )) {
            ctx.beginPath();
            const drawP0 = camera.getDrawCoord(segment.p0);
            const drawP1 = camera.getDrawCoord(segment.p1);
            ctx.moveTo(drawP0.x, drawP0.y);
            ctx.lineTo(drawP1.x, drawP1.y);
            ctx.stroke();
          }
          ctx.strokeStyle = "Red";
          ctx.fillStyle = "Red";
          for (const vertex of collidedFace.vertices()) {
            ctx.beginPath();
            const p0 = camera.getDrawCoord(
              scene.graph.getDrawCoord(vertex.point)
            );
            const p1 = camera.getDrawCoord(
              scene.graph.getDrawCoord(vertex.point.add(vertex.u))
            );
            const p2 = camera.getDrawCoord(
              scene.graph.getDrawCoord(vertex.point.add(vertex.v))
            );
            ctx.beginPath();
            ctx.moveTo(p0.x, p0.y);
            ctx.lineTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.closePath();
            ctx.stroke();
            ctx.fill();
          }
        }
        return Date.now() > start + 1e3;
      });
      CollisionDetector.removeInfo(movable);
    });
  }
};
export {
  Action,
  Actor,
  AnimatedDirectionalGraphicComponent,
  AnimatedGraphicComponent,
  Biome,
  BoundingCuboid,
  Camera,
  CollisionDetector,
  CollisionInfo,
  ContextImpl,
  CuboidGeometry,
  Dimensions,
  Direction,
  DirectionalGraphicComponent,
  DrawElement,
  DrawElementList,
  DummyGraphicComponent,
  DummyRenderer,
  DummySpriteSheet,
  EntityEvent,
  EventHandler,
  Face3D,
  Geometry,
  GraphicComponent,
  GraphicEvent,
  Gravity,
  InputEvent,
  IntersectInfo,
  IsometricPhysicalDimensions,
  LoopGraphicComponent,
  MinPriorityQueue,
  MouseCamera,
  MovableEntity,
  MovableEntityDebug,
  MoveDestination,
  MoveDirection,
  Navigate,
  Navigation,
  NoGeometry,
  OffscreenRenderer,
  OnscreenRenderer,
  Orientation,
  OssilateGraphicComponent,
  PathFinder,
  Perspective,
  PhysicalEntity,
  Point2D,
  Point3D,
  QuadFace3D,
  RampUpEastGeometry,
  RampUpNorthGeometry,
  RampUpSouthGeometry,
  RampUpWestGeometry,
  RenderOrder,
  Scene,
  SceneGraph,
  SceneLevel,
  SceneNode,
  Segment2D,
  Sound,
  Sprite,
  SpriteSheet,
  StaticGraphicComponent,
  Surface,
  Terrain,
  TerrainBuilder,
  TerrainBuilderConfig,
  TerrainFeature,
  TerrainGrid,
  TerrainShape,
  TerrainType,
  TimedEventHandler,
  TrackerCamera,
  TrueIsometric,
  TwoByOneIsometric,
  Vector2D,
  Vector3D,
  Vertex3D,
  ZonalAudioLoop,
  createContext,
  createGraphicalActor,
  createGraphicalEntity,
  createGraphicalMovableEntity,
  createTestContext,
  generateSprites,
  generateStaticGraphics,
  getBiomeName
};
