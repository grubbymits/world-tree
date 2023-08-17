import * as WT from "../dist/world-tree.mjs";

test("direction from vector", () => {
  let north = new WT.Vector2D(0, -1);
  let northEast = new WT.Vector2D(2, -1);
  let east = new WT.Vector2D(2, 0);
  let southEast = new WT.Vector2D(2, 2);
  let south = new WT.Vector2D(0, 1);
  let southWest = new WT.Vector2D(-2, 2);
  let west = new WT.Vector2D(-3, 0);
  let northWest = new WT.Vector2D(-3, -3);

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
  let north = new WT.Point2D(0, -2);
  let northEast = new WT.Point2D(1, -1);
  let east = new WT.Point2D(2, 0);
  let southEast = new WT.Point2D(1, 1);
  let south = new WT.Point2D(0, 2);
  let southWest = new WT.Point2D(-1, 1);
  let west = new WT.Point2D(-2, 0);
  let northWest = new WT.Point2D(-1, -1);

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

test("initial locations", () => {
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

test("update position", () => {
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

test("contains location", () => {
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

test("contains bounds", () => {
  const container = new WT.BoundingCuboid(
    new WT.Point3D(0, 0, 0),
    new WT.Dimensions(100, 90, 60)
  );
  const containee = new WT.BoundingCuboid(
    new WT.Point3D(20, 30, 1),
    new WT.Dimensions(30, 30, 50)
  );
  const partial = new WT.BoundingCuboid(
    new WT.Point3D(25, 40, 10),
    new WT.Dimensions(50, 40, 70)
  );
  expect(container.containsBounds(containee)).toBe(true);
  expect(container.containsBounds(partial)).toBe(false);
  expect(container.intersects(partial)).toBe(true);
});

test("insert bounds", () => {
  const container = new WT.BoundingCuboid(
    new WT.Point3D(0, 0, 0),
    new WT.Dimensions(100, 90, 60)
  );
  const partial = new WT.BoundingCuboid(
    new WT.Point3D(25, 40, 10),
    new WT.Dimensions(50, 40, 70)
  );
  container.insert(partial);
  expect(container.width).toBe(100);
  expect(container.depth).toBe(105);
  expect(container.height).toBe(75);
  expect(container.centre.x).toBe(0);
  expect(container.centre.y).toBe(7.5);
  expect(container.centre.z).toBe(7.5);
  expect(container.minLocation.x).toBe(-50);
  expect(container.minLocation.y).toBe(7.5 - 52.5);
  expect(container.minLocation.z).toBe(7.5 - 37.5);
  expect(container.maxLocation.x).toBe(50);
  expect(container.maxLocation.y).toBe(7.5 + 52.5);
  expect(container.maxLocation.z).toBe(7.5 + 37.5);
});

const numTilesWide = 5;
const numTilesDeep = 5;
const numTilesHigh = 1;
const squareTileSize = 10;
const tileDims = new WT.Dimensions(
  squareTileSize,
  squareTileSize,
  squareTileSize
);
const worldDims = new WT.Dimensions(
  numTilesWide * squareTileSize,
  numTilesDeep * squareTileSize,
  numTilesHigh * squareTileSize
);
function createMap() {
  // *  *  *  *  *
  // *           *
  // *     *     *
  // *           *
  // *  *  *  *  *
  const context = WT.createTestContext(
    worldDims,
    WT.Perspective.TwoByOneIsometric
  );
  // top row
  for (let i = 0; i < numTilesWide; i++) {
    let minLocation = new WT.Point3D(i * squareTileSize, 0, 0);
    new WT.PhysicalEntity(context, minLocation, tileDims);
  }
  // bottom row
  for (let i = 0; i < numTilesWide; i++) {
    let minLocation = new WT.Point3D(i * squareTileSize, squareTileSize * 4, 0);
    new WT.PhysicalEntity(context, minLocation, tileDims);
  }
  // left side
  for (let i = 0; i < numTilesDeep; i++) {
    let minLocation = new WT.Point3D(0, i * squareTileSize, 0);
    new WT.PhysicalEntity(context, minLocation, tileDims);
  }
  // right side
  for (let i = 0; i < numTilesDeep; i++) {
    let minLocation = new WT.Point3D(4 * squareTileSize, i * squareTileSize, 0);
    new WT.PhysicalEntity(context, minLocation, tileDims);
  }
  // middle
  let minLocation = new WT.Point3D(2 * squareTileSize, 2 * squareTileSize, 0);
  new WT.PhysicalEntity(context, minLocation, tileDims);

  return context;
}

const entityDims = new WT.Dimensions(5, 5, 5);
function tryMoveFiveSteps(position, path) {
  const worldCentre = new WT.Point3D(
    worldDims.width / 2,
    worldDims.depth / 2,
    worldDims.height / 2
  );
  const context = createMap();
  const movable = new WT.MovableEntity(context, position, entityDims);
  const area = new WT.BoundingCuboid(worldCentre, worldDims);
  // step 1
  let detection = WT.CollisionDetector.detectInArea(movable, path, area);
  expect(detection).toBeNull();
  movable.updatePosition(path);

  // step 2
  detection = WT.CollisionDetector.detectInArea(movable, path, area);
  expect(detection).toBeNull();
  movable.updatePosition(path);

  // step 3
  detection = WT.CollisionDetector.detectInArea(movable, path, area);
  expect(detection).toBeNull();
  movable.updatePosition(path);

  // step 4
  detection = WT.CollisionDetector.detectInArea(movable, path, area);
  expect(detection).toBeNull();
  movable.updatePosition(path);

  // step 5
  detection = WT.CollisionDetector.detectInArea(movable, path, area);
  expect(detection).not.toBeNull();
}

test("detect collision from north", () => {
  const idx = 2;
  const idy = 1;
  const posx = squareTileSize * idx;
  const posy = squareTileSize * idy;
  const position = new WT.Point3D(posx, posy, 0);
  const path = new WT.Vector3D(0, 1, 0);
  tryMoveFiveSteps(position, path);
});

test("detect collision from north east", () => {
  const idx = 3;
  const idy = 1;
  const posx = squareTileSize * idx;
  const posy = squareTileSize * idy;
  const position = new WT.Point3D(posx, posy, 0);
  const path = new WT.Vector3D(-1, 1, 0);
  tryMoveFiveSteps(position, path);
});

test("detect collision from east", () => {
  const idx = 3;
  const idy = 2;
  const posx = squareTileSize * idx + entityDims.width;
  const posy = squareTileSize * idy;
  const position = new WT.Point3D(posx, posy, 0);
  const path = new WT.Vector3D(-1, 0, 0);
  tryMoveFiveSteps(position, path);
});

test("detect collision from south east", () => {
  const idx = 3;
  const idy = 3;
  const posx = squareTileSize * idx;
  const posy = squareTileSize * idy + entityDims.depth;
  const position = new WT.Point3D(posx, posy, 0);
  const path = new WT.Vector3D(-1, -1, 0);
  tryMoveFiveSteps(position, path);
});

test("detect collision from south", () => {
  const idx = 2;
  const idy = 3;
  const posx = squareTileSize * idx;
  const posy = squareTileSize * idy + entityDims.depth;
  const position = new WT.Point3D(posx, posy, 0);
  const path = new WT.Vector3D(0, -1, 0);
  tryMoveFiveSteps(position, path);
});

test("detect collision from south west", () => {
  const idx = 1;
  const idy = 3;
  const posx = squareTileSize * idx;
  const posy = squareTileSize * idy;
  const position = new WT.Point3D(posx, posy, 0);
  const path = new WT.Vector3D(1, -1, 0);
  tryMoveFiveSteps(position, path);
});

test("detect collision from west", () => {
  const idx = 1;
  const idy = 2;
  const posx = squareTileSize * idx;
  const posy = squareTileSize * idy;
  const position = new WT.Point3D(posx, posy, 0);
  const path = new WT.Vector3D(1, 0, 0);
  tryMoveFiveSteps(position, path);
});

test("detect collision from north west", () => {
  const idx = 1;
  const idy = 1;
  const posx = squareTileSize * idx;
  const posy = squareTileSize * idy;
  const position = new WT.Point3D(posx, posy, 0);
  const path = new WT.Vector3D(1, 1, 0);
  tryMoveFiveSteps(position, path);
});
