import * as WT from '../dist/world-tree.js'

test('direction from vector', () => {
  let north = new WT.Vector2D(0, -1);
  let northEast = new WT.Vector2D(2, -1);
  let east = new WT.Vector2D(2, 0);
  let southEast = new WT.Vector2D(2, 2);
  let south = new WT.Vector2D(0, 1);
  let southWest = new WT.Vector2D(-2, 2);
  let west = new WT.Vector2D(-3, 0);
  let northWest = new WT.Vector2D(-3, -3);

  expect(WT.getDirectionFromVector(north)).toBe(WT.Direction.North);
  expect(WT.getDirectionFromVector(northEast)).toBe(WT.Direction.NorthEast);
  expect(WT.getDirectionFromVector(east)).toBe(WT.Direction.East);
  expect(WT.getDirectionFromVector(southEast)).toBe(WT.Direction.SouthEast);
  expect(WT.getDirectionFromVector(south)).toBe(WT.Direction.South);
  expect(WT.getDirectionFromVector(southWest)).toBe(WT.Direction.SouthWest);
  expect(WT.getDirectionFromVector(west)).toBe(WT.Direction.West);
  expect(WT.getDirectionFromVector(northWest)).toBe(WT.Direction.NorthWest);
});

test('direction from 2D points', () => {
  let north = new WT.Point2D(0, -2);
  let northEast = new WT.Point2D(1, -1);
  let east = new WT.Point2D(2, 0);
  let southEast = new WT.Point2D(1, 1);
  let south = new WT.Point2D(0, 2);
  let southWest = new WT.Point2D(-1, 1);
  let west = new WT.Point2D(-2, 0);
  let northWest = new WT.Point2D(-1, -1);

  expect(WT.getDirectionFromPoints(south, north)).toBe(WT.Direction.North);
  expect(WT.getDirectionFromPoints(north, south)).toBe(WT.Direction.South);
  expect(WT.getDirectionFromPoints(east, west)).toBe(WT.Direction.West);
  expect(WT.getDirectionFromPoints(west, east)).toBe(WT.Direction.East);
  expect(WT.getDirectionFromPoints(northEast, southWest)).toBe(WT.Direction.SouthWest);
  expect(WT.getDirectionFromPoints(southWest, northEast)).toBe(WT.Direction.NorthEast);
  expect(WT.getDirectionFromPoints(northWest, southEast)).toBe(WT.Direction.SouthEast);
  expect(WT.getDirectionFromPoints(southEast, northWest)).toBe(WT.Direction.NorthWest);
});

test('adjacent coord', () => {
  const centre = new WT.Point2D(0, 0);
  const north = new WT.Point2D(0, -1);
  const northEast = new WT.Point2D(1, -1);
  const east = new WT.Point2D(1, 0);
  const southEast = new WT.Point2D(1, 1);
  const south = new WT.Point2D(0, 1);
  const southWest = new WT.Point2D(-1, 1);
  const west = new WT.Point2D(-1, 0);
  const northWest = new WT.Point2D(-1, -1);

  expect(WT.getAdjacentCoord(centre, WT.Direction.North)).toEqual(north);
  expect(WT.getAdjacentCoord(centre, WT.Direction.NorthEast)).toEqual(northEast);
  expect(WT.getAdjacentCoord(centre, WT.Direction.East)).toEqual(east);
  expect(WT.getAdjacentCoord(centre, WT.Direction.SouthEast)).toEqual(southEast);
  expect(WT.getAdjacentCoord(centre, WT.Direction.South)).toEqual(south);
  expect(WT.getAdjacentCoord(centre, WT.Direction.SouthWest)).toEqual(southWest);
  expect(WT.getAdjacentCoord(centre, WT.Direction.West)).toEqual(west);
  expect(WT.getAdjacentCoord(centre, WT.Direction.NorthWest)).toEqual(northWest);
});

test('opposite direction', () => {
  expect(WT.getOppositeDirection(WT.Direction.North)).toBe(WT.Direction.South);
  expect(WT.getOppositeDirection(WT.Direction.NorthEast)).toBe(WT.Direction.SouthWest);
  expect(WT.getOppositeDirection(WT.Direction.East)).toBe(WT.Direction.West);
  expect(WT.getOppositeDirection(WT.Direction.SouthEast)).toBe(WT.Direction.NorthWest);
  expect(WT.getOppositeDirection(WT.Direction.South)).toBe(WT.Direction.North);
  expect(WT.getOppositeDirection(WT.Direction.SouthWest)).toBe(WT.Direction.NorthEast);
  expect(WT.getOppositeDirection(WT.Direction.West)).toBe(WT.Direction.East);
  expect(WT.getOppositeDirection(WT.Direction.NorthWest)).toBe(WT.Direction.SouthEast);
});

