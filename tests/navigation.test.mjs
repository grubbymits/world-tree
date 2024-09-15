import * as WT from "../dist/world-tree.mjs";

test("direction from vector", () => {
  const north = new WT.Vector2D(0, -1);
  const northEast = new WT.Vector2D(2, -1);
  const east = new WT.Vector2D(2, 0);
  const southEast = new WT.Vector2D(2, 2);
  const south = new WT.Vector2D(0, 1);
  const southWest = new WT.Vector2D(-2, 2);
  const west = new WT.Vector2D(-3, 0);
  const northWest = new WT.Vector2D(-3, -3);

  expect(WT.Navigation.getDirectionFromVector(north)).toBe(WT.Direction.North);
  expect(WT.Navigation.getDirectionFromVector(northEast)).toBe(
    WT.Direction.NorthEast
  );
  expect(WT.Navigation.getDirectionFromVector(east)).toBe(WT.Direction.East);
  expect(WT.Navigation.getDirectionFromVector(southEast)).toBe(
    WT.Direction.SouthEast
  );
  expect(WT.Navigation.getDirectionFromVector(south)).toBe(WT.Direction.South);
  expect(WT.Navigation.getDirectionFromVector(southWest)).toBe(
    WT.Direction.SouthWest
  );
  expect(WT.Navigation.getDirectionFromVector(west)).toBe(WT.Direction.West);
  expect(WT.Navigation.getDirectionFromVector(northWest)).toBe(
    WT.Direction.NorthWest
  );
});

test("direction from 2D points", () => {
  const north = new WT.Point2D(0, -2);
  const northEast = new WT.Point2D(1, -1);
  const east = new WT.Point2D(2, 0);
  const southEast = new WT.Point2D(1, 1);
  const south = new WT.Point2D(0, 2);
  const southWest = new WT.Point2D(-1, 1);
  const west = new WT.Point2D(-2, 0);
  const northWest = new WT.Point2D(-1, -1);

  expect(WT.Navigation.getDirectionFromPoints(south, north)).toBe(
    WT.Direction.North
  );
  expect(WT.Navigation.getDirectionFromPoints(north, south)).toBe(
    WT.Direction.South
  );
  expect(WT.Navigation.getDirectionFromPoints(east, west)).toBe(
    WT.Direction.West
  );
  expect(WT.Navigation.getDirectionFromPoints(west, east)).toBe(
    WT.Direction.East
  );
  expect(WT.Navigation.getDirectionFromPoints(northEast, southWest)).toBe(
    WT.Direction.SouthWest
  );
  expect(WT.Navigation.getDirectionFromPoints(southWest, northEast)).toBe(
    WT.Direction.NorthEast
  );
  expect(WT.Navigation.getDirectionFromPoints(northWest, southEast)).toBe(
    WT.Direction.SouthEast
  );
  expect(WT.Navigation.getDirectionFromPoints(southEast, northWest)).toBe(
    WT.Direction.NorthWest
  );
});

test("adjacent coord", () => {
  const centre = new WT.Point2D(0, 0);
  const north = new WT.Point2D(0, -1);
  const northEast = new WT.Point2D(1, -1);
  const east = new WT.Point2D(1, 0);
  const southEast = new WT.Point2D(1, 1);
  const south = new WT.Point2D(0, 1);
  const southWest = new WT.Point2D(-1, 1);
  const west = new WT.Point2D(-1, 0);
  const northWest = new WT.Point2D(-1, -1);

  expect(
    WT.Navigation.getAdjacentCoord(centre, WT.Direction.North)
  ).toStrictEqual(north);
  expect(
    WT.Navigation.getAdjacentCoord(centre, WT.Direction.NorthEast)
  ).toStrictEqual(northEast);
  expect(
    WT.Navigation.getAdjacentCoord(centre, WT.Direction.East)
  ).toStrictEqual(east);
  expect(
    WT.Navigation.getAdjacentCoord(centre, WT.Direction.SouthEast)
  ).toStrictEqual(southEast);
  expect(
    WT.Navigation.getAdjacentCoord(centre, WT.Direction.South)
  ).toStrictEqual(south);
  expect(
    WT.Navigation.getAdjacentCoord(centre, WT.Direction.SouthWest)
  ).toStrictEqual(southWest);
  expect(
    WT.Navigation.getAdjacentCoord(centre, WT.Direction.West)
  ).toStrictEqual(west);
  expect(
    WT.Navigation.getAdjacentCoord(centre, WT.Direction.NorthWest)
  ).toStrictEqual(northWest);
});

test("opposite direction", () => {
  expect(WT.Navigation.getOppositeDirection(WT.Direction.North)).toBe(
    WT.Direction.South
  );
  expect(WT.Navigation.getOppositeDirection(WT.Direction.NorthEast)).toBe(
    WT.Direction.SouthWest
  );
  expect(WT.Navigation.getOppositeDirection(WT.Direction.East)).toBe(
    WT.Direction.West
  );
  expect(WT.Navigation.getOppositeDirection(WT.Direction.SouthEast)).toBe(
    WT.Direction.NorthWest
  );
  expect(WT.Navigation.getOppositeDirection(WT.Direction.South)).toBe(
    WT.Direction.North
  );
  expect(WT.Navigation.getOppositeDirection(WT.Direction.SouthWest)).toBe(
    WT.Direction.NorthEast
  );
  expect(WT.Navigation.getOppositeDirection(WT.Direction.West)).toBe(
    WT.Direction.East
  );
  expect(WT.Navigation.getOppositeDirection(WT.Direction.NorthWest)).toBe(
    WT.Direction.SouthEast
  );
});

test("direction vector round test", () => {
  for (let direction = 0; direction < WT.Direction.Max; ++direction) {
    const d = WT.Navigation.getDirectionVector(direction);
    expect(WT.Navigation.getDirectionFromVector(new WT.Vector2D(d.x, d.y))).toBe(direction);
  }
});

test("adjacent directions", () => {
  expect(WT.Navigation.getAdjacentDirections(WT.Direction.North)).toStrictEqual([WT.Direction.NorthWest, WT.Direction.NorthEast]);
  expect(WT.Navigation.getAdjacentDirections(WT.Direction.NorthEast)).toStrictEqual([WT.Direction.North, WT.Direction.East]);
  expect(WT.Navigation.getAdjacentDirections(WT.Direction.East)).toStrictEqual([WT.Direction.NorthEast, WT.Direction.SouthEast]);
  expect(WT.Navigation.getAdjacentDirections(WT.Direction.SouthEast)).toStrictEqual([WT.Direction.East, WT.Direction.South]);
  expect(WT.Navigation.getAdjacentDirections(WT.Direction.South)).toStrictEqual([WT.Direction.SouthEast, WT.Direction.SouthWest]);
  expect(WT.Navigation.getAdjacentDirections(WT.Direction.SouthWest)).toStrictEqual([WT.Direction.South, WT.Direction.West]);
  expect(WT.Navigation.getAdjacentDirections(WT.Direction.West)).toStrictEqual([WT.Direction.SouthWest, WT.Direction.NorthWest]);
  expect(WT.Navigation.getAdjacentDirections(WT.Direction.NorthWest)).toStrictEqual([WT.Direction.West, WT.Direction.North]);
});
