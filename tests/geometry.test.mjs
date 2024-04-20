import * as WT from "../dist/world-tree.mjs";

test("2D point addition and subtraction", () => {
  const p0 = new WT.Point2D(6, 7);
  const p1 = new WT.Point2D(10, 12);
  const add = p1.add(p0);
  const sub = p1.sub(p0);
  expect(add.x).toBe(16);
  expect(add.y).toBe(19);
  expect(sub.x).toBe(4);
  expect(sub.y).toBe(5);
});

test("2D point orientation", () => {
  const p0 = new WT.Point2D(1, 1);
  const p1 = new WT.Point2D(2, 2);
  const p2 = new WT.Point2D(1, 3);
  const p3 = new WT.Point2D(3, 3);

  expect(WT.Point2D.orientation(p0, p2, p1)).toBe(WT.Orientation.Clockwise);
  expect(WT.Point2D.orientation(p0, p1, p2)).toBe(
    WT.Orientation.CounterClockwise
  );
  expect(WT.Point2D.orientation(p0, p1, p3)).toBe(WT.Orientation.Colinear);
});

test("2D segment intersection (vertically parallel)", () => {
  const p0 = new WT.Point2D(1, 1);
  const p1 = new WT.Point2D(1, 3);
  const p2 = new WT.Point2D(2, 1);
  const p3 = new WT.Point2D(2, 3);
  const s0 = new WT.Segment2D(p0, p1);
  const s1 = new WT.Segment2D(p2, p3);

  expect(s0.contains(p2)).toBe(false);
  expect(s0.contains(p3)).toBe(false);
  expect(s0.intersects(s1)).toBe(false);
  expect(s1.contains(p0)).toBe(false);
  expect(s1.contains(p1)).toBe(false);
  expect(s1.intersects(s0)).toBe(false);
});

test("2D segment intersection (horizontally parallel)", () => {
  const p0 = new WT.Point2D(1, 1);
  const p1 = new WT.Point2D(3, 1);
  const p2 = new WT.Point2D(1, 2);
  const p3 = new WT.Point2D(3, 2);
  const s0 = new WT.Segment2D(p0, p1);
  const s1 = new WT.Segment2D(p2, p3);

  expect(s0.contains(p2)).toBe(false);
  expect(s0.contains(p3)).toBe(false);
  expect(s0.intersects(s1)).toBe(false);
  expect(s1.contains(p0)).toBe(false);
  expect(s1.contains(p1)).toBe(false);
  expect(s1.intersects(s0)).toBe(false);
});

test("2D point on 2D segment", () => {
  const p0 = new WT.Point2D(1, 1);
  const p1 = new WT.Point2D(3, 1);
  const p2 = new WT.Point2D(1, 3);
  const p4 = new WT.Point2D(1, 2);
  const p3 = new WT.Point2D(2, 1);
  const s0 = new WT.Segment2D(p0, p1);
  const s1 = new WT.Segment2D(p0, p2);
  expect(s0.contains(p3)).toBe(true);
  expect(s1.contains(p3)).toBe(false);
  expect(s1.contains(p4)).toBe(true);
  expect(s0.contains(p4)).toBe(false);
});

test("2D segment intersection with shared point", () => {
  const p0 = new WT.Point2D(1, 1);
  const p1 = new WT.Point2D(3, 1);
  const p3 = new WT.Point2D(3, 2);
  const s0 = new WT.Segment2D(p0, p1);
  const s1 = new WT.Segment2D(p0, p3);

  expect(s0.intersects(s1)).toBe(false);
  expect(s1.intersects(s0)).toBe(false);
});

test("2D segments crossing", () => {
  const p0 = new WT.Point2D(1, 1);
  const p1 = new WT.Point2D(3, 3);
  const p2 = new WT.Point2D(1, 3);
  const p3 = new WT.Point2D(3, 1);
  const s0 = new WT.Segment2D(p0, p1);
  const s1 = new WT.Segment2D(p2, p3);

  expect(s0.intersects(s1)).toBe(true);
  expect(s1.intersects(s0)).toBe(true);
});

test("3D point arithmetic", () => {
  const p0 = new WT.Point3D(1, 2, 3);
  const p1 = new WT.Point3D(10, 9, 8);
  const v0 = new WT.Vector3D(2, 3, 4);
  const diff = p0.vec_diff(p1);
  const add = p0.add(v0);
  const sub = p1.sub(v0);

  expect(diff.x).toBe(-9);
  expect(diff.y).toBe(-7);
  expect(diff.z).toBe(-5);
  expect(add.x).toBe(3);
  expect(add.y).toBe(5);
  expect(add.z).toBe(7);
  expect(sub.x).toBe(8);
  expect(sub.y).toBe(6);
  expect(sub.z).toBe(4);
});

