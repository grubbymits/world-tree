import { assertEquals,
         assertExists } from "https://deno.land/std@0.160.0/testing/asserts.ts";

import * as WT from '../world-tree.js';

Deno.test('2D point addition and subtraction', () => {
  const p0 = new WT.Point2D(6, 7);
  const p1 = new WT.Point2D(10, 12);
  const add = p1.add(p0);
  const sub = p1.sub(p0);
  assertEquals(add.x, 16);
  assertEquals(add.y, 19);
  assertEquals(sub.x, 4);
  assertEquals(sub.y, 5);
});

Deno.test('2D point orientation', () => {
  const p0 = new WT.Point2D(1, 1);
  const p1 = new WT.Point2D(2, 2);
  const p2 = new WT.Point2D(1, 3);
  const p3 = new WT.Point2D(3, 3);

  assertEquals(WT.Point2D.orientation(p0, p2, p1), WT.Orientation.Clockwise);
  assertEquals(WT.Point2D.orientation(p0, p1, p2), WT.Orientation.CounterClockwise);
  assertEquals(WT.Point2D.orientation(p0, p1, p3), WT.Orientation.Colinear);
});

Deno.test('2D segment intersection (vertically parallel)', () => {
  const p0 = new WT.Point2D(1, 1);
  const p1 = new WT.Point2D(1, 3);
  const p2 = new WT.Point2D(2, 1);
  const p3 = new WT.Point2D(2, 3);
  const s0 = new WT.Segment2D(p0, p1);
  const s1 = new WT.Segment2D(p2, p3);

  assertEquals(s0.contains(p2), false);
  assertEquals(s0.contains(p3), false);
  assertEquals(s0.intersects(s1), false);
  assertEquals(s1.contains(p0), false);
  assertEquals(s1.contains(p1), false);
  assertEquals(s1.intersects(s0), false);
});

Deno.test('2D segment intersection (horizontally parallel)', () => {
  const p0 = new WT.Point2D(1, 1);
  const p1 = new WT.Point2D(3, 1);
  const p2 = new WT.Point2D(1, 2);
  const p3 = new WT.Point2D(3, 2);
  const s0 = new WT.Segment2D(p0, p1);
  const s1 = new WT.Segment2D(p2, p3);

  assertEquals(s0.contains(p2), false);
  assertEquals(s0.contains(p3), false);
  assertEquals(s0.intersects(s1), false);
  assertEquals(s1.contains(p0), false);
  assertEquals(s1.contains(p1), false);
  assertEquals(s1.intersects(s0), false);
});

Deno.test('2D point on 2D segment', () => {
  const p0 = new WT.Point2D(1, 1);
  const p1 = new WT.Point2D(3, 1);
  const p2 = new WT.Point2D(1, 3);
  const p4 = new WT.Point2D(1, 2);
  const p3 = new WT.Point2D(2, 1);
  const s0 = new WT.Segment2D(p0, p1);
  const s1 = new WT.Segment2D(p0, p2);
  assertEquals(s0.contains(p3), true);
  assertEquals(s1.contains(p3), false);
  assertEquals(s1.contains(p4), true);
  assertEquals(s0.contains(p4), false);
});

Deno.test('2D segment intersection with shared point', () => {
  const p0 = new WT.Point2D(1, 1);
  const p1 = new WT.Point2D(3, 1);
  const p3 = new WT.Point2D(3, 2);
  const s0 = new WT.Segment2D(p0, p1);
  const s1 = new WT.Segment2D(p0, p3);

  assertEquals(s0.intersects(s1), false);
  assertEquals(s1.intersects(s0), false);
});

Deno.test('2D segments crossing', () => {
  const p0 = new WT.Point2D(1, 1);
  const p1 = new WT.Point2D(3, 3);
  const p2 = new WT.Point2D(1, 3);
  const p3 = new WT.Point2D(3, 1);
  const s0 = new WT.Segment2D(p0, p1);
  const s1 = new WT.Segment2D(p2, p3);
  
  assertEquals(s0.intersects(s1), true);
  assertEquals(s1.intersects(s0), true);
});

Deno.test('3D point arithmetic', () => {
  const p0 = new WT.Point3D(1, 2, 3);
  const p1 = new WT.Point3D(10, 9, 8);
  const v0 = new WT.Vector3D(2, 3, 4);
  const diff = p0.vec_diff(p1);
  const add = p0.add(v0);
  const sub = p1.sub(v0);

  assertEquals(diff.x, -9);
  assertEquals(diff.y, -7);
  assertEquals(diff.z, -5);
  assertEquals(add.x, 3);
  assertEquals(add.y, 5);
  assertEquals(add.z, 7);
  assertEquals(sub.x, 8);
  assertEquals(sub.y, 6);
  assertEquals(sub.z, 4);
});

