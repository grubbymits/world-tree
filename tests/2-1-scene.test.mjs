import * as WT from "../dist/world-tree.mjs";

const gap = 0.001;
const width = 72;
const depth = 72;
const height = 97;
const entityDimensions = new WT.Dimensions(width, depth, height);
const dummyGraphic = new WT.DummyGraphicComponent(322, 270);

function getDimensions(spriteWidth, spriteHeight) {
  return WT.TwoByOneIsometric.getDimensions(spriteWidth, spriteHeight);
}

function drawCoord(entity) {
  return WT.TwoByOneIsometric.getDrawCoord(entity.bounds.minLocation);
}

test("calculate physical dimensions from sprite dimensions", () => {
  const spriteWidth = 161;
  const spriteHeight = 123;
  const dims = getDimensions(spriteWidth, spriteHeight);
  expect(dims.width).toBeCloseTo(36.0);
  expect(dims.depth).toBeCloseTo(36.0);
  expect(dims.height).toBeCloseTo(38.01);
});

test("draw order of single row", () => {
  const numEntities = 4;
  const worldDims = new WT.Dimensions(width * numEntities, depth, height);
  let context = WT.createTestContext(
    worldDims,
    WT.Perspective.TwoByOneIsometric
  );
  let scene = new WT.TwoByOneIsometric();
  let nodes = new Array();
  for (let i = 0; i < numEntities; i++) {
    let minLocation = new WT.Point3D(i * (entityDimensions.width + gap), 0, 0);
    let entity = new WT.CuboidEntity(context, minLocation, entityDimensions);
    entity.addGraphic(dummyGraphic);
    let node = new WT.SceneNode(entity, scene);
    nodes.push(node);
  }
  expect(scene.drawOrder(nodes[0], nodes[1])).toBe(WT.RenderOrder.After);
  expect(scene.drawOrder(nodes[1], nodes[2])).toBe(WT.RenderOrder.After);
  expect(scene.drawOrder(nodes[2], nodes[3])).toBe(WT.RenderOrder.After);
  expect(scene.drawOrder(nodes[3], nodes[2])).toBe(WT.RenderOrder.Before);
  expect(scene.drawOrder(nodes[2], nodes[1])).toBe(WT.RenderOrder.Before);
  expect(scene.drawOrder(nodes[1], nodes[0])).toBe(WT.RenderOrder.Before);
});

test("draw order of single column", () => {
  const numEntities = 4;
  const worldDims = new WT.Dimensions(width * numEntities, depth, height);
  let context = WT.createTestContext(
    worldDims,
    WT.Perspective.TwoByOneIsometric
  );
  let scene = new WT.TwoByOneIsometric();
  let nodes = new Array();
  for (let i = 0; i < numEntities; i++) {
    let minLocation = new WT.Point3D(0, i * (entityDimensions.depth + gap), 0);
    let entity = new WT.CuboidEntity(context, minLocation, entityDimensions);
    entity.addGraphic(dummyGraphic);
    let node = new WT.SceneNode(entity, scene);
    nodes.push(node);
  }
  expect(scene.drawOrder(nodes[0], nodes[1])).toBe(WT.RenderOrder.Before);
  expect(scene.drawOrder(nodes[1], nodes[2])).toBe(WT.RenderOrder.Before);
  expect(scene.drawOrder(nodes[2], nodes[3])).toBe(WT.RenderOrder.Before);
  expect(scene.drawOrder(nodes[3], nodes[2])).toBe(WT.RenderOrder.After);
  expect(scene.drawOrder(nodes[2], nodes[1])).toBe(WT.RenderOrder.After);
  expect(scene.drawOrder(nodes[1], nodes[0])).toBe(WT.RenderOrder.After);
});