test("Vector3D magnitude", () => {
  const vec = new WT.Vector3D(4, 2, 4);
  expect(vec.mag()).toBe(6);
});

test("Vector3D norm", () => {
  const vec = new WT.Vector3D(4, 2, 4);
  const expected = new WT.Vector3D(4 / 6, 2 / 6, 4 / 6);
  expect(vec.norm()).toStrictEqual(expected);
});

test("compare 3D points", () => {
  const p0 = new WT.Point3D(1.5, 2.5, 3.5);
  const p1 = new WT.Point3D(1.5, 2.5, 3.5);
  const p2 = new WT.Point3D(1.6, 2.2, 3.1);
  const p3 = new WT.Point3D(2, 2, 3);
  expect(p0.isSameAs(p1)).toBe(true);
  expect(p1.isSameAs(p2)).toBe(false);
  expect(p2.isSameAsRounded(p0)).toBe(false);
  expect(p2.isSameAsRounded(p3)).toBe(true);
});

test("vertex plane", () => {
  const dims = new WT.Dimensions(2, 2, 2);
  const centre = new WT.Point3D(1, 1, 1);
  const widthVec = new WT.Vector3D(2, 0, 0);
  const depthVec = new WT.Vector3D(0, 2, 0);
  const heightVec = new WT.Vector3D(0, 0, 2);
  const bounds = new WT.BoundingCuboid(centre, dims);

  // four points that could represent the base of a cube
  const p0 = bounds.minLocation;
  const p1 = bounds.minLocation.add(depthVec);
  const p2 = bounds.minLocation.add(widthVec);
  const p3 = p2.add(depthVec);

  const v0 = new WT.Vertex3D(p3, p2, p1);
  const v1 = new WT.Vertex3D(p0, p1, p2);
  expect(v0.normal.equal(v1.normal)).toBe(true);
});

