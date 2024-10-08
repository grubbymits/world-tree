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
const entityDims = new WT.Dimensions(5, 5, 5);
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
    new WT.CuboidEntity(context, minLocation, tileDims);
  }
  // bottom row
  for (let i = 0; i < numTilesWide; i++) {
    let minLocation = new WT.Point3D(i * squareTileSize, squareTileSize * 4, 0);
    new WT.CuboidEntity(context, minLocation, tileDims);
  }
  // left side
  for (let i = 0; i < numTilesDeep; i++) {
    let minLocation = new WT.Point3D(0, i * squareTileSize, 0);
    new WT.CuboidEntity(context, minLocation, tileDims);
  }
  // right side
  for (let i = 0; i < numTilesDeep; i++) {
    let minLocation = new WT.Point3D(4 * squareTileSize, i * squareTileSize, 0);
    new WT.CuboidEntity(context, minLocation, tileDims);
  }
  return context;
}

function getTileSurfaceCentre(x, y) {
  return new WT.Point3D(x * squareTileSize + squareTileSize / 2,
                        y * squareTileSize + squareTileSize / 2,
                        squareTileSize + 1);
}

test("move direction south flat", () => {
  const idx = 1;
  const idy = 1;
  const posx = 1 + squareTileSize * idx;
  const posy = 1 + squareTileSize * idy;
  const pos = new WT.Point3D(posx, posy, 1);
  const moveVector = new WT.Vector3D(0, 1, 0);
  const context = createMap();
  const actor = new WT.Actor(context, pos, entityDims);
  actor.action = new WT.MoveDirection(actor, moveVector);
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
  actor.action = new WT.MoveDirection(actor, moveVector);
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
  let moveVector = destination.vec_diff(WT.EntityBounds.bottomCentre(actor.id));
  actor.action.perform();

  expect(action.d.mag()).toBeCloseTo(velocity, 5);
  const expectedVector = new WT.Vector3D(
    -entityDims.width / 2,
    -2 * squareTileSize - entityDims.depth / 2,
    0
  ); 
  expect(moveVector).toStrictEqual(expectedVector);

  moveVector = moveVector.norm().scale(velocity);
  expect(action.d).toStrictEqual(moveVector);

  const expectedPos = WT.EntityBounds.minLocation(actor.id).add(moveVector);
  actor.update();
  expect(WT.EntityBounds.minLocation(actor.id)).toStrictEqual(expectedPos);
});

test("move destination south east", () => {
  const beginPos = getTileSurfaceCentre(1, 1);
  const destination = getTileSurfaceCentre(3, 2);
  const context = createMap();
  const actor = new WT.Actor(context, beginPos, entityDims);
  const velocity = 2;
  const action = new WT.MoveDestination(actor, velocity, destination);
  actor.action = action;
  let moveVector = destination.vec_diff(WT.EntityBounds.bottomCentre(actor.id));
  actor.action.perform();

  expect(action.d.mag()).toBeCloseTo(velocity, 5);
  const expectedVector = new WT.Vector3D(
    2 * squareTileSize - entityDims.width / 2,
    squareTileSize - entityDims.depth / 2,
    0
  ); 
  expect(moveVector).toStrictEqual(expectedVector);

  moveVector = moveVector.norm().scale(velocity);
  expect(action.d).toStrictEqual(moveVector);

  const expectedPos = WT.EntityBounds.minLocation(actor.id).add(moveVector);
  actor.update();
  expect(WT.EntityBounds.minLocation(actor.id)).toStrictEqual(expectedPos);
});

