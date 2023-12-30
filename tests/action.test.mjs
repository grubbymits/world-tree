import * as WT from "../dist/world-tree.mjs";
import * as Utils from "./utils.mjs";

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

function getTileSurfaceCentre(x, y) {
  return new WT.Point3D(x * squareTileSize + squareTileSize / 2,
                        y * squareTileSize + squareTileSize / 2,
                        squareTileSize + 1);
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
test("move direction west flat obstructed", () => {
  const idx = 1;
  const idy = 2;
  const posx = squareTileSize * idx;
  const posy = squareTileSize * idy;
  const pos = new WT.Point3D(posx, posy, 0);
  const moveVector = new WT.Vector3D(-1, 0, 0);
  const context = createMap();
  const actor = new WT.Actor(context, pos, entityDims);
  actor.action = new WT.MoveDirection(actor, moveVector, context.bounds);
  actor.update();
  expect(actor.x).toBe(pos.x);
  expect(actor.y).toBe(pos.y);
  expect(actor.z).toBe(pos.z);
});

test("move destination north flat", () => {
  const beginPos = getTileSurfaceCentre(1, 3);
  const destination = getTileSurfaceCentre(1, 1);
  const context = createMap();
  const actor = new WT.Actor(context, beginPos, entityDims);
  const velocity = 2;
  const action = new WT.MoveDestination(actor, velocity, destination);
  actor.action = action;
  let moveVector = destination.vec_diff(actor.bounds.bottomCentre);

  expect(action.d.mag()).toBeCloseTo(velocity, 5);
  const expectedVector = new WT.Vector3D(
    -entityDims.width / 2,
    -2 * squareTileSize - entityDims.depth / 2,
    0
  ); 
  expect(moveVector).toStrictEqual(expectedVector);

  moveVector = moveVector.norm().mulScalar(velocity);
  expect(action.d).toStrictEqual(moveVector);

  const expectedPos = actor.bounds.minLocation.add(moveVector);
  actor.update();
  expect(actor.bounds.minLocation).toStrictEqual(expectedPos);
});

test("move destination south east", () => {
  const beginPos = getTileSurfaceCentre(1, 1);
  const destination = getTileSurfaceCentre(3, 2);
  const context = createMap();
  const actor = new WT.Actor(context, beginPos, entityDims);
  const velocity = 2;
  const action = new WT.MoveDestination(actor, velocity, destination);
  actor.action = action;
  let moveVector = destination.vec_diff(actor.bounds.bottomCentre);

  expect(action.d.mag()).toBeCloseTo(velocity, 5);
  const expectedVector = new WT.Vector3D(
    2 * squareTileSize - entityDims.width / 2,
    squareTileSize - entityDims.depth / 2,
    0
  ); 
  expect(moveVector).toStrictEqual(expectedVector);

  moveVector = moveVector.norm().mulScalar(velocity);
  expect(action.d).toStrictEqual(moveVector);

  const expectedPos = actor.bounds.minLocation.add(moveVector);
  actor.update();
  expect(actor.bounds.minLocation).toStrictEqual(expectedPos);
});

test("move around object", () => {
  const context = WT.createTestContext(
    worldDims,
    WT.Perspective.TwoByOneIsometric
  );
  const terrainType = WT.TerrainType.Lowland0;
  const terrainShape = WT.TerrainShape.Flat;
  const terrainTypes = new Array(5).fill(terrainType);
  const terrainShapes = new Array(5).fill(terrainShape);
  const terrainGridDescriptor = {
    cellHeightGrid: [
      [1, 1, 1, 1, 1],
      [1, 0, 0, 0, 1],
      [1, 0, 1, 0, 1],
      [1, 0, 0, 0, 1],
      [1, 1, 1, 1, 1],
    ],
    typeGrid: new Array(5).fill(terrainTypes),
    shapeGrid: new Array(5).fill(terrainShapes),
    tileDimensions: tileDims,
    cellsX: 5,
    cellsY: 5,
    cellsZ: 2,
  };
  Utils.addDummyTerrainGraphic(terrainType, terrainShape);
  const grid = new WT.TerrainGrid(context, terrainGridDescriptor);

  const minLocation = new WT.Point3D(2 * squareTileSize, 2 * squareTileSize, 0);
  new WT.PhysicalEntity(context, minLocation, tileDims);
  const beginPos = getTileSurfaceCentre(1, 1);
  const destination = getTileSurfaceCentre(3, 3);
  const actor = new WT.Actor(context, beginPos, entityDims);
  const velocity = 5;
  const action = new WT.Navigate(actor, velocity, destination);
  actor.action = action;
  expect(action.waypoints.length).toBe(4);
  expect(action.index).toBe(0);

  actor.update();
  actor.update();
  expect(context.grid.scaleWorldToGrid(actor.bounds.bottomCentre)).toStrictEqual(
    new WT.Point3D(2, 1, 1));
  expect(action.index).toBe(1);

  actor.update();
  actor.update();
  actor.update();
  expect(context.grid.scaleWorldToGrid(actor.bounds.bottomCentre)).toStrictEqual(
    new WT.Point3D(3, 1, 1));
  expect(action.index).toBe(2);

  actor.update();
  actor.update();
  actor.update();
  expect(context.grid.scaleWorldToGrid(actor.bounds.bottomCentre)).toStrictEqual(
    new WT.Point3D(3, 2, 1));
  expect(action.index).toBe(3);

  actor.update();
  actor.update();
  actor.update();
  expect(context.grid.scaleWorldToGrid(actor.bounds.bottomCentre)).toStrictEqual(
    new WT.Point3D(3, 3, 1));
  expect(action.index).toBe(4);
});