test("cuboid obstruction", () => {
  const worldDims = new WT.Dimensions(20, 20, 20);
  const context = WT.createTestContext(
    worldDims,
    WT.Perspective.TwoByOneIsometric
  );
  const dims = new WT.Dimensions(10, 10, 10);
  const minLocation = new WT.Point3D(0, 0, 0);
  const entity = new WT.PhysicalEntity(context, minLocation, dims);
  const cube = new WT.CuboidGeometry(entity.id);
  const p0 = new WT.Point3D(5, 5, 11);
  const p1 = new WT.Point3D(5, 5, -1);
  const p2 = new WT.Point3D(-1, 5, 5);
  const p3 = new WT.Point3D(11, 5, 5);
  const p4 = new WT.Point3D(5, -1, 5);
  const p5 = new WT.Point3D(5, 11, 5);
  expect(cube.obstructsRay(p0, p1)).not.toBeNull();
  expect(cube.obstructsRay(p1, p0)).not.toBeNull();
  expect(cube.obstructsRay(p2, p3)).not.toBeNull();
  expect(cube.obstructsRay(p3, p2)).not.toBeNull();
  expect(cube.obstructsRay(p4, p5)).not.toBeNull();
  expect(cube.obstructsRay(p5, p4)).not.toBeNull();
  const p6 = new WT.Point3D(0.1, 0.1, 11);
  const p7 = new WT.Point3D(0.1, 0.1, -1);
  const p8 = new WT.Point3D(9.9, 9.9, 11);
  const p9 = new WT.Point3D(9.9, 9.9, -1);
  expect(cube.obstructsRay(p6, p7)).not.toBeNull();
  expect(cube.obstructsRay(p7, p6)).not.toBeNull();
  expect(cube.obstructsRay(p8, p9)).not.toBeNull();
  expect(cube.obstructsRay(p9, p8)).not.toBeNull();
  const p10 = new WT.Point3D(-1, 0.1, 0.1);
  const p11 = new WT.Point3D(11, 0.1, 0.1);
  const p12 = new WT.Point3D(-1, 9.9, 9.9);
  const p13 = new WT.Point3D(11, 9.9, 9.9);
  expect(cube.obstructsRay(p10, p11)).not.toBeNull();
  expect(cube.obstructsRay(p11, p10)).not.toBeNull();
  expect(cube.obstructsRay(p12, p13)).not.toBeNull();
  expect(cube.obstructsRay(p13, p12)).not.toBeNull();
  const p14 = new WT.Point3D(0.1, -1, 0.1);
  const p15 = new WT.Point3D(0.1, 11, 0.1);
  const p16 = new WT.Point3D(9.9, -1, 9.9);
  const p17 = new WT.Point3D(9.9, 11, 9.9);
  expect(cube.obstructsRay(p14, p15)).not.toBeNull();
  expect(cube.obstructsRay(p15, p14)).not.toBeNull();
  expect(cube.obstructsRay(p16, p17)).not.toBeNull();
  expect(cube.obstructsRay(p17, p16)).not.toBeNull();

  const p18 = new WT.Point3D(-0.1, -0.1, 11);
  const p19 = new WT.Point3D(-0.1, -0.1, -1);
  const p20 = new WT.Point3D(10.1, 10, 11);
  const p21 = new WT.Point3D(10.1, 10.1, -1);
  expect(cube.obstructsRay(p18, p19)).toBeNull();
  expect(cube.obstructsRay(p19, p18)).toBeNull();
  expect(cube.obstructsRay(p20, p21)).toBeNull();
  expect(cube.obstructsRay(p21, p20)).toBeNull();
  const p22 = new WT.Point3D(-1, -0.1, -0.1);
  const p23 = new WT.Point3D(11, -0.1, -0.1);
  const p24 = new WT.Point3D(-1, 10.1, 10.1);
  const p25 = new WT.Point3D(11, 10.1, 10.1);
  expect(cube.obstructsRay(p22, p23)).toBeNull();
  expect(cube.obstructsRay(p23, p22)).toBeNull();
  expect(cube.obstructsRay(p24, p25)).toBeNull();
  expect(cube.obstructsRay(p25, p24)).toBeNull();
  const p26 = new WT.Point3D(-0.1, -1, -0.1);
  const p27 = new WT.Point3D(-0.1, 11, -0.1);
  const p28 = new WT.Point3D(10.1, -1, 10.1);
  const p29 = new WT.Point3D(10.1, 11, 10.1);
  expect(cube.obstructsRay(p26, p27)).toBeNull();
  expect(cube.obstructsRay(p27, p26)).toBeNull();
  expect(cube.obstructsRay(p28, p29)).toBeNull();
  expect(cube.obstructsRay(p29, p28)).toBeNull();
});

test("ramp up west plane intersection", () => {
  const width = 10;
  const depth = 10;
  const height = 10;
  const dims = new WT.Dimensions(width, depth, height);
  const centre = new WT.Point3D(5, 5, 5);
  const bounds = new WT.BoundingCuboid(centre, dims);
  const widthVec = new WT.Vector3D(width, 0, 0);
  const depthVec = new WT.Vector3D(0, depth, 0);
  const heightVec = new WT.Vector3D(0, 0, height);

  // four points that could represent the slope of a ramp
  const p2 = bounds.minLocation.add(widthVec);
  const p3 = bounds.maxLocation.sub(heightVec);
  const p4 = bounds.minLocation.add(heightVec);
  const p5 = bounds.maxLocation.sub(widthVec);

  const v0 = new WT.Vertex3D(p2, p4, p3);
  const v1 = new WT.Vertex3D(p5, p3, p4);
  const face = new WT.QuadFace3D(v0, v1);

  // up/down the ramp the middle, no intersection
  const p6 = new WT.Point3D(10, 5, 0.2);
  const p7 = new WT.Point3D(0, 5, 10.1);
  expect(v0.intersects(p6, p7)).toBeNull();
  expect(v1.intersects(p6, p7)).toBeNull();
  expect(v0.intersects(p7, p6)).toBeNull();
  expect(v1.intersects(p7, p6)).toBeNull();
  expect(face.intersectsPlane(p6, p7)).toBeNull();
  expect(face.intersectsPlane(p7, p6)).toBeNull();
  expect(face.intersectsPlane(p6, p7) && face.intersects(p7)).toBeNull();
  expect(face.intersectsPlane(p7, p6) && face.intersects(p6)).toBeNull();

  // up/down the ramp the middle, with intersection
  const p8 = new WT.Point3D(10, 5, -1);
  const p9 = new WT.Point3D(0, 5, 10.1);
  expect(v0.intersects(p8, p9)).not.toBeNull();
  expect(v1.intersects(p8, p9)).not.toBeNull();
  expect(v0.intersects(p9, p8)).not.toBeNull();
  expect(v1.intersects(p9, p8)).not.toBeNull();
  expect(face.intersectsPlane(p8, p9)).not.toBeNull();
  expect(face.intersectsPlane(p9, p8)).not.toBeNull();
  expect(face.intersects(p9)).not.toBeNull();
  expect(face.intersects(p8)).not.toBeNull();
});