test("draw order of (x, y) increasing diagonal", () => {
  const numEntities = 4;
  const worldDims = new WT.Dimensions(width * numEntities, depth, height);
  let context = WT.createTestContext(
    worldDims,
    WT.Perspective.TwoByOneIsometric
  );
  let scene = new WT.TwoByOneIsometric();
  let nodes = new Array();
  for (let i = 0; i < numEntities; i++) {
    let minLocation = new WT.Point3D(
      i * (entityDimensions.width + gap),
      i * (entityDimensions.depth + gap),
      0
    );
    let entity = new WT.CuboidEntity(context, minLocation, entityDimensions);
    entity.addGraphic(dummyGraphic);
    let node = new WT.SceneNode(entity, context.scene);
    nodes.push(node);
  }

  // TODO: We should be able to have these all as Any.
  expect(scene.drawOrder(nodes[0], nodes[1])).toBe(WT.RenderOrder.Before);
  expect(scene.drawOrder(nodes[0], nodes[2])).toBe(WT.RenderOrder.Any);
  expect(scene.drawOrder(nodes[0], nodes[3])).toBe(WT.RenderOrder.Any);
  expect(scene.drawOrder(nodes[1], nodes[2])).toBe(WT.RenderOrder.Before);
  expect(scene.drawOrder(nodes[1], nodes[3])).toBe(WT.RenderOrder.Any);
  expect(scene.drawOrder(nodes[2], nodes[3])).toBe(WT.RenderOrder.Before);
  expect(scene.drawOrder(nodes[3], nodes[2])).toBe(WT.RenderOrder.After);
  expect(scene.drawOrder(nodes[2], nodes[1])).toBe(WT.RenderOrder.After);
  expect(scene.drawOrder(nodes[1], nodes[0])).toBe(WT.RenderOrder.After);
});

test("draw order of (x, y) four in a square", () => {
  const numEntities = 4;
  const worldDims = new WT.Dimensions(width * 2, depth * 2, height);
  let context = WT.createTestContext(
    worldDims,
    WT.Perspective.TwoByOneIsometric
  );
  for (let y = 0; y < 2; ++y) {
    for (let x = 0; x < 2; ++x) {
      let minLocation = new WT.Point3D(
        x * (entityDimensions.width + gap),
        y * (entityDimensions.depth + gap),
        0
      );
      let entity = new WT.CuboidEntity(
        context,
        minLocation,
        entityDimensions
      );
      entity.addGraphic(dummyGraphic);
    }
  }

  let camera = new WT.Camera(context.scene, 1920, 1080);
  camera.location = new WT.Point3D(0, 0, 0);
  context.scene.render(camera, false);

  //expect(context.scene.graph.initialised).toBe(true);
  expect(context.scene.graph.order.length).toBe(numEntities);

  let order = context.scene.graph.order;
  order.reverse();
  expect(order[0].entity.id).toBe(1);
  expect(order[1].entity.id).toBe(0);
  expect(order[2].entity.id).toBe(3);
  expect(order[3].entity.id).toBe(2);
});

test("draw order of (x, y, z) eight in a cube", () => {
  const worldDims = new WT.Dimensions(width * 2, depth * 2, height * 2);
  let context = WT.createTestContext(
    worldDims,
    WT.Perspective.TwoByOneIsometric
  );
  for (let z = 0; z < 2; ++z) {
    for (let y = 0; y < 2; ++y) {
      for (let x = 0; x < 2; ++x) {
        let minLocation = new WT.Point3D(
          x * (entityDimensions.width + gap),
          y * (entityDimensions.depth + gap),
          z * (entityDimensions.height + gap)
        );
        let entity = new WT.CuboidEntity(
          context,
          minLocation,
          entityDimensions
        );
        entity.addGraphic(dummyGraphic);
      }
    }
  }

  let camera = new WT.Camera(context.scene, 1920, 1080);
  camera.location = new WT.Point3D(0, 0, 0);
  context.scene.render(camera, false);

  let drawOrder = context.scene.graph.order.slice(); //level.order.slice();
  drawOrder.reverse();
  expect(drawOrder.length).toBe(8);
  expect(drawOrder[0].entity.id).toBe(1);
  expect(drawOrder[1].entity.id).toBe(5);
  expect(drawOrder[2].entity.id).toBe(0);
  expect(drawOrder[3].entity.id).toBe(4);

  expect(drawOrder[4].entity.id).toBe(3);
  expect(drawOrder[5].entity.id).toBe(7);
  expect(drawOrder[6].entity.id).toBe(2);
  expect(drawOrder[7].entity.id).toBe(6);
});