Deno.test('compare 3D points', () => {
  const p0 = new WT.Point3D(1.5, 2.5, 3.5);
  const p1 = new WT.Point3D(1.5, 2.5, 3.5);
  const p2 = new WT.Point3D(1.6, 2.2, 3.1);
  const p3 = new WT.Point3D(2, 2, 3);
  assertEquals(p0.isSameAs(p1), true);
  assertEquals(p1.isSameAs(p2), false);
  assertEquals(p2.isSameAsRounded(p0), false);
  assertEquals(p2.isSameAsRounded(p3), true);
});

Deno.test('vertex plane', () => {
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
  assertEquals(v0.normal.equal(v1.normal), true);
});

Deno.test('cuboid geometry construction', () => {
  const dims = new WT.Dimensions(10, 10, 10);
  const centre = new WT.Point3D(5, 5, 5);
  const bounds = new WT.BoundingCuboid(centre, dims);
  assertExists(new WT.CuboidGeometry(bounds));
});

Deno.test('ramp up west construction', () => {
  const dims = new WT.Dimensions(10, 10, 10);
  const centre = new WT.Point3D(5, 5, 5);
  const bounds = new WT.BoundingCuboid(centre, dims);
  assertExists(new WT.RampUpWestGeometry(bounds));
});

Deno.test('ramp up east construction', () => {
  const dims = new WT.Dimensions(10, 10, 10);
  const centre = new WT.Point3D(5, 5, 5);
  const bounds = new WT.BoundingCuboid(centre, dims);
  assertExists(new WT.RampUpEastGeometry(bounds));
});

Deno.test('cuboid obstruction', () => {
  const dims = new WT.Dimensions(10, 10, 10);
  const centre = new WT.Point3D(5, 5, 5);
  const bounds = new WT.BoundingCuboid(centre, dims);
  const cube = new WT.CuboidGeometry(bounds);
  const p0 = new WT.Point3D(5, 5, 11);
  const p1 = new WT.Point3D(5, 5, -1);
  const p2 = new WT.Point3D(-1, 5, 5);
  const p3 = new WT.Point3D(11, 5, 5);
  const p4 = new WT.Point3D(5, -1, 5);
  const p5 = new WT.Point3D(5, 11, 5);
  assertExists(cube.obstructs(p0, p1));
  assertExists(cube.obstructs(p1, p0));
  assertExists(cube.obstructs(p2, p3));
  assertExists(cube.obstructs(p3, p2));
  assertExists(cube.obstructs(p4, p5));
  assertExists(cube.obstructs(p5, p4));
  const p6 = new WT.Point3D(0.1, 0.1, 11);
  const p7 = new WT.Point3D(0.1, 0.1, -1);
  const p8 = new WT.Point3D(9.9, 9.9, 11);
  const p9 = new WT.Point3D(9.9, 9.9, -1);
  assertExists(cube.obstructs(p6, p7));
  assertExists(cube.obstructs(p7, p6));
  assertExists(cube.obstructs(p8, p9));
  assertExists(cube.obstructs(p9, p8));
  const p10 = new WT.Point3D(-1, 0.1, 0.1);
  const p11 = new WT.Point3D(11, 0.1, 0.1);
  const p12 = new WT.Point3D(-1, 9.9, 9.9);
  const p13 = new WT.Point3D(11, 9.9, 9.9);
  assertExists(cube.obstructs(p10, p11));
  assertExists(cube.obstructs(p11, p10));
  assertExists(cube.obstructs(p12, p13));
  assertExists(cube.obstructs(p13, p12));
  const p14 = new WT.Point3D(0.1, -1, 0.1);
  const p15 = new WT.Point3D(0.1, 11, 0.1);
  const p16 = new WT.Point3D(9.9, -1, 9.9);
  const p17 = new WT.Point3D(9.9, 11, 9.9);
  assertExists(cube.obstructs(p14, p15));
  assertExists(cube.obstructs(p15, p14));
  assertExists(cube.obstructs(p16, p17));
  assertExists(cube.obstructs(p17, p16));

  const p18 = new WT.Point3D(-0.1, -0.1, 11);
  const p19 = new WT.Point3D(-0.1, -0.1, -1);
  const p20 = new WT.Point3D(10.1, 10., 11);
  const p21 = new WT.Point3D(10.1, 10.1, -1);
  assertEquals(cube.obstructs(p18, p19), null);
  assertEquals(cube.obstructs(p19, p18), null);
  assertEquals(cube.obstructs(p20, p21), null);
  assertEquals(cube.obstructs(p21, p20), null);
  const p22 = new WT.Point3D(-1, -0.1, -0.1);
  const p23 = new WT.Point3D(11, -0.1, -0.1);
  const p24 = new WT.Point3D(-1, 10.1, 10.1);
  const p25 = new WT.Point3D(11, 10.1, 10.1);
  assertEquals(cube.obstructs(p22, p23), null);
  assertEquals(cube.obstructs(p23, p22), null);
  assertEquals(cube.obstructs(p24, p25), null);
  assertEquals(cube.obstructs(p25, p24), null);
  const p26 = new WT.Point3D(-0.1, -1, -0.1);
  const p27 = new WT.Point3D(-0.1, 11, -0.1);
  const p28 = new WT.Point3D(10.1, -1, 10.1);
  const p29 = new WT.Point3D(10.1, 11, 10.1);
  assertEquals(cube.obstructs(p26, p27), null);
  assertEquals(cube.obstructs(p27, p26), null);
  assertEquals(cube.obstructs(p28, p29), null);
  assertEquals(cube.obstructs(p29, p28), null);
});

