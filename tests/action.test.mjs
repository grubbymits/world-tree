import * as WT from "../dist/world-tree.mjs";

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
const worldCentre = new WT.Point3D(
  worldDims.width / 2,
  worldDims.depth / 2,
  worldDims.height / 2
);
function createMap() {
  // *  *  *  *  *
  // *           *
  // *           *
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
  return context;
}

const entityDims = new WT.Dimensions(5, 5, 5);
test("move direction south flat", () => {
  const idx = 1;
  const idy = 1;
  const posx = 1 + squareTileSize * idx;
  const posy = 1 + squareTileSize * idy;
  const pos = new WT.Point3D(posx, posy, 1);
  const moveVector = new WT.Vector3D(0, 1, 0);
  const context = createMap();
  const actor = new WT.Actor(context, pos, entityDims);
  actor.action = new WT.MoveDirection(actor, moveVector, context.bounds);
  actor.update();
  expect(actor.x).toBe(pos.x + moveVector.x);
  expect(actor.y).toBe(pos.y + moveVector.y);
  expect(actor.z).toBe(pos.z + moveVector.z);
});
test("move direction north flat", () => {
  const idx = 1;
  const idy = 3;
  const posx = 1 + squareTileSize * idx;
  const posy = squareTileSize * idy;
  const pos = new WT.Point3D(posx, posy, 1);
  const moveVector = new WT.Vector3D(0, -1, 0);
  const context = createMap();
  const actor = new WT.Actor(context, pos, entityDims);
  actor.action = new WT.MoveDirection(actor, moveVector, context.bounds);
  actor.update();
  expect(actor.x).toBe(pos.x + moveVector.x);
  expect(actor.y).toBe(pos.y + moveVector.y);
  expect(actor.z).toBe(pos.z + moveVector.z);
});
test("move direction east flat", () => {
  const idx = 2;
  const idy = 2;
  const posx = squareTileSize * idx;
  const posy = squareTileSize * idy;
  const pos = new WT.Point3D(posx, posy, 0);
  const moveVector = new WT.Vector3D(1, 0, 0);
  const context = createMap();
  const actor = new WT.Actor(context, pos, entityDims);
  actor.action = new WT.MoveDirection(actor, moveVector, context.bounds);
  actor.update();
  expect(actor.x).toBe(pos.x + moveVector.x);
  expect(actor.y).toBe(pos.y + moveVector.y);
  expect(actor.z).toBe(pos.z + moveVector.z);
});
test("move direction west east", () => {
  const idx = 2;
  const idy = 2;
  const posx = squareTileSize * idx;
  const posy = squareTileSize * idy;
  const pos = new WT.Point3D(posx, posy, 0);
  const moveVector = new WT.Vector3D(-1, 0, 0);
  const context = createMap();
  const actor = new WT.Actor(context, pos, entityDims);
  actor.action = new WT.MoveDirection(actor, moveVector, context.bounds);
  actor.update();
  expect(actor.x).toBe(pos.x + moveVector.x);
  expect(actor.y).toBe(pos.y + moveVector.y);
  expect(actor.z).toBe(pos.z + moveVector.z);
});
