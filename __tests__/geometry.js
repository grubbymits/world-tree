import * as WT from '../dist/world-tree.js';

test('2D point addition and subtraction', () => {
  const p0 = new WT.Point2D(6, 7);
  const p1 = new WT.Point2D(10, 12);
  const add = p1.add(p0);
  const sub = p1.sub(p0);
  expect(add.x).toBe(16);
  expect(add.y).toBe(19);
  expect(sub.x).toBe(4);
  expect(sub.y).toBe(5);
});

test('2D point orientation', () => {
  const p0 = new WT.Point2D(1, 1);
  const p1 = new WT.Point2D(2, 2);
  const p2 = new WT.Point2D(1, 3);
  const p3 = new WT.Point2D(3, 3);

  expect(WT.Point2D.orientation(p0, p2, p1)).toBe(WT.Orientation.Clockwise);
  expect(WT.Point2D.orientation(p0, p1, p2)).toBe(WT.Orientation.CounterClockwise);
  expect(WT.Point2D.orientation(p0, p1, p3)).toBe(WT.Orientation.Colinear);
});

test('2D segment intersection (vertically parallel)', () => {
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

test('2D segment intersection (horizontally parallel)', () => {
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

test('2D point on 2D segment', () => {
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

test('2D segment intersection with shared point', () => {
  const p0 = new WT.Point2D(1, 1);
  const p1 = new WT.Point2D(3, 1);
  const p3 = new WT.Point2D(3, 2);
  const s0 = new WT.Segment2D(p0, p1);
  const s1 = new WT.Segment2D(p0, p3);

  expect(s0.intersects(s1)).toBe(false);
  expect(s1.intersects(s0)).toBe(false);
});

test('2D segments crossing', () => {
  const p0 = new WT.Point2D(1, 1);
  const p1 = new WT.Point2D(3, 3);
  const p2 = new WT.Point2D(1, 3);
  const p3 = new WT.Point2D(3, 1);
  const s0 = new WT.Segment2D(p0, p1);
  const s1 = new WT.Segment2D(p2, p3);
  
  expect(s0.intersects(s1)).toBe(true);
  expect(s1.intersects(s0)).toBe(true);
});

test('3D point arithmetic', () => {
  const p0 = new WT.Point3D(1, 2, 3);
  const p1 = new WT.Point3D(10, 9, 8);
  const v0 = new WT.Vector3D(2, 3, 4);
  const diff = p0.vec(p1);
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

test('compare 3D points', () => {
  const p0 = new WT.Point3D(1.5, 2.5, 3.5);
  const p1 = new WT.Point3D(1.5, 2.5, 3.5);
  const p2 = new WT.Point3D(1.6, 2.2, 3.1);
  const p3 = new WT.Point3D(2, 2, 3);
  expect(p0.isSameAs(p1)).toBe(true);
  expect(p1.isSameAs(p2)).toBe(false);
  expect(p2.isSameAsRounded(p0)).toBe(false);
  expect(p2.isSameAsRounded(p3)).toBe(true);
});

test('cuboid obstruction', () => {
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
  expect(cube.obstructs(p0, p1)).toBe(true);
  expect(cube.obstructs(p1, p0)).toBe(true);
  expect(cube.obstructs(p2, p3)).toBe(true);
  expect(cube.obstructs(p3, p2)).toBe(true);
  expect(cube.obstructs(p4, p5)).toBe(true);
  expect(cube.obstructs(p5, p4)).toBe(true);
  const p6 = new WT.Point3D(0.1, 0.1, 11);
  const p7 = new WT.Point3D(0.1, 0.1, -1);
  const p8 = new WT.Point3D(9.9, 9.9, 11);
  const p9 = new WT.Point3D(9.9, 9.9, -1);
  expect(cube.obstructs(p6, p7)).toBe(true);
  expect(cube.obstructs(p7, p6)).toBe(true);
  expect(cube.obstructs(p8, p9)).toBe(true);
  expect(cube.obstructs(p9, p8)).toBe(true);
  const p10 = new WT.Point3D(-1, 0.1, 0.1);
  const p11 = new WT.Point3D(11, 0.1, 0.1);
  const p12 = new WT.Point3D(-1, 9.9, 9.9);
  const p13 = new WT.Point3D(11, 9.9, 9.9);
  expect(cube.obstructs(p10, p11)).toBe(true);
  expect(cube.obstructs(p11, p10)).toBe(true);
  expect(cube.obstructs(p12, p13)).toBe(true);
  expect(cube.obstructs(p13, p12)).toBe(true);
  const p14 = new WT.Point3D(0.1, -1, 0.1);
  const p15 = new WT.Point3D(0.1, 11, 0.1);
  const p16 = new WT.Point3D(9.9, -1, 9.9);
  const p17 = new WT.Point3D(9.9, 11, 9.9);
  expect(cube.obstructs(p14, p15)).toBe(true);
  expect(cube.obstructs(p15, p14)).toBe(true);
  expect(cube.obstructs(p16, p17)).toBe(true);
  expect(cube.obstructs(p17, p16)).toBe(true);

  const p18 = new WT.Point3D(-0.1, -0.1, 11);
  const p19 = new WT.Point3D(-0.1, -0.1, -1);
  const p20 = new WT.Point3D(10.1, 10., 11);
  const p21 = new WT.Point3D(10.1, 10.1, -1);
  expect(cube.obstructs(p18, p19)).toBe(false);
  expect(cube.obstructs(p19, p18)).toBe(false);
  expect(cube.obstructs(p20, p21)).toBe(false);
  expect(cube.obstructs(p21, p20)).toBe(false);
  const p22 = new WT.Point3D(-1, -0.1, -0.1);
  const p23 = new WT.Point3D(11, -0.1, -0.1);
  const p24 = new WT.Point3D(-1, 10.1, 10.1);
  const p25 = new WT.Point3D(11, 10.1, 10.1);
  expect(cube.obstructs(p22, p23)).toBe(false);
  expect(cube.obstructs(p23, p22)).toBe(false);
  expect(cube.obstructs(p24, p25)).toBe(false);
  expect(cube.obstructs(p25, p24)).toBe(false);
  const p26 = new WT.Point3D(-0.1, -1, -0.1);
  const p27 = new WT.Point3D(-0.1, 11, -0.1);
  const p28 = new WT.Point3D(10.1, -1, 10.1);
  const p29 = new WT.Point3D(10.1, 11, 10.1);
  expect(cube.obstructs(p26, p27)).toBe(false);
  expect(cube.obstructs(p27, p26)).toBe(false);
  expect(cube.obstructs(p28, p29)).toBe(false);
  expect(cube.obstructs(p29, p28)).toBe(false);
});

test('ramp up west obstruction', () => {
  const dims = new WT.Dimensions(10, 10, 10);
  const centre = new WT.Point3D(5, 5, 5);
  const bounds = new WT.BoundingCuboid(centre, dims);
  const ramp = new WT.RampUpEastGeometry(bounds);

  const p0 = new WT.Point3D(-1, 5, 1);
  const p1 = new WT.Point3D(15, 5, 1);
  // Through the ramp east/west.
  expect(ramp.obstructs(p0, p1)).toBe(true);
  expect(ramp.obstructs(p1, p0)).toBe(true);

  const p2 = new WT.Point3D(5, 0, 5.1);
  const p3 = new WT.Point3D(5, 11, 5.1);
  // Across the ramp north/south
  expect(ramp.obstructs(p2, p3)).toBe(false);
  expect(ramp.obstructs(p3, p2)).toBe(false);

  const p4 = new WT.Point3D(5, 0, 4.9);
  const p5 = new WT.Point3D(5, 11, 4.9);
  // Through the ramp north/south
  expect(ramp.obstructs(p4, p5)).toBe(true);
  expect(ramp.obstructs(p5, p4)).toBe(true);

  // up/down the ramp.
  const p6 = new WT.Point3D(10, 5, 0.2);
  const p7 = new WT.Point3D(0, 5, 10.1);
  expect(ramp.obstructs(p6, p7)).toBe(false);
  expect(ramp.obstructs(p7, p6)).toBe(false);
});

test('ramp up east obstruction', () => {
  const dims = new WT.Dimensions(10, 10, 10);
  const centre = new WT.Point3D(5, 5, 5);
  const bounds = new WT.BoundingCuboid(centre, dims);
  const ramp = new WT.RampUpEastGeometry(bounds);

  const p0 = new WT.Point3D(-1, 5, 1);
  const p1 = new WT.Point3D(15, 5, 1);
  // Through the ramp east/west.
  expect(ramp.obstructs(p0, p1)).toBe(true);
  expect(ramp.obstructs(p1, p0)).toBe(true);

  const p2 = new WT.Point3D(5, 0, 5.1);
  const p3 = new WT.Point3D(5, 11, 5.1);
  // Across the ramp north/south
  expect(ramp.obstructs(p2, p3)).toBe(false);
  expect(ramp.obstructs(p3, p2)).toBe(false);

  const p4 = new WT.Point3D(5, 0, 4.9);
  const p5 = new WT.Point3D(5, 11, 4.9);
  // Through the ramp north/south
  expect(ramp.obstructs(p4, p5)).toBe(true);
  expect(ramp.obstructs(p5, p4)).toBe(true);

  // up/down the ramp.
  const p6 = new WT.Point3D(10, 5, 10.2);
  expect(ramp.obstructs(p0, p6)).toBe(false);
  expect(ramp.obstructs(p6, p0)).toBe(false);
});