test('initial locations', () => {
  const centre = new WT.Point3D(10, 15, 20);
  const dims = new WT.Dimensions(5, 7, 8);
  const bounds = new WT.BoundingCuboid(centre, dims);
  expect(bounds.centre.x).toBe(10);
  expect(bounds.centre.y).toBe(15);
  expect(bounds.centre.z).toBe(20);
  expect(bounds.width).toBe(5);
  expect(bounds.depth).toBe(7);
  expect(bounds.height).toBe(8);
  expect(bounds.bottomCentre.x).toBe(10);
  expect(bounds.bottomCentre.y).toBe(15);
  expect(bounds.bottomCentre.z).toBe(16);
  expect(bounds.minLocation.x).toBe(7.5);
  expect(bounds.minLocation.y).toBe(11.5);
  expect(bounds.minLocation.z).toBe(16);
  expect(bounds.maxLocation.x).toBe(12.5);
  expect(bounds.maxLocation.y).toBe(18.5);
  expect(bounds.maxLocation.z).toBe(24);
});

test('update position', () => {
  const centre = new WT.Point3D(10, 15, 20);
  const dims = new WT.Dimensions(5, 7, 8);
  const bounds = new WT.BoundingCuboid(centre, dims);
  const move = new WT.Vector3D(3, 2, 1);
  bounds.update(move);
  expect(bounds.bottomCentre.x).toBe(13);
  expect(bounds.bottomCentre.y).toBe(17);
  expect(bounds.bottomCentre.z).toBe(17);
  expect(bounds.minLocation.x).toBe(10.5);
  expect(bounds.minLocation.y).toBe(13.5);
  expect(bounds.minLocation.z).toBe(17);
  expect(bounds.maxLocation.x).toBe(15.5);
  expect(bounds.maxLocation.y).toBe(20.5);
  expect(bounds.maxLocation.z).toBe(25);
});

test('contains location', () => {
  const centre = new WT.Point3D(0, 0, 0);
  const dims = new WT.Dimensions(2, 3, 4);
  const bounds = new WT.BoundingCuboid(centre, dims);
  expect(bounds.contains(new WT.Point3D(1, 1, 1))).toBe(true);
  expect(bounds.contains(new WT.Point3D(1, 1.5, 2))).toBe(true);
  expect(bounds.contains(new WT.Point3D(-1, -1.5, -2))).toBe(true);
  expect(bounds.contains(new WT.Point3D(1.1, 1.5, 2))).toBe(false);
  expect(bounds.contains(new WT.Point3D(1, 1.6, 2))).toBe(false);
  expect(bounds.contains(new WT.Point3D(1, 1.5, 2.1))).toBe(false);
  expect(bounds.contains(new WT.Point3D(-1.1, -1.5, -2))).toBe(false);
  expect(bounds.contains(new WT.Point3D(-1, -1.6, -2))).toBe(false);
  expect(bounds.contains(new WT.Point3D(-1, -1.5, -2.1))).toBe(false);
});

test('contains bounds', () => {
  const container = new WT.BoundingCuboid(new WT.Point3D(0, 0, 0),
                                          new WT.Dimensions(100, 90, 60));
  const containee = new WT.BoundingCuboid(new WT.Point3D(20, 30, 1),
                                          new WT.Dimensions(30, 30, 50));
  const partial = new WT.BoundingCuboid(new WT.Point3D(25, 40, 10),
                                        new WT.Dimensions(50, 40, 70));
  expect(container.containsBounds(containee)).toBe(true);
  expect(container.containsBounds(partial)).toBe(false);
  expect(container.intersects(partial)).toBe(true);
});

test('insert bounds', () => {
  const container = new WT.BoundingCuboid(new WT.Point3D(0, 0, 0),
                                          new WT.Dimensions(100, 90, 60));
  const partial = new WT.BoundingCuboid(new WT.Point3D(25, 40, 10),
                                        new WT.Dimensions(50, 40, 70));
  container.insert(partial);
  expect(container.width).toBe(100);
  expect(container.depth).toBe(105);
  expect(container.height).toBe(75);
  expect(container.centre.x).toBe(0);
  expect(container.centre.y).toBe(7.5);
  expect(container.centre.z).toBe(7.5);
  expect(container.minLocation.x).toBe(-50);
  expect(container.minLocation.y).toBe(7.5-52.5);
  expect(container.minLocation.z).toBe(7.5-37.5);
  expect(container.maxLocation.x).toBe(50);
  expect(container.maxLocation.y).toBe(7.5+52.5);
  expect(container.maxLocation.z).toBe(7.5+37.5);
});

test('detect collision from north', () => {
});

test('detect collision from north east', () => {
});

test('detect collision from east', () => {
});

test('detect collision from south east', () => {
});

test('detect collision from south', () => {
});

test('detect collision from south west', () => {
});

test('detect collision from west', () => {
});

test('detect collision from north west', () => {
});