test("move around object", () => {
  const cellsX = 5;
  const cellsY = 5;
  const cellsZ = 2;
  const context = WT.createTestContext(
    new WT.Dimensions(
      cellsX * squareTileSize,
      cellsY * squareTileSize,
      cellsZ * squareTileSize
    ),
    WT.Perspective.TwoByOneIsometric
  );
  const terrainType = WT.TerrainType.Lowland0;
  const terrainShape = WT.TerrainShape.Flat;
  const terrainTypes = new Array(5).fill(terrainType);
  const terrainShapes = new Array(5).fill(terrainShape);
  const terrainGridDescriptor = {
    cellHeightGrid: [
      new Uint8Array([1, 1, 1, 1, 1]),
      new Uint8Array([1, 0, 0, 0, 1]),
      new Uint8Array([1, 0, 1, 0, 1]),
      new Uint8Array([1, 0, 0, 0, 1]),
      new Uint8Array([1, 1, 1, 1, 1]),
    ],
    typeGrid: new Array(5).fill(terrainTypes),
    shapeGrid: new Array(5).fill(terrainShapes),
    tileDimensions: tileDims,
    cellsX: cellsX,
    cellsY: cellsY,
    cellsZ: cellsZ,
  };
  Utils.addDummyTerrainGraphic(terrainType, terrainShape);
  const grid = new WT.TerrainGrid(context, terrainGridDescriptor);

  const minLocation = new WT.Point3D(2 * squareTileSize, 2 * squareTileSize, 0);
  new WT.CuboidEntity(context, minLocation, tileDims);
  const beginPos = getTileSurfaceCentre(1, 1);
  const destination = getTileSurfaceCentre(3, 3);
  const actor = new WT.Actor(context, beginPos, entityDims);

  const edges = WT.findEdges(terrainGridDescriptor.cellHeightGrid);
  const blockingGrid = WT.buildBlockingGrid(
    terrainGridDescriptor.cellHeightGrid,
    edges,
    [], // ramps
  );
  const velocity = 5;
  const action = new WT.Navigate(actor, velocity, destination, blockingGrid);
  actor.action = action;
  expect(action.waypoints.length).toBe(4);
  expect(action.index).toBe(0);

  actor.update();
  actor.update();
  expect(action.index).toBe(1);
  expect(
    context.grid.scaleWorldToGrid(WT.EntityBounds.bottomCentre(actor.id))
  ).toStrictEqual(new WT.Point3D(2, 1, 1));

  actor.update();
  actor.update();
  actor.update();
  expect(action.index).toBe(2);
  expect(
    context.grid.scaleWorldToGrid(WT.EntityBounds.bottomCentre(actor.id))
  ).toStrictEqual(new WT.Point3D(3, 1, 1));

  actor.update();
  actor.update();
  actor.update();
  expect(action.index).toBe(3);
  expect(
    context.grid.scaleWorldToGrid(WT.EntityBounds.bottomCentre(actor.id))
  ).toStrictEqual(new WT.Point3D(3, 2, 1));

  actor.update();
  actor.update();
  actor.update();
  expect(action.index).toBe(4);
  expect(
    context.grid.scaleWorldToGrid(WT.EntityBounds.bottomCentre(actor.id))
  ).toStrictEqual(new WT.Point3D(3, 3, 1));
});

test("move down ramp", () => {
  const cellsX = 5;
  const cellsY = 5;
  const cellsZ = 3;
  const context = WT.createTestContext(
    new WT.Dimensions(
      cellsX * squareTileSize,
      cellsY * squareTileSize,
      cellsZ * squareTileSize
    ),
    WT.Perspective.TwoByOneIsometric
  );
  WT.Gravity.init(context);

  const terrainType = WT.TerrainType.Lowland0;
  const terrainShape = WT.TerrainShape.Flat;
  const terrainTypes = new Array(5).fill(terrainType);
  const shapeGrid = new Array(cellsY);
  for (let y = 0; y < cellsY; ++y) {
    shapeGrid[y] = new Array(cellsX);
    for (let x = 0; x < cellsX; ++x) {
      if (y == 2 && x == 2) {
        shapeGrid[2][2] = WT.TerrainShape.RampNorth;
      } else {
        shapeGrid[y][x] = WT.TerrainShape.Flat;
      }
    }
  }

  const terrainGridDescriptor = {
    cellHeightGrid: [
      new Uint8Array([1, 1, 1, 1, 1]),
      new Uint8Array([1, 0, 1, 0, 1]),
      new Uint8Array([1, 0, 1, 0, 1]),
      new Uint8Array([1, 0, 0, 0, 1]),
      new Uint8Array([1, 1, 1, 1, 1]),
    ],
    typeGrid: new Array(5).fill(terrainTypes),
    shapeGrid: shapeGrid,
    tileDimensions: tileDims,
    cellsX: cellsX,
    cellsY: cellsY,
    cellsZ: cellsZ,
  };

  Utils.addDummyTerrainGraphic(terrainType, terrainShape);
  Utils.addDummyTerrainGraphic(terrainType, WT.TerrainShape.RampNorth);
  const grid = new WT.TerrainGrid(context, terrainGridDescriptor);

  const beginPos = context.grid.getCentreSurfaceLocationAt(2, 1);
  const actor = new WT.Actor(context, beginPos, entityDims);
  actor.gravitySpeed = 0.1;
  const d = WT.Navigation.getDirectionVector(WT.Direction.South).scale(2);
  actor.action = new WT.MoveDirection(actor, d);

  expect(
    context.grid.scaleWorldToGrid(WT.EntityBounds.bottomCentre(actor.id))
  ).toStrictEqual(new WT.Point3D(2, 1, 2));

  expect(actor.action.perform()).toBe(false);
  WT.Gravity.update(context.movables);
  actor.action.perform();
  WT.Gravity.update(context.movables);
  expect(
    context.grid.scaleWorldToGrid(WT.EntityBounds.bottomCentre(actor.id))
  ).toStrictEqual(new WT.Point3D(2, 2, 2));

  expect(actor.action.perform()).toBe(false);
  WT.Gravity.update(context.movables);
  actor.action.perform();
  WT.Gravity.update(context.movables);
  actor.action.perform();
  WT.Gravity.update(context.movables);
  actor.action.perform();
  WT.Gravity.update(context.movables);
  actor.action.perform();
  WT.Gravity.update(context.movables);
  expect(
    context.grid.scaleWorldToGrid(WT.EntityBounds.bottomCentre(actor.id))
  ).toStrictEqual(new WT.Point3D(2, 3, 1));
});

