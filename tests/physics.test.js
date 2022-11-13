import { assertEquals } from "https://deno.land/std@0.160.0/testing/asserts.ts";

import * as WT from '../world-tree.js'

Deno.test('direction from vector', () => {
  let north = new WT.Vector2D(0, -1);
  let northEast = new WT.Vector2D(2, -1);
  let east = new WT.Vector2D(2, 0);
  let southEast = new WT.Vector2D(2, 2);
  let south = new WT.Vector2D(0, 1);
  let southWest = new WT.Vector2D(-2, 2);
  let west = new WT.Vector2D(-3, 0);
  let northWest = new WT.Vector2D(-3, -3);

  assertEquals(WT.Navigation.getDirectionFromVector(north), WT.Direction.North);
  assertEquals(WT.Navigation.getDirectionFromVector(northEast), WT.Direction.NorthEast);
  assertEquals(WT.Navigation.getDirectionFromVector(east), WT.Direction.East);
  assertEquals(WT.Navigation.getDirectionFromVector(southEast), WT.Direction.SouthEast);
  assertEquals(WT.Navigation.getDirectionFromVector(south), WT.Direction.South);
  assertEquals(WT.Navigation.getDirectionFromVector(southWest), WT.Direction.SouthWest);
  assertEquals(WT.Navigation.getDirectionFromVector(west), WT.Direction.West);
  assertEquals(WT.Navigation.getDirectionFromVector(northWest), WT.Direction.NorthWest);
});

Deno.test('direction from 2D points', () => {
  let north = new WT.Point2D(0, -2);
  let northEast = new WT.Point2D(1, -1);
  let east = new WT.Point2D(2, 0);
  let southEast = new WT.Point2D(1, 1);
  let south = new WT.Point2D(0, 2);
  let southWest = new WT.Point2D(-1, 1);
  let west = new WT.Point2D(-2, 0);
  let northWest = new WT.Point2D(-1, -1);

  assertEquals(WT.Navigation.getDirectionFromPoints(south, north), WT.Direction.North);
  assertEquals(WT.Navigation.getDirectionFromPoints(north, south), WT.Direction.South);
  assertEquals(WT.Navigation.getDirectionFromPoints(east, west), WT.Direction.West);
  assertEquals(WT.Navigation.getDirectionFromPoints(west, east), WT.Direction.East);
  assertEquals(WT.Navigation.getDirectionFromPoints(northEast, southWest), WT.Direction.SouthWest);
  assertEquals(WT.Navigation.getDirectionFromPoints(southWest, northEast), WT.Direction.NorthEast);
  assertEquals(WT.Navigation.getDirectionFromPoints(northWest, southEast), WT.Direction.SouthEast);
  assertEquals(WT.Navigation.getDirectionFromPoints(southEast, northWest), WT.Direction.NorthWest);
});

Deno.test('adjacent coord', () => {
  const centre = new WT.Point2D(0, 0);
  const north = new WT.Point2D(0, -1);
  const northEast = new WT.Point2D(1, -1);
  const east = new WT.Point2D(1, 0);
  const southEast = new WT.Point2D(1, 1);
  const south = new WT.Point2D(0, 1);
  const southWest = new WT.Point2D(-1, 1);
  const west = new WT.Point2D(-1, 0);
  const northWest = new WT.Point2D(-1, -1);

  assertEquals(WT.Navigation.getAdjacentCoord(centre, WT.Direction.North), north);
  assertEquals(WT.Navigation.getAdjacentCoord(centre, WT.Direction.NorthEast), northEast);
  assertEquals(WT.Navigation.getAdjacentCoord(centre, WT.Direction.East), east);
  assertEquals(WT.Navigation.getAdjacentCoord(centre, WT.Direction.SouthEast), southEast);
  assertEquals(WT.Navigation.getAdjacentCoord(centre, WT.Direction.South), south);
  assertEquals(WT.Navigation.getAdjacentCoord(centre, WT.Direction.SouthWest), southWest);
  assertEquals(WT.Navigation.getAdjacentCoord(centre, WT.Direction.West), west);
  assertEquals(WT.Navigation.getAdjacentCoord(centre, WT.Direction.NorthWest), northWest);
});

Deno.test('opposite direction', () => {
  assertEquals(WT.Navigation.getOppositeDirection(WT.Direction.North), WT.Direction.South);
  assertEquals(WT.Navigation.getOppositeDirection(WT.Direction.NorthEast), WT.Direction.SouthWest);
  assertEquals(WT.Navigation.getOppositeDirection(WT.Direction.East), WT.Direction.West);
  assertEquals(WT.Navigation.getOppositeDirection(WT.Direction.SouthEast), WT.Direction.NorthWest);
  assertEquals(WT.Navigation.getOppositeDirection(WT.Direction.South), WT.Direction.North);
  assertEquals(WT.Navigation.getOppositeDirection(WT.Direction.SouthWest), WT.Direction.NorthEast);
  assertEquals(WT.Navigation.getOppositeDirection(WT.Direction.West), WT.Direction.East);
  assertEquals(WT.Navigation.getOppositeDirection(WT.Direction.NorthWest), WT.Direction.SouthEast);
});