test("ramp up west obstruction", () => {
  const worldDims = new WT.Dimensions(20, 20, 20);
  const context = WT.createTestContext(
    worldDims,
    WT.Perspective.TwoByOneIsometric
  );
  const dims = new WT.Dimensions(10, 10, 10);
  const minLocation = new WT.Point3D(0, 0, 0);
  const entity = new WT.PhysicalEntity(context, minLocation, dims);
  const ramp = new WT.RampUpWestGeometry(entity.id);

  const p0 = new WT.Point3D(-1, 5, 1);
  const p1 = new WT.Point3D(15, 5, 1);
  // Through the ramp east/west.
  expect(ramp.obstructsRay(p0, p1)).not.toBeNull();
  expect(ramp.obstructsRay(p1, p0)).not.toBeNull();

  const p2 = new WT.Point3D(5, 0, 5.1);
  const p3 = new WT.Point3D(5, 11, 5.1);
  // Across the ramp north/south
  expect(ramp.obstructsRay(p2, p3)).toBeNull();
  expect(ramp.obstructsRay(p3, p2)).toBeNull();

  const p4 = new WT.Point3D(5, 0, 4.9);
  const p5 = new WT.Point3D(5, 11, 4.9);
  // Through the ramp north/south
  expect(ramp.obstructsRay(p4, p5)).not.toBeNull();
  expect(ramp.obstructsRay(p5, p4)).not.toBeNull();

  // up/down the ramp the middle
  const p6 = new WT.Point3D(10, 5, 0.2);
  const p7 = new WT.Point3D(0, 5, 10.1);
  expect(ramp.obstructsRay(p6, p7)).toBeNull();
  expect(ramp.obstructsRay(p7, p6)).toBeNull();
});

test("ramp up east obstruction", () => {
  const worldDims = new WT.Dimensions(20, 20, 20);
  const context = WT.createTestContext(
    worldDims,
    WT.Perspective.TwoByOneIsometric
  );
  const dims = new WT.Dimensions(10, 10, 10);
  const minLocation = new WT.Point3D(0, 0, 0);
  const entity = new WT.PhysicalEntity(context, minLocation, dims);
  const ramp = new WT.RampUpEastGeometry(entity.id);

  const p0 = new WT.Point3D(-1, 5, 1);
  const p1 = new WT.Point3D(15, 5, 1);
  // Through the ramp east/west.
  expect(ramp.obstructsRay(p0, p1)).not.toBeNull();
  expect(ramp.obstructsRay(p1, p0)).not.toBeNull();

  const p2 = new WT.Point3D(5, 0, 5.1);
  const p3 = new WT.Point3D(5, 11, 5.1);
  // Across the ramp north/south
  expect(ramp.obstructsRay(p2, p3)).toBeNull();
  expect(ramp.obstructsRay(p3, p2)).toBeNull();

  const p4 = new WT.Point3D(5, 0, 4.9);
  const p5 = new WT.Point3D(5, 11, 4.9);
  // Through the ramp north/south
  expect(ramp.obstructsRay(p4, p5)).not.toBeNull();
  expect(ramp.obstructsRay(p5, p4)).not.toBeNull();

  // up/down the ramp the middle.
  const p6 = new WT.Point3D(10, 5, 10.2);
  expect(ramp.obstructsRay(p0, p6)).toBeNull();
  expect(ramp.obstructsRay(p6, p0)).toBeNull();

  // up/down the ramp between min to max.
  const maxLocation = WT.EntityBounds.maxLocation(entity.id);
  const p9 = minLocation.add(new WT.Vector3D(0, 0, 0.1));
  const p10 = maxLocation.add(new WT.Vector3D(0, 0, 0.1));
  expect(ramp.obstructsRay(p9, p10)).toBeNull();
  expect(ramp.obstructsRay(p9, maxLocation)).not.toBeNull();
  expect(ramp.obstructsRay(p10, minLocation)).not.toBeNull();
  expect(ramp.obstructsRay(p10, p9)).toBeNull();
});

