import * as WT from "../dist/world-tree.mjs";

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
  expect(bounds.minLocation.x).toBe(7.5);
  expect(bounds.minLocation.y).toBe(11.5);
  expect(bounds.minLocation.z).toBe(16);
  expect(bounds.maxLocation.x).toBe(12.5);
  expect(bounds.maxLocation.y).toBe(18.5);
  expect(bounds.maxLocation.z).toBe(24);
});

test("initial entity bounds locations", () => {
  const min = new WT.Point3D(7.5, 11.5, 16);
  const dims = new WT.Dimensions(5, 7, 8);
  const id = 0;

  WT.EntityBounds.addEntity(id, min, dims);
  expect(WT.EntityBounds.centreX(id)).toBe(10);
  expect(WT.EntityBounds.centreY(id)).toBe(15);
  expect(WT.EntityBounds.centreZ(id)).toBe(20);
  expect(WT.EntityBounds.width(id)).toBe(5);
  expect(WT.EntityBounds.depth(id)).toBe(7);
  expect(WT.EntityBounds.height(id)).toBe(8);
  expect(WT.EntityBounds.bottomCentre(id).x).toBe(10);
  expect(WT.EntityBounds.bottomCentre(id).y).toBe(15);
  expect(WT.EntityBounds.bottomCentre(id).z).toBe(16);
  expect(WT.EntityBounds.minX(id)).toBe(7.5);
  expect(WT.EntityBounds.minY(id)).toBe(11.5);
  expect(WT.EntityBounds.minZ(id)).toBe(16);
  expect(WT.EntityBounds.maxX(id)).toBe(12.5);
  expect(WT.EntityBounds.maxY(id)).toBe(18.5);
  expect(WT.EntityBounds.maxZ(id)).toBe(24);
});

test("update entity bounds position", () => {
  const min = new WT.Point3D(7.5, 11.5, 16);
  const dims = new WT.Dimensions(5, 7, 8);
  const move = new WT.Vector3D(3, 2, 1);
  const id = 0;

  WT.EntityBounds.addEntity(id, min, dims);
  WT.EntityBounds.translate(id, move);
  expect(WT.EntityBounds.bottomCentre(id).x).toBe(13);
  expect(WT.EntityBounds.bottomCentre(id).y).toBe(17);
  expect(WT.EntityBounds.bottomCentre(id).z).toBe(17);
  expect(WT.EntityBounds.minX(id)).toBe(10.5);
  expect(WT.EntityBounds.minY(id)).toBe(13.5);
  expect(WT.EntityBounds.minZ(id)).toBe(17);
  expect(WT.EntityBounds.maxX(id)).toBe(15.5);
  expect(WT.EntityBounds.maxY(id)).toBe(20.5);
  expect(WT.EntityBounds.maxZ(id)).toBe(25);
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
function tryMoveFiveSteps(position, path, context) {
  const worldCentre = new WT.Point3D(
    worldDims.width / 2,
    worldDims.depth / 2,
    worldDims.height / 2
  );
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
  const context = createMap();
  tryMoveFiveSteps(position, path, context);
});

test("detect collision from north east", () => {
  const idx = 3;
  const idy = 1;
  const posx = squareTileSize * idx;
  const posy = squareTileSize * idy;
  const position = new WT.Point3D(posx, posy, 0);
  const path = new WT.Vector3D(-1, 1, 0);
  const context = createMap();
  tryMoveFiveSteps(position, path, context);
});

test("detect collision from east", () => {
  const idx = 3;
  const idy = 2;
  const posx = squareTileSize * idx + entityDims.width;
  const posy = squareTileSize * idy;
  const position = new WT.Point3D(posx, posy, 0);
  const path = new WT.Vector3D(-1, 0, 0);
  const context = createMap();
  tryMoveFiveSteps(position, path, context);
});

test("detect collision from south east", () => {
  const idx = 3;
  const idy = 3;
  const posx = squareTileSize * idx;
  const posy = squareTileSize * idy + entityDims.depth;
  const position = new WT.Point3D(posx, posy, 0);
  const path = new WT.Vector3D(-1, -1, 0);
  const context = createMap();
  tryMoveFiveSteps(position, path, context);
});

test("detect collision from south", () => {
  const idx = 2;
  const idy = 3;
  const posx = squareTileSize * idx;
  const posy = squareTileSize * idy + entityDims.depth;
  const position = new WT.Point3D(posx, posy, 0);
  const path = new WT.Vector3D(0, -1, 0);
  const context = createMap();
  tryMoveFiveSteps(position, path, context);
});

test("detect collision from south west", () => {
  const idx = 1;
  const idy = 3;
  const posx = squareTileSize * idx;
  const posy = squareTileSize * idy;
  const position = new WT.Point3D(posx, posy, 0);
  const path = new WT.Vector3D(1, -1, 0);
  const context = createMap();
  tryMoveFiveSteps(position, path, context);
});

test("detect collision from west", () => {
  const idx = 1;
  const idy = 2;
  const posx = squareTileSize * idx;
  const posy = squareTileSize * idy;
  const position = new WT.Point3D(posx, posy, 0);
  const path = new WT.Vector3D(1, 0, 0);
  const context = createMap();
  tryMoveFiveSteps(position, path, context);
});

test("detect collision from north west", () => {
  const idx = 1;
  const idy = 1;
  const posx = squareTileSize * idx;
  const posy = squareTileSize * idy;
  const position = new WT.Point3D(posx, posy, 0);
  const path = new WT.Vector3D(1, 1, 0);
  const context = createMap();
  tryMoveFiveSteps(position, path, context);
});

function createMapWithRampUpEast() {
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
    let minLocation = new WT.Point3D(i * (squareTileSize + 0.001), 0, 0);
    new WT.PhysicalEntity(context, minLocation, tileDims);
  }
  // bottom row
  for (let i = 0; i < numTilesWide; i++) {
    let minLocation = new WT.Point3D(i * (squareTileSize + 0.001),
                                     (squareTileSize + 0.001) * 4, 0);
    new WT.PhysicalEntity(context, minLocation, tileDims);
  }
  // left side
  for (let i = 0; i < numTilesDeep; i++) {
    let minLocation = new WT.Point3D(0, i * (squareTileSize + 0.001), 0);
    new WT.PhysicalEntity(context, minLocation, tileDims);
  }
  // right side
  for (let i = 0; i < numTilesDeep; i++) {
    let minLocation = new WT.Point3D(4 * (squareTileSize + 0.001),
                                     i * (squareTileSize + 0.001), 0);
    new WT.PhysicalEntity(context, minLocation, tileDims);
  }
  // middle
  const minLocation = new WT.Point3D(2 * (squareTileSize + 0.001),
                                     2 * (squareTileSize + 0.001), 0);
  const entity = new WT.PhysicalEntity(context, minLocation, tileDims);
  entity.geometry = new WT.RampUpEastGeometry(entity.id);

  return context;
}

test("detect collision from west", () => {
  const idx = 1;
  const idy = 2;
  const posx = squareTileSize * idx;
  const posy = squareTileSize * idy;
  const position = new WT.Point3D(posx, posy, 0.000);
  const path = new WT.Vector3D(1.001, 0, 0);
  const context = createMapWithRampUpEast();
  tryMoveFiveSteps(position, path, context);
});