Deno.test('initial locations', () => {
  const centre = new WT.Point3D(10, 15, 20);
  const dims = new WT.Dimensions(5, 7, 8);
  const bounds = new WT.BoundingCuboid(centre, dims);
  assertEquals(bounds.centre.x, 10);
  assertEquals(bounds.centre.y, 15);
  assertEquals(bounds.centre.z, 20);
  assertEquals(bounds.width, 5);
  assertEquals(bounds.depth, 7);
  assertEquals(bounds.height, 8);
  assertEquals(bounds.bottomCentre.x, 10);
  assertEquals(bounds.bottomCentre.y, 15);
  assertEquals(bounds.bottomCentre.z, 16);
  assertEquals(bounds.minLocation.x, 7.5);
  assertEquals(bounds.minLocation.y, 11.5);
  assertEquals(bounds.minLocation.z, 16);
  assertEquals(bounds.maxLocation.x, 12.5);
  assertEquals(bounds.maxLocation.y, 18.5);
  assertEquals(bounds.maxLocation.z, 24);
});

Deno.test('update position', () => {
  const centre = new WT.Point3D(10, 15, 20);
  const dims = new WT.Dimensions(5, 7, 8);
  const bounds = new WT.BoundingCuboid(centre, dims);
  const move = new WT.Vector3D(3, 2, 1);
  bounds.update(move);
  assertEquals(bounds.bottomCentre.x, 13);
  assertEquals(bounds.bottomCentre.y, 17);
  assertEquals(bounds.bottomCentre.z, 17);
  assertEquals(bounds.minLocation.x, 10.5);
  assertEquals(bounds.minLocation.y, 13.5);
  assertEquals(bounds.minLocation.z, 17);
  assertEquals(bounds.maxLocation.x, 15.5);
  assertEquals(bounds.maxLocation.y, 20.5);
  assertEquals(bounds.maxLocation.z, 25);
});

Deno.test('contains location', () => {
  const centre = new WT.Point3D(0, 0, 0);
  const dims = new WT.Dimensions(2, 3, 4);
  const bounds = new WT.BoundingCuboid(centre, dims);
  assertEquals(bounds.contains(new WT.Point3D(1, 1, 1)), true);
  assertEquals(bounds.contains(new WT.Point3D(1, 1.5, 2)), true);
  assertEquals(bounds.contains(new WT.Point3D(-1, -1.5, -2)), true);
  assertEquals(bounds.contains(new WT.Point3D(1.1, 1.5, 2)), false);
  assertEquals(bounds.contains(new WT.Point3D(1, 1.6, 2)), false);
  assertEquals(bounds.contains(new WT.Point3D(1, 1.5, 2.1)), false);
  assertEquals(bounds.contains(new WT.Point3D(-1.1, -1.5, -2)), false);
  assertEquals(bounds.contains(new WT.Point3D(-1, -1.6, -2)), false);
  assertEquals(bounds.contains(new WT.Point3D(-1, -1.5, -2.1)), false);
});

Deno.test('contains bounds', () => {
  const container = new WT.BoundingCuboid(new WT.Point3D(0, 0, 0),
                                          new WT.Dimensions(100, 90, 60));
  const containee = new WT.BoundingCuboid(new WT.Point3D(20, 30, 1),
                                          new WT.Dimensions(30, 30, 50));
  const partial = new WT.BoundingCuboid(new WT.Point3D(25, 40, 10),
                                        new WT.Dimensions(50, 40, 70));
  assertEquals(container.containsBounds(containee), true);
  assertEquals(container.containsBounds(partial), false);
  assertEquals(container.intersects(partial), true);
});

Deno.test('insert bounds', () => {
  const container = new WT.BoundingCuboid(new WT.Point3D(0, 0, 0),
                                          new WT.Dimensions(100, 90, 60));
  const partial = new WT.BoundingCuboid(new WT.Point3D(25, 40, 10),
                                        new WT.Dimensions(50, 40, 70));
  container.insert(partial);
  assertEquals(container.width, 100);
  assertEquals(container.depth, 105);
  assertEquals(container.height, 75);
  assertEquals(container.centre.x, 0);
  assertEquals(container.centre.y, 7.5);
  assertEquals(container.centre.z, 7.5);
  assertEquals(container.minLocation.x, -50);
  assertEquals(container.minLocation.y, 7.5-52.5);
  assertEquals(container.minLocation.z, 7.5-37.5);
  assertEquals(container.maxLocation.x, 50);
  assertEquals(container.maxLocation.y, 7.5+52.5);
  assertEquals(container.maxLocation.z, 7.5+37.5);
});

Deno.test('detect collision from north', () => {
});

Deno.test('detect collision from north east', () => {
});

Deno.test('detect collision from east', () => {
});

Deno.test('detect collision from south east', () => {
});

Deno.test('detect collision from south', () => {
});

Deno.test('detect collision from south west', () => {
});

Deno.test('detect collision from west', () => {
});

Deno.test('detect collision from north west', () => {
});
