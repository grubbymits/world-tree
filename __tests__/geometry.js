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

test('2D segment intersection with shared point)', () => {
  const p0 = new WT.Point2D(1, 1);
  const p1 = new WT.Point2D(3, 1);
  const p3 = new WT.Point2D(3, 2);
  const s0 = new WT.Segment2D(p0, p1);
  const s1 = new WT.Segment2D(p1, p3);

  expect(s0.intersects(s1)).toBe(true);
  expect(s1.intersects(s0)).toBe(true);
});