Deno.test('ramp up west plane intersection', () => {
  const width = 10;
  const depth = 10;
  const height = 10;
  const dims = new WT.Dimensions(width, depth, height);
  const centre = new WT.Point3D(5, 5, 5);
  const widthVec = new WT.Vector3D(width, 0, 0);
  const depthVec = new WT.Vector3D(0, depth, 0);
  const heightVec = new WT.Vector3D(0, 0, height);
  const bounds = new WT.BoundingCuboid(centre, dims);

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
  assertEquals(v0.intersects(p6, p7), null);
  assertEquals(v1.intersects(p6, p7), null);
  assertEquals(v0.intersects(p7, p6), null);
  assertEquals(v1.intersects(p7, p6), null);
  assertEquals(face.intersectsPlane(p6, p7), null);
  assertEquals(face.intersectsPlane(p7, p6), null);
  assertEquals(face.intersectsPlane(p6, p7) && face.intersects(p7), null);
  assertEquals(face.intersectsPlane(p7, p6) && face.intersects(p6), null);

  // up/down the ramp the middle, with intersection
  const p8 = new WT.Point3D(10, 5, -1);
  const p9 = new WT.Point3D(0, 5, 10.1);
  assertExists(v0.intersects(p8, p9));
  assertExists(v1.intersects(p8, p9));
  assertExists(v0.intersects(p9, p8));
  assertExists(v1.intersects(p9, p8));
  assertExists(face.intersectsPlane(p8, p9));
  assertExists(face.intersectsPlane(p9, p8));
  assertExists(face.intersects(p9));
  assertExists(face.intersects(p8));
});

Deno.test('ramp up west obstruction', () => {
  const dims = new WT.Dimensions(10, 10, 10);
  const centre = new WT.Point3D(5, 5, 5);
  const bounds = new WT.BoundingCuboid(centre, dims);
  const ramp = new WT.RampUpWestGeometry(bounds);

  const p0 = new WT.Point3D(-1, 5, 1);
  const p1 = new WT.Point3D(15, 5, 1);
  // Through the ramp east/west.
  assertExists(ramp.obstructs(p0, p1));
  assertExists(ramp.obstructs(p1, p0));

  const p2 = new WT.Point3D(5, 0, 5.1);
  const p3 = new WT.Point3D(5, 11, 5.1);
  // Across the ramp north/south
  assertEquals(ramp.obstructs(p2, p3), null);
  assertEquals(ramp.obstructs(p3, p2), null);

  const p4 = new WT.Point3D(5, 0, 4.9);
  const p5 = new WT.Point3D(5, 11, 4.9);
  // Through the ramp north/south
  assertExists(ramp.obstructs(p4, p5));
  assertExists(ramp.obstructs(p5, p4));

  // up/down the ramp the middle
  const p6 = new WT.Point3D(10, 5, 0.2);
  const p7 = new WT.Point3D(0, 5, 10.1);
  assertEquals(ramp.obstructs(p6, p7), null);
  assertEquals(ramp.obstructs(p7, p6), null);
});