test("move up ramp", () => {
  const cellsX = 5;
  const cellsY = 5;
  const cellsZ = 3;
  const context = WT.createTestContext(
    new WT.Dimensions(
      cellsX * squareTileSize,
      cellsY * squareTileSize,
      cellsZ * squareTileSize
    ),
    WT.Perspective.TwoByOneIsometric
  );
  WT.Gravity.init(context);

  const terrainType = WT.TerrainType.Lowland0;
  const terrainShape = WT.TerrainShape.Flat;
  const terrainTypes = new Array(5).fill(terrainType);
  const shapeGrid = new Array(cellsY);
  for (let y = 0; y < cellsY; ++y) {
    shapeGrid[y] = new Array(cellsX);
    for (let x = 0; x < cellsX; ++x) {
      if (y == 2 && x == 2) {
        shapeGrid[2][2] = WT.TerrainShape.RampNorth;
      } else {
        shapeGrid[y][x] = WT.TerrainShape.Flat;
      }
    }
  }

  const terrainGridDescriptor = {
    cellHeightGrid: [
      [1, 1, 1, 1, 1],
      [1, 0, 1, 0, 1],
      [1, 0, 1, 0, 1],
      [1, 0, 0, 0, 1],
      [1, 1, 1, 1, 1],
    ],
    typeGrid: new Array(5).fill(terrainTypes),
    shapeGrid: shapeGrid,
    tileDimensions: tileDims,
    cellsX: cellsX,
    cellsY: cellsY,
    cellsZ: cellsZ,
  };

  Utils.addDummyTerrainGraphic(terrainType, terrainShape);
  Utils.addDummyTerrainGraphic(terrainType, WT.TerrainShape.RampNorth);
  const grid = new WT.TerrainGrid(context, terrainGridDescriptor);

  const beginPos = context.grid.getCentreSurfaceLocationAt(2, 3);
  const actor = new WT.Actor(context, beginPos, entityDims);
  actor.gravitySpeed = 0.1;
  const d = WT.Navigation.getDirectionVector(WT.Direction.North).scale(2);
  actor.action = new WT.MoveDirection(actor, d);

  expect(
    context.grid.scaleWorldToGrid(WT.EntityBounds.bottomCentre(actor.id))
  ).toStrictEqual(new WT.Point3D(2, 3, 1));

  expect(actor.action.perform()).toBe(false);
  WT.Gravity.update(context.movables);
  actor.action.perform();
  WT.Gravity.update(context.movables);
  actor.action.perform();
  WT.Gravity.update(context.movables);
  actor.action.perform();
  WT.Gravity.update(context.movables);
  expect(actor.action.adjustedD.y).toBeCloseTo(-1.57);
  expect(actor.action.adjustedD.z).toBeCloseTo(1.57);
  WT.Gravity.update(context.movables);
  actor.action.perform();
  WT.Gravity.update(context.movables);
  actor.action.perform();
  WT.Gravity.update(context.movables);
  actor.action.perform();
  WT.Gravity.update(context.movables);
  actor.action.perform();
  WT.Gravity.update(context.movables);
  actor.action.perform();
  expect(
    context.grid.scaleWorldToGrid(WT.EntityBounds.bottomCentre(actor.id))
  ).toStrictEqual(new WT.Point3D(2, 2, 2));

  expect(actor.action.perform()).toBe(false);
  WT.Gravity.update(context.movables);
  actor.action.perform();
  WT.Gravity.update(context.movables);
  actor.action.perform();
  WT.Gravity.update(context.movables);
  actor.action.perform();
  WT.Gravity.update(context.movables);
  actor.action.perform();
  WT.Gravity.update(context.movables);
  expect(
    context.grid.scaleWorldToGrid(WT.EntityBounds.bottomCentre(actor.id))
  ).toStrictEqual(new WT.Point3D(2, 1, 2));
});