test("draw order of (x, y, z) updating eight in a cube", () => {
  const worldDims = new WT.Dimensions(width * 2, depth * 2, height * 2);
  let context = WT.createTestContext(
    worldDims,
    WT.Perspective.TwoByOneIsometric
  );
  let entities = new Array();
  for (let z = 0; z < 2; ++z) {
    for (let y = 0; y < 2; ++y) {
      for (let x = 0; x < 2; ++x) {
        let minLocation = new WT.Point3D(
          x * (entityDimensions.width + gap),
          y * (entityDimensions.depth + gap),
          z * (entityDimensions.height + gap)
        );
        let entity = new WT.CuboidEntity(
          context,
          minLocation,
          entityDimensions
        );
        entity.addGraphic(dummyGraphic);
        entities.push(entity);
      }
    }
  }
  let camera = new WT.Camera(context.scene, 1920, 1080);
  camera.location = new WT.Point3D(0, 0, 0);
  context.scene.render(camera, false);

  let drawOrder = context.scene.graph.order.slice().reverse();
  expect(drawOrder.length).toBe(8);
  expect(drawOrder[0].entity.id).toBe(1);
  expect(drawOrder[1].entity.id).toBe(5);
  expect(drawOrder[2].entity.id).toBe(0);
  expect(drawOrder[3].entity.id).toBe(4);

  expect(drawOrder[4].entity.id).toBe(3);
  expect(drawOrder[5].entity.id).toBe(7);
  expect(drawOrder[6].entity.id).toBe(2);
  expect(drawOrder[7].entity.id).toBe(6);

  entities.forEach((entity) => context.scene.updateEntity(entity));
  drawOrder = context.scene.graph.order.slice().reverse();
  expect(drawOrder.length).toBe(8);
  expect(drawOrder[0].entity.id).toBe(1);
  expect(drawOrder[1].entity.id).toBe(5);
  expect(drawOrder[2].entity.id).toBe(0);
  expect(drawOrder[3].entity.id).toBe(4);
  expect(drawOrder[4].entity.id).toBe(3);
  expect(drawOrder[5].entity.id).toBe(7);
  expect(drawOrder[6].entity.id).toBe(2);
  expect(drawOrder[7].entity.id).toBe(6);
});

test("draw order of (x, y, z) updating level in a cube", () => {
  const worldDims = new WT.Dimensions(width * 2, depth * 2, height * 3);
  let context = WT.createTestContext(
    worldDims,
    WT.Perspective.TwoByOneIsometric
  );

  const addCuboidEntityAt = (x, y, z) => {
    const minLocation = new WT.Point3D(
      x * (entityDimensions.width + gap),
      y * (entityDimensions.depth + gap),
      z * (entityDimensions.height + gap)
    );
    const entity = new WT.CuboidEntity(context, minLocation, entityDimensions);
    entity.addGraphic(dummyGraphic);
    return entity;
  };

  for (let z = 0; z < 2; ++z) {
    for (let y = 0; y < 2; ++y) {
      for (let x = 0; x < 2; ++x) {
        if (z == 1 && y == 0 && x == 0) {
          continue;
        }
        addCuboidEntityAt(x, y, z);
      }
    }
  }
  // One cube above the rest
  const movable = addCuboidEntityAt(0, 0, 2);
  const moveDown = new WT.Vector3D(0, 0, -(height - 2));

  // bottom layer
  // | 0 | 1 |
  // | 2 | 3 |
  // top layer
  // |   | 4 |
  // | 5 | 6 |
  // movable
  // | 7 |
  //
  //
  // | (0, 0, 2)
  // |   __
  // v  |__|__
  //     __|__|
  //    |__|__|
  //
  const camera = new WT.Camera(context.scene, 1920, 1080);
  camera.location = new WT.Point3D(0, 0, 0);
  context.scene.render(camera, false);

  movable.updatePosition(moveDown);
  context.scene.updateEntity(movable);
  context.scene.render(camera, false);

  const drawOrder = context.scene.graph.order.slice().reverse();
  expect(drawOrder.length).toBe(8);
  expect(drawOrder[0].entity.id).toBe(1);
  expect(drawOrder[1].entity.id).toBe(4);
  expect(drawOrder[2].entity.id).toBe(0);
  expect(drawOrder[3].entity.id).toBe(movable.id);
  expect(drawOrder[4].entity.id).toBe(3);
  expect(drawOrder[5].entity.id).toBe(6);
  expect(drawOrder[6].entity.id).toBe(2);
  expect(drawOrder[7].entity.id).toBe(5);
});