test("ramp up north obstruction", () => {
  const worldDims = new WT.Dimensions(20, 20, 20);
  const context = WT.createTestContext(
    worldDims,
    WT.Perspective.TwoByOneIsometric
  );
  const dims = new WT.Dimensions(10, 10, 10);
  const minLocation = new WT.Point3D(0, 0, 0);
  const entity = new WT.PhysicalEntity(context, minLocation, dims);
  const ramp = new WT.RampUpNorthGeometry(entity.id);

  const p0 = new WT.Point3D(-1, 5, 5.2);
  const p1 = new WT.Point3D(15, 5, 5.2);
  // Across the ramp east/west.
  expect(ramp.obstructsRay(p0, p1)).toBeNull();
  expect(ramp.obstructsRay(p1, p0)).toBeNull();

  const p2 = new WT.Point3D(5, 0, 10.1);
  const p3 = new WT.Point3D(5, 11, 0.1);
  // up/down the ramp the middle.
  expect(ramp.obstructsRay(p2, p3)).toBeNull();
  expect(ramp.obstructsRay(p3, p2)).toBeNull();

  const p4 = new WT.Point3D(5, -1, 2);
  const p5 = new WT.Point3D(5, 11, 2);
  // Blocked through the ramp south/north
  expect(ramp.obstructsRay(p4, p5)).not.toBeNull();
  expect(ramp.obstructsRay(p5, p4)).not.toBeNull();

  const p6 = new WT.Point3D(-1, 5, 4.9);
  const p7 = new WT.Point3D(15, 5, 4.9);
  // Through the ramp east/west.
  expect(ramp.obstructsRay(p6, p7)).not.toBeNull();
  expect(ramp.obstructsRay(p7, p6)).not.toBeNull();

  // up/down the ramp between min to max.
  const topCorner = minLocation.add(new WT.Vector3D(0, 0, 10.1));
  const bottomCorner =
    WT.EntityBounds.maxLocation(entity.id).sub(new WT.Vector3D(0, 0, 9.9));
  expect(ramp.obstructsRay(topCorner, bottomCorner)).toBeNull();
  expect(ramp.obstructsRay(bottomCorner, topCorner)).toBeNull();
  expect(ramp.obstructsRay(topCorner, minLocation)).not.toBeNull();
  expect(ramp.obstructsRay(bottomCorner, minLocation)).not.toBeNull();
});

test("ramp up south obstruction", () => {
  const worldDims = new WT.Dimensions(20, 20, 20);
  const context = WT.createTestContext(
    worldDims,
    WT.Perspective.TwoByOneIsometric
  );
  const dims = new WT.Dimensions(10, 10, 10);
  const minLocation = new WT.Point3D(0, 0, 0);
  const entity = new WT.PhysicalEntity(context, minLocation, dims);
  const ramp = new WT.RampUpSouthGeometry(entity.id);

  const p0 = new WT.Point3D(-1, 5, 5.2);
  const p1 = new WT.Point3D(15, 5, 5.2);
  // Across the ramp east/west.
  expect(ramp.obstructsRay(p0, p1)).toBeNull();
  expect(ramp.obstructsRay(p1, p0)).toBeNull();

  const p2 = new WT.Point3D(5, -0.5, 0.1);
  const p3 = new WT.Point3D(5, 10, 10.1);
  // up/down the ramp the middle.
  expect(ramp.obstructsRay(p2, p3)).toBeNull();
  expect(ramp.obstructsRay(p3, p2)).toBeNull();

  const p4 = new WT.Point3D(5, -1, 2);
  const p5 = new WT.Point3D(5, 11, 2);
  // Blocked through the ramp south/north
  expect(ramp.obstructsRay(p4, p5)).not.toBeNull();
  expect(ramp.obstructsRay(p5, p4)).not.toBeNull();

  const p6 = new WT.Point3D(-1, 5, 4.9);
  const p7 = new WT.Point3D(15, 5, 4.9);
  // Through the ramp east/west.
  expect(ramp.obstructsRay(p6, p7)).not.toBeNull();
  expect(ramp.obstructsRay(p7, p6)).not.toBeNull();

  // up/down the ramp between min to max.
  const topCorner =
    WT.EntityBounds.maxLocation(entity.id).add(new WT.Vector3D(0, 0, 0.1));
  const bottomCorner = minLocation.add(new WT.Vector3D(0, 0, 0.1));
  expect(ramp.obstructsRay(topCorner, bottomCorner)).toBeNull();
  expect(ramp.obstructsRay(bottomCorner, topCorner)).toBeNull();
});
