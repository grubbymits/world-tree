import * as WT from "../dist/world-tree.mjs";

const width = 72;
const depth = 72;
const height = 97;
const entityDimensions = new WT.Dimensions(width, depth, height);
const dummyGraphic = new WT.DummyGraphicComponent(322, 270);

function getDimensions(spriteWidth, spriteHeight) {
  return WT.TwoByOneIsometric.getDimensions(spriteWidth, spriteHeight);
}

function drawOrder(entityA, entityB) {
  return WT.TwoByOneIsometric.drawOrder(entityA, entityB);
}

function drawCoord(entity) {
  return WT.TwoByOneIsometric.getDrawCoord(entity.bounds.minLocation);
}

test("calculate physical dimensions from sprite dimensions", () => {
  const spriteWidth = 322;
  const spriteHeight = 270;
  const dims = getDimensions(spriteWidth, spriteHeight);
  expect(dims.width).toBe(width);
  expect(dims.depth).toBe(depth);
  expect(dims.height).toBe(height);
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
    let minLocation = new WT.Point3D(i * entityDimensions.width, 0, 0);
    let entity = new WT.PhysicalEntity(context, minLocation, entityDimensions);
    let node = new WT.SceneNode(entity, scene);
    nodes.push(node);
  }
  expect(drawOrder(nodes[0], nodes[1])).toBe(WT.RenderOrder.After);
  expect(drawOrder(nodes[1], nodes[2])).toBe(WT.RenderOrder.After);
  expect(drawOrder(nodes[2], nodes[3])).toBe(WT.RenderOrder.After);
  expect(drawOrder(nodes[3], nodes[2])).toBe(WT.RenderOrder.Before);
  expect(drawOrder(nodes[2], nodes[1])).toBe(WT.RenderOrder.Before);
  expect(drawOrder(nodes[1], nodes[0])).toBe(WT.RenderOrder.Before);
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
    let minLocation = new WT.Point3D(0, i * entityDimensions.depth, 0);
    let entity = new WT.PhysicalEntity(context, minLocation, entityDimensions);
    let node = new WT.SceneNode(entity, scene);
    nodes.push(node);
  }
  expect(drawOrder(nodes[0], nodes[1])).toBe(WT.RenderOrder.Before);
  expect(drawOrder(nodes[1], nodes[2])).toBe(WT.RenderOrder.Before);
  expect(drawOrder(nodes[2], nodes[3])).toBe(WT.RenderOrder.Before);
  expect(drawOrder(nodes[3], nodes[2])).toBe(WT.RenderOrder.After);
  expect(drawOrder(nodes[2], nodes[1])).toBe(WT.RenderOrder.After);
  expect(drawOrder(nodes[1], nodes[0])).toBe(WT.RenderOrder.After);
});