test("draw order of (x, y, z) levels with a ramp", () => {
  const worldDims = new WT.Dimensions(width * 2, depth * 2, height * 3);
  let context = WT.createTestContext(
    worldDims,
    WT.Perspective.TwoByOneIsometric
  );

  const addCuboidEntityAt = (x, y, z, dims) => {
    const minLocation = new WT.Point3D(
      x * (entityDimensions.width + gap),
      y * (entityDimensions.depth + gap),
      z * (entityDimensions.height + gap)
    );
    const entity = new WT.CuboidEntity(context, minLocation, dims);
    entity.addGraphic(dummyGraphic);
    return entity;
  };

  for (let z = 0; z < 2; ++z) {
    for (let y = 0; y < 2; ++y) {
      for (let x = 0; x < 2; ++x) {
        if (z == 1 && y == 0 && x == 0) {
          const minLocation = new WT.Point3D(
            x * (entityDimensions.width + gap),
            y * (entityDimensions.depth + gap),
            z * (entityDimensions.height + gap)
          );
          const entity = new WT.RampSouthEntity(context, minLocation, entityDimensions);
          entity.addGraphic(dummyGraphic);
        } else {
          const entity = addCuboidEntityAt(x, y, z, entityDimensions);
        }
      }
    }
  }
  // One cube above the rest
  const movableDimensions = new WT.Dimensions(
    entityDimensions.width / 2,
    entityDimensions.depth / 2,
    entityDimensions.height / 2
  );
  const movable = addCuboidEntityAt(0, 0, 2, movableDimensions);
  const moveDown = new WT.Vector3D(0, 0, -2);

  // bottom layer
  // | 0 | 1 |
  // | 2 | 3 |
  // top layer
  // | 4 | 5 |
  // | 6 | 7 |
  // movable
  // | 8 |
  //
  //
  // | (0, 0, 2)
  // |   _
  // v  |_| __
  //      /|__|
  //    |__|__|
  //
  const camera = new WT.Camera(context.scene, 1920, 1080);
  camera.location = new WT.Point3D(0, 0, 0);
  context.scene.render(camera, false);

  movable.updatePosition(moveDown);
  context.scene.updateEntity(movable);
  context.scene.render(camera, false);

  const drawOrder = context.scene.graph.order.slice().reverse();
  expect(drawOrder.length).toBe(9);
  expect(drawOrder[0].entity.id).toBe(1);
  expect(drawOrder[1].entity.id).toBe(5);
  expect(drawOrder[2].entity.id).toBe(0);
  expect(drawOrder[3].entity.id).toBe(4);
  expect(drawOrder[4].entity.id).toBe(movable.id);
  expect(drawOrder[5].entity.id).toBe(3);
  expect(drawOrder[6].entity.id).toBe(7);
  expect(drawOrder[7].entity.id).toBe(2);
  expect(drawOrder[8].entity.id).toBe(6);
});

test("draw order of short and tall", () => {
  const cellsX = 3;
  const cellsY = 3;
  const cellsZ = 3;
  const terrainDims = getDimensions(161, 125);
  const treeDims = getDimensions(79, 158);
  const worldDims = new WT.Dimensions(
    terrainDims.width * cellsX,
    terrainDims.depth * cellsY,
    terrainDims.height * cellsZ
  );
  const context = WT.createTestContext(
    worldDims,
    WT.Perspective.TwoByOneIsometric
  );

  const addCuboidEntityAt = (x, y, z, entityDimensions) => {
    const minLocation = new WT.Point3D(
      x * (terrainDims.width + gap),
      y * (terrainDims.depth + gap),
      z * (terrainDims.height + gap)
    );
    const entity = new WT.CuboidEntity(context, minLocation, entityDimensions);
    entity.addGraphic(dummyGraphic);
    return entity;
  };

  for (let y = 0; y < cellsY; ++y) {
    for (let x = 0; x < cellsX; ++x) {
      addCuboidEntityAt(x, y, 0, terrainDims);
    }
  }
  // central tower
  addCuboidEntityAt(2, 2, 1, terrainDims);
  addCuboidEntityAt(2, 2, 2, terrainDims);

  // tree
  const tree = addCuboidEntityAt(0, 2, 1, treeDims);

  const camera = new WT.Camera(context.scene, 1920, 1080);
  camera.location = new WT.Point3D(0, 0, 0);
  context.scene.render(camera, false);

  const drawOrder = context.scene.graph.order.slice().reverse();
  expect(drawOrder.length).toBe(12);
  expect(drawOrder[11].entity.id).toBe(tree.id);
});