Deno.test('ramp up east obstruction', () => {
  const dims = new WT.Dimensions(10, 10, 10);
  const centre = new WT.Point3D(5, 5, 5);
  const bounds = new WT.BoundingCuboid(centre, dims);
  const ramp = new WT.RampUpEastGeometry(bounds);

  const p0 = new WT.Point3D(-1, 5, 1);
  const p1 = new WT.Point3D(15, 5, 1);
  // Through the ramp east/west.
  assertExists(ramp.obstructs(p0, p1));
  assertExists(ramp.obstructs(p1, p0));

  const p2 = new WT.Point3D(5, 0, 5.1);
  const p3 = new WT.Point3D(5, 11, 5.1);
  // Across the ramp north/south
  assertEquals(ramp.obstructs(p2, p3), null);
  assertEquals(ramp.obstructs(p3, p2), null);

  const p4 = new WT.Point3D(5, 0, 4.9);
  const p5 = new WT.Point3D(5, 11, 4.9);
  // Through the ramp north/south
  assertExists(ramp.obstructs(p4, p5));
  assertExists(ramp.obstructs(p5, p4));

  // up/down the ramp the middle.
  const p6 = new WT.Point3D(10, 5, 10.2);
  assertEquals(ramp.obstructs(p0, p6), null);
  assertEquals(ramp.obstructs(p6, p0), null);

  // up/down the ramp between min to max.
  const minLocation = bounds.minLocation;
  const maxLocation = bounds.maxLocation;
  const p9 = minLocation.add(new WT.Vector3D(0, 0, 0.1));
  const p10 = maxLocation.add(new WT.Vector3D(0, 0, 0.1));
  assertEquals(ramp.obstructs(p9, p10), null);
  assertExists(ramp.obstructs(p9, maxLocation));
  assertExists(ramp.obstructs(p10, minLocation));
  assertEquals(ramp.obstructs(p10, p9), null);
});

Deno.test('ramp up north obstruction', () => {
  const dims = new WT.Dimensions(10, 10, 10);
  const centre = new WT.Point3D(5, 5, 5);
  const bounds = new WT.BoundingCuboid(centre, dims);
  const ramp = new WT.RampUpNorthGeometry(bounds);

  const p0 = new WT.Point3D(-1, 5, 5.2);
  const p1 = new WT.Point3D(15, 5, 5.2);
  // Across the ramp east/west.
  assertEquals(ramp.obstructs(p0, p1), null);
  assertEquals(ramp.obstructs(p1, p0), null);

  const p2 = new WT.Point3D(5, 0, 10.1);
  const p3 = new WT.Point3D(5, 11, 0.1);
  // up/down the ramp the middle.
  assertEquals(ramp.obstructs(p2, p3), null);
  assertEquals(ramp.obstructs(p3, p2), null);

  const p4 = new WT.Point3D(5, -1, 2);
  const p5 = new WT.Point3D(5, 11, 2);
  // Blocked through the ramp south/north
  assertExists(ramp.obstructs(p4, p5));
  assertExists(ramp.obstructs(p5, p4));

  const p6 = new WT.Point3D(-1, 5, 4.9);
  const p7 = new WT.Point3D(15, 5, 4.9);
  // Through the ramp east/west.
  assertExists(ramp.obstructs(p6, p7));
  assertExists(ramp.obstructs(p7, p6));

  // up/down the ramp between min to max.
  const topCorner = bounds.minLocation.add(new WT.Vector3D(0, 0, 10.1));
  const bottomCorner = bounds.maxLocation.sub(new WT.Vector3D(0, 0, 9.9));
  assertEquals(ramp.obstructs(topCorner, bottomCorner), null);
  assertEquals(ramp.obstructs(bottomCorner, topCorner), null);
  assertExists(ramp.obstructs(topCorner, bounds.minLocation));
  assertExists(ramp.obstructs(bottomCorner, bounds.minLocation));
});

Deno.test('ramp up south obstruction', () => {
  const dims = new WT.Dimensions(10, 10, 10);
  const centre = new WT.Point3D(5, 5, 5);
  const bounds = new WT.BoundingCuboid(centre, dims);
  const ramp = new WT.RampUpSouthGeometry(bounds);

  const p0 = new WT.Point3D(-1, 5, 5.2);
  const p1 = new WT.Point3D(15, 5, 5.2);
  // Across the ramp east/west.
  assertEquals(ramp.obstructs(p0, p1), null);
  assertEquals(ramp.obstructs(p1, p0), null);

  const p2 = new WT.Point3D(5, -0.5, 0.1);
  const p3 = new WT.Point3D(5, 10, 10.1);
  // up/down the ramp the middle.
  assertEquals(ramp.obstructs(p2, p3), null);
  assertEquals(ramp.obstructs(p3, p2), null);

  const p4 = new WT.Point3D(5, -1, 2);
  const p5 = new WT.Point3D(5, 11, 2);
  // Blocked through the ramp south/north
  assertExists(ramp.obstructs(p4, p5));
  assertExists(ramp.obstructs(p5, p4));

  const p6 = new WT.Point3D(-1, 5, 4.9);
  const p7 = new WT.Point3D(15, 5, 4.9);
  // Through the ramp east/west.
  assertExists(ramp.obstructs(p6, p7));
  assertExists(ramp.obstructs(p7, p6));

  // up/down the ramp between min to max.
  const topCorner = bounds.maxLocation.add(new WT.Vector3D(0, 0, 0.1));
  const bottomCorner = bounds.minLocation.add(new WT.Vector3D(0, 0, 0.1));
  assertEquals(ramp.obstructs(topCorner, bottomCorner), null);
  assertEquals(ramp.obstructs(bottomCorner, topCorner), null);
});