test("draw order of (x, y) increasing diagonal", () => {
  const numEntities = 4;
  const worldDims = new WT.Dimensions(width * numEntities, depth, height);
  let context = WT.createTestContext(
    worldDims,
    WT.Perspective.TwoByOneIsometric
  );
  let nodes = new Array();
  for (let i = 0; i < numEntities; i++) {
    let minLocation = new WT.Point3D(
      i * entityDimensions.width,
      i * entityDimensions.depth,
      0
    );
    let entity = new WT.PhysicalEntity(context, minLocation, entityDimensions);
    entity.addGraphic(dummyGraphic);
    nodes.push(context.scene.getNode(entity.id));
  }
  expect(drawOrder(nodes[0], nodes[1])).toBe(WT.RenderOrder.Before);
  expect(drawOrder(nodes[0], nodes[2])).toBe(WT.RenderOrder.Before);
  expect(drawOrder(nodes[0], nodes[3])).toBe(WT.RenderOrder.Before);
  expect(drawOrder(nodes[1], nodes[2])).toBe(WT.RenderOrder.Before);
  expect(drawOrder(nodes[1], nodes[3])).toBe(WT.RenderOrder.Before);
  expect(drawOrder(nodes[2], nodes[3])).toBe(WT.RenderOrder.Before);
  expect(drawOrder(nodes[3], nodes[2])).toBe(WT.RenderOrder.After);
  expect(drawOrder(nodes[2], nodes[1])).toBe(WT.RenderOrder.After);
  expect(drawOrder(nodes[1], nodes[0])).toBe(WT.RenderOrder.After);

  let camera = new WT.Camera(context.scene, 1920, 1080);
  camera.location = new WT.Point3D(0, 0, 0);
  context.scene.render(camera, false);

  //expect(context.scene.graph.initialised).toBe(true);
  expect(context.scene.graph.order.length).toBe(numEntities);

  let order = context.scene.graph.order;
  expect(order[0].entity.id).toBe(3);
  expect(order[1].entity.id).toBe(2);
  expect(order[2].entity.id).toBe(1);
  expect(order[3].entity.id).toBe(0);
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
        x * entityDimensions.width,
        y * entityDimensions.depth,
        0
      );
      let entity = new WT.PhysicalEntity(
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
          x * entityDimensions.width,
          y * entityDimensions.depth,
          z * entityDimensions.height
        );
        let entity = new WT.PhysicalEntity(
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

  //expect(context.scene.graph.initialised).toBe(true);
  //expect(context.scene.graph.levels.length).toBe(2);

  //let level = context.scene.graph.levels[0];
  let drawOrder = context.scene.graph.order.slice(); //level.order.slice();
  drawOrder.reverse();
  expect(drawOrder.length).toBe(8);
  expect(drawOrder[0].entity.id).toBe(1);
  expect(drawOrder[1].entity.id).toBe(0);
  expect(drawOrder[2].entity.id).toBe(3);
  expect(drawOrder[3].entity.id).toBe(2);

  expect(drawOrder[4].entity.id).toBe(5);
  expect(drawOrder[5].entity.id).toBe(4);
  expect(drawOrder[6].entity.id).toBe(7);
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
          x * entityDimensions.width,
          y * entityDimensions.depth,
          z * entityDimensions.height
        );
        let entity = new WT.PhysicalEntity(
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
  expect(drawOrder[1].entity.id).toBe(0);
  expect(drawOrder[2].entity.id).toBe(3);
  expect(drawOrder[3].entity.id).toBe(2);
  expect(drawOrder[4].entity.id).toBe(5);
  expect(drawOrder[5].entity.id).toBe(4);
  expect(drawOrder[6].entity.id).toBe(7);
  expect(drawOrder[7].entity.id).toBe(6);

  entities.forEach((entity) => context.scene.updateEntity(entity));
  drawOrder = context.scene.graph.order.slice().reverse();
  expect(drawOrder.length).toBe(8);
  expect(drawOrder[0].entity.id).toBe(1);
  expect(drawOrder[1].entity.id).toBe(0);
  expect(drawOrder[2].entity.id).toBe(3);
  expect(drawOrder[3].entity.id).toBe(2);
  expect(drawOrder[4].entity.id).toBe(5);
  expect(drawOrder[5].entity.id).toBe(4);
  expect(drawOrder[6].entity.id).toBe(7);
  expect(drawOrder[7].entity.id).toBe(6);
});

test("draw order of (x, y, z) updating level in a cube", () => {
  const worldDims = new WT.Dimensions(width * 2, depth * 2, height * 3);
  let context = WT.createTestContext(
    worldDims,
    WT.Perspective.TwoByOneIsometric
  );

  let addEntityAt = (x, y, z) => {
    let minLocation = new WT.Point3D(
      x * entityDimensions.width,
      y * entityDimensions.depth,
      z * entityDimensions.height
    );
    let entity = new WT.PhysicalEntity(context, minLocation, entityDimensions);
    entity.addGraphic(dummyGraphic);
    return entity;
  };

  for (let z = 0; z < 2; ++z) {
    for (let y = 0; y < 2; ++y) {
      let xMax = y == 0 ? 2 : 1;
      for (let x = 0; x < xMax; ++x) {
        addEntityAt(x, y, z);
      }
    }
  }
  // One cube above the rest
  let movable = addEntityAt(0, 0, 2);

  let camera = new WT.Camera(context.scene, 1920, 1080);
  camera.location = new WT.Point3D(0, 0, 0);
  context.scene.render(camera, false);

  movable.updatePosition(new WT.Vector3D(0, 0, -95));
  context.scene.updateEntity(movable);
  context.scene.render(camera, false);

  let drawOrder = context.scene.graph.order.slice().reverse();
  expect(drawOrder.length).toBe(7);
  expect(drawOrder[3].entity.id).toBe(4);
  expect(drawOrder[4].entity.id).toBe(movable.id);
  expect(drawOrder[5].entity.id).toBe(3);
  expect(drawOrder[6].entity.id).toBe(5);
});
