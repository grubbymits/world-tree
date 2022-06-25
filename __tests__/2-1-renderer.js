import * as WT from '../dist/world-tree.js';

const width = 72;
const depth = 72;
const height = 97;
const entityDimensions = new WT.Dimensions(width, depth, height);

function getDimensions(spriteWidth, spriteHeight) {
  return WT.TwoByOneIsometric.getDimensions(spriteWidth, spriteHeight);
}

function drawOrder(entityA, entityB) {
  return WT.TwoByOneIsometric.drawOrder(entityA, entityB);
}

function drawCoord(entity) {
  return WT.TwoByOneIsometric.getDrawCoord(entity.bounds.minLocation);
}

test('calculate physical dimensions from sprite dimensions', () => {
  const spriteWidth = 322;
  const spriteHeight = 270;
  const dims = getDimensions(spriteWidth, spriteHeight);
  expect(dims.width).toBe(width);
  expect(dims.depth).toBe(depth);
  expect(dims.height).toBe(height);
});

test('scene nodes row overlapping', () => {
  const numEntities = 2;
  const worldDims = new WT.Dimensions(width * numEntities, depth, height);
  let context = WT.createTestContext(worldDims, WT.Perspective.TwoByOneIsometric);
  let scene = new WT.TwoByOneIsometric();
  let nodes = new Array();
  for (let i = 0; i < numEntities; i++) {
    let minLocation = new WT.Point3D(i * entityDimensions.width, 0, 0);
    let entity = new WT.PhysicalEntity(context, minLocation, entityDimensions);
    let node = new WT.SceneNode(entity, drawCoord(entity));
    scene.setDrawCoords(node);
    nodes.push(node);
  }
  expect(nodes[0].overlapX(nodes[1])).toBe(false);
  expect(nodes[1].overlapX(nodes[0])).toBe(false);
  expect(nodes[0].overlapY(nodes[1])).toBe(true);
  expect(nodes[1].overlapY(nodes[0])).toBe(true);
  expect(nodes[0].overlapZ(nodes[1])).toBe(true);
  expect(nodes[1].overlapZ(nodes[0])).toBe(true);
});

test('scene nodes row intersecting', () => {
  const numEntities = 2;
  const worldDims = new WT.Dimensions(width * numEntities, depth, height);
  let context = WT.createTestContext(worldDims, WT.Perspective.TwoByOneIsometric);
  let scene = new WT.TwoByOneIsometric();
  let nodes = new Array();
  for (let i = 0; i < numEntities; i++) {
    let minLocation = new WT.Point3D(i * entityDimensions.width, 0, 0);
    let entity = new WT.PhysicalEntity(context, minLocation, entityDimensions);
    let node = new WT.SceneNode(entity, drawCoord(entity));
    scene.setDrawCoords(node);
    nodes.push(node);
  }
  expect(nodes[0].intersectsTop(nodes[1])).toBe(false);
  expect(nodes[1].intersectsTop(nodes[0])).toBe(false);
});

test('scene nodes row intersecting with unaligned y and z-axis', () => {
  const numEntities = 2;
  const worldDims = new WT.Dimensions(width * numEntities, depth, height);
  let context = WT.createTestContext(worldDims, WT.Perspective.TwoByOneIsometric);
  let scene = new WT.TwoByOneIsometric();
  let nodes = new Array();
  for (let i = 0; i < numEntities; i++) {
    let minLocation = new WT.Point3D(i * entityDimensions.width, i, i);
    let entity = new WT.PhysicalEntity(context, minLocation, entityDimensions);
    let node = new WT.SceneNode(entity, drawCoord(entity));
    scene.setDrawCoords(node);
    nodes.push(node);
  }
  expect(nodes[0].intersectsTop(nodes[1])).toBe(false);
  expect(nodes[1].intersectsTop(nodes[0])).toBe(true);
});

test('scene nodes column overlapping', () => {
  const numEntities = 2;
  const worldDims = new WT.Dimensions(width * numEntities, depth, height);
  let context = WT.createTestContext(worldDims, WT.Perspective.TwoByOneIsometric);
  let scene = new WT.TwoByOneIsometric();
  let nodes = new Array();
  for (let i = 0; i < numEntities; i++) {
    let minLocation = new WT.Point3D(0, i * entityDimensions.depth, 0);
    let entity = new WT.PhysicalEntity(context, minLocation, entityDimensions);
    let node = new WT.SceneNode(entity, drawCoord(entity));
    scene.setDrawCoords(node);
    nodes.push(node);
  }
  expect(nodes[0].overlapX(nodes[1])).toBe(true);
  expect(nodes[1].overlapX(nodes[0])).toBe(true);
  expect(nodes[0].overlapY(nodes[1])).toBe(false);
  expect(nodes[1].overlapY(nodes[0])).toBe(false);
  expect(nodes[0].overlapZ(nodes[1])).toBe(true);
  expect(nodes[1].overlapZ(nodes[0])).toBe(true);
});

test('scene nodes column intersecting with unaligned x and z axis', () => {
  const numEntities = 3;
  const worldDims = new WT.Dimensions(width * numEntities, depth, height);
  let context = WT.createTestContext(worldDims, WT.Perspective.TwoByOneIsometric);
  let scene = new WT.TwoByOneIsometric();
  let nodes = new Array();
  for (let i = 0; i < numEntities; i++) {
    let minLocation = new WT.Point3D(i, i * entityDimensions.depth, i);
    let entity = new WT.PhysicalEntity(context, minLocation, entityDimensions);
    let node = new WT.SceneNode(entity, drawCoord(entity));
    scene.setDrawCoords(node);
    nodes.push(node);
  }
  expect(nodes[0].intersectsTop(nodes[1])).toBe(false);
  expect(nodes[1].intersectsTop(nodes[2])).toBe(false);
  expect(nodes[2].intersectsTop(nodes[1])).toBe(false);
  expect(nodes[1].intersectsTop(nodes[0])).toBe(false);
  expect(nodes[0].intersectsTop(nodes[2])).toBe(false);
});

test('scene nodes column intersecting', () => {
  const numEntities = 3;
  const worldDims = new WT.Dimensions(width * numEntities, depth, height);
  let context = WT.createTestContext(worldDims, WT.Perspective.TwoByOneIsometric);
  let scene = new WT.TwoByOneIsometric();
  let nodes = new Array();
  for (let i = 0; i < numEntities; i++) {
    let minLocation = new WT.Point3D(0, i * entityDimensions.depth, 0);
    let entity = new WT.PhysicalEntity(context, minLocation, entityDimensions);
    let node = new WT.SceneNode(entity, drawCoord(entity));
    scene.setDrawCoords(node);
    nodes.push(node);
  }
  expect(nodes[0].intersectsTop(nodes[1])).toBe(false);
  expect(nodes[1].intersectsTop(nodes[2])).toBe(false);
  expect(nodes[2].intersectsTop(nodes[1])).toBe(false);
  expect(nodes[1].intersectsTop(nodes[0])).toBe(false);
  expect(nodes[0].intersectsTop(nodes[2])).toBe(false);
});

test('diagonal scene nodes overlapping', () => {
  const numEntities = 2;
  const worldDims = new WT.Dimensions(width * numEntities, depth, height);
  let context = WT.createTestContext(worldDims, WT.Perspective.TwoByOneIsometric);
  let scene = new WT.TwoByOneIsometric();
  let nodes = new Array();
  for (let i = 0; i < numEntities; i++) {
    let minLocation = new WT.Point3D(i * entityDimensions.width,
                                     i * entityDimensions.depth, 0);
    let entity = new WT.PhysicalEntity(context, minLocation, entityDimensions);
    let node = new WT.SceneNode(entity, drawCoord(entity));
    scene.setDrawCoords(node);
    nodes.push(node);
  }
  expect(nodes[0].overlapX(nodes[1])).toBe(false);
  expect(nodes[1].overlapX(nodes[0])).toBe(false);
  expect(nodes[0].overlapY(nodes[1])).toBe(false);
  expect(nodes[1].overlapY(nodes[0])).toBe(false);
  expect(nodes[0].overlapZ(nodes[1])).toBe(true);
  expect(nodes[1].overlapZ(nodes[0])).toBe(true);
});

test('diagonal scene nodes intersecting', () => {
  const numEntities = 3;
  const worldDims = new WT.Dimensions(width * numEntities, depth, height);
  let context = WT.createTestContext(worldDims, WT.Perspective.TwoByOneIsometric);
  let scene = new WT.TwoByOneIsometric();
  let nodes = new Array();
  for (let i = 0; i < numEntities; i++) {
    let minLocation = new WT.Point3D(i * entityDimensions.width,
                                     i * entityDimensions.depth, 0);
    let entity = new WT.PhysicalEntity(context, minLocation, entityDimensions);
    let node = new WT.SceneNode(entity, drawCoord(entity));
    scene.setDrawCoords(node);
    nodes.push(node);
  }
  expect(nodes[0].intersectsTop(nodes[1])).toBe(false);
  expect(nodes[1].intersectsTop(nodes[0])).toBe(false);
  expect(nodes[1].intersectsTop(nodes[2])).toBe(false);
  expect(nodes[0].intersectsTop(nodes[2])).toBe(false);
  expect(nodes[2].intersectsTop(nodes[0])).toBe(false);
});

test('draw order of single row', () => {
  const numEntities = 4;
  const worldDims = new WT.Dimensions(width * numEntities, depth, height);
  let context = WT.createTestContext(worldDims, WT.Perspective.TwoByOneIsometric);
  let scene = new WT.TwoByOneIsometric();
  let nodes = new Array();
  for (let i = 0; i < numEntities; i++) {
    let minLocation = new WT.Point3D(i * entityDimensions.width, 0, 0);
    let entity = new WT.PhysicalEntity(context, minLocation, entityDimensions);
    let node = new WT.SceneNode(entity, drawCoord(entity));
    scene.setDrawCoords(node);
    nodes.push(node);
  }
  expect(drawOrder(nodes[0], nodes[1])).toBe(WT.RenderOrder.After);
  expect(drawOrder(nodes[1], nodes[2])).toBe(WT.RenderOrder.After);
  expect(drawOrder(nodes[2], nodes[3])).toBe(WT.RenderOrder.After);
  expect(drawOrder(nodes[3], nodes[2])).toBe(WT.RenderOrder.Before);
  expect(drawOrder(nodes[2], nodes[1])).toBe(WT.RenderOrder.Before);
  expect(drawOrder(nodes[1], nodes[0])).toBe(WT.RenderOrder.Before);
});

test('draw order of single column', () => {
  const numEntities = 4;
  const worldDims = new WT.Dimensions(width * numEntities, depth, height);
  let context = WT.createTestContext(worldDims, WT.Perspective.TwoByOneIsometric);
  let scene = new WT.TwoByOneIsometric();
  let nodes = new Array();
  for (let i = 0; i < numEntities; i++) {
    let minLocation = new WT.Point3D(0, i * entityDimensions.depth, 0);
    let entity = new WT.PhysicalEntity(context, minLocation, entityDimensions);
    let node = new WT.SceneNode(entity, drawCoord(entity));
    scene.setDrawCoords(node);
    nodes.push(node);
  }
  expect(drawOrder(nodes[0], nodes[1])).toBe(WT.RenderOrder.Before);
  expect(drawOrder(nodes[1], nodes[2])).toBe(WT.RenderOrder.Before);
  expect(drawOrder(nodes[2], nodes[3])).toBe(WT.RenderOrder.Before);
  expect(drawOrder(nodes[3], nodes[2])).toBe(WT.RenderOrder.After);
  expect(drawOrder(nodes[2], nodes[1])).toBe(WT.RenderOrder.After);
  expect(drawOrder(nodes[1], nodes[0])).toBe(WT.RenderOrder.After);
});

test('draw order of (x, y) increasing diagonal', () => {
  WT.PhysicalEntity.reset();
  const numEntities = 4;
  const width = 72;
  const depth = 72;
  const height = 97;
  const entityDimensions = new WT.Dimensions(width, depth, height);
  const worldDims = new WT.Dimensions(width * numEntities, depth, height);
  let context = WT.createTestContext(worldDims, WT.Perspective.TwoByOneIsometric);
  let scene = new WT.TwoByOneIsometric();
  let nodes = new Array();
  for (let i = 0; i < numEntities; i++) {
    let minLocation = new WT.Point3D(i * entityDimensions.width,
                                     i * entityDimensions.depth, 0);
    let entity = new WT.PhysicalEntity(context, minLocation, entityDimensions);
    let node = new WT.SceneNode(entity, drawCoord(entity));
    scene.setDrawCoords(node);
    nodes.push(node);
  }
  expect(drawOrder(nodes[0], nodes[1])).toBe(WT.RenderOrder.Any);
  expect(drawOrder(nodes[0], nodes[2])).toBe(WT.RenderOrder.Any);
  expect(drawOrder(nodes[0], nodes[3])).toBe(WT.RenderOrder.Any);
  expect(drawOrder(nodes[1], nodes[2])).toBe(WT.RenderOrder.Any);
  expect(drawOrder(nodes[1], nodes[3])).toBe(WT.RenderOrder.Any);
  expect(drawOrder(nodes[2], nodes[3])).toBe(WT.RenderOrder.Any);
  expect(drawOrder(nodes[3], nodes[2])).toBe(WT.RenderOrder.Any);
  expect(drawOrder(nodes[2], nodes[1])).toBe(WT.RenderOrder.Any);
  expect(drawOrder(nodes[1], nodes[0])).toBe(WT.RenderOrder.Any);

  nodes.forEach((node) => scene.insertIntoLevel(node));
  expect(scene.initialised).toBe(true);
  expect(scene.levels.length).toBe(1);

  scene.buildLevels();
  let level = scene.levels[0];
  expect(level.order.length).toBe(4);
  expect(level.order[0].entity.id).toBe(0);
  expect(level.order[1].entity.id).toBe(1);
  expect(level.order[2].entity.id).toBe(2);
  expect(level.order[3].entity.id).toBe(3);
});

test('draw order of (x, y) four in a square', () => {
  WT.PhysicalEntity.reset();
  const numEntities = 4;
  const width = 72;
  const depth = 72;
  const height = 97;
  const entityDimensions = new WT.Dimensions(width, depth, height);
  const worldDims = new WT.Dimensions(width * 2, depth * 2, height);
  let context = WT.createTestContext(worldDims, WT.Perspective.TwoByOneIsometric);
  let scene = new WT.TwoByOneIsometric();
  let nodes = new Array();
  for (let y = 0; y < 2; ++y) {
    for (let x = 0; x < 2; ++x) {
      let minLocation = new WT.Point3D(x * entityDimensions.width,
                                       y * entityDimensions.depth, 0);
      let entity = new WT.PhysicalEntity(context, minLocation, entityDimensions);
      let node = new WT.SceneNode(entity, drawCoord(entity));
      scene.setDrawCoords(node);
      nodes.push(node);
    }
  }
  nodes.forEach((node) => scene.insertIntoLevel(node));
  expect(scene.initialised).toBe(true);
  expect(scene.levels.length).toBe(1);

  scene.buildLevels();
  let level = scene.levels[0];
  level.order.reverse();
  expect(level.order.length).toBe(4);
  expect(level.order[0].entity.id).toBe(1);
  expect(level.order[1].entity.id).toBe(3);
  expect(level.order[2].entity.id).toBe(0);
  expect(level.order[3].entity.id).toBe(2);
});

test('draw order of (x, y, z) eight in a cube', () => {
  WT.PhysicalEntity.reset();
  const width = 72;
  const depth = 72;
  const height = 97;
  const entityDimensions = new WT.Dimensions(width, depth, height);
  const worldDims = new WT.Dimensions(width * 2, depth * 2, height * 2);
  let context = WT.createTestContext(worldDims, WT.Perspective.TwoByOneIsometric);
  let scene = new WT.TwoByOneIsometric();
  let nodes = new Array();
  for (let z = 0; z < 2; ++z) {
    for (let y = 0; y < 2; ++y) {
      for (let x = 0; x < 2; ++x) {
        let minLocation = new WT.Point3D(x * entityDimensions.width,
                                        y * entityDimensions.depth,
                                        z * entityDimensions.height);
        let entity = new WT.PhysicalEntity(context, minLocation, entityDimensions);
        let node = new WT.SceneNode(entity, drawCoord(entity));
        scene.setDrawCoords(node);
        nodes.push(node);
      }
    }
  }
  nodes.forEach((node) => scene.insertIntoLevel(node));
  expect(scene.initialised).toBe(true);
  expect(scene.levels.length).toBe(2);

  scene.buildLevels();
  let level = scene.levels[0];
  let drawOrder = level.order.slice();
  drawOrder.reverse();
  expect(drawOrder.length).toBe(4);
  expect(drawOrder[0].entity.id).toBe(1);
  expect(drawOrder[1].entity.id).toBe(3);
  expect(drawOrder[2].entity.id).toBe(0);
  expect(drawOrder[3].entity.id).toBe(2);

  level = scene.levels[1];
  drawOrder = level.order.slice();
  drawOrder.reverse();
  expect(drawOrder.length).toBe(4);
  expect(drawOrder[0].entity.id).toBe(5);
  expect(drawOrder[1].entity.id).toBe(7);
  expect(drawOrder[2].entity.id).toBe(4);
  expect(drawOrder[3].entity.id).toBe(6);
});

test('draw order of (x, y, z) updating eight in a cube', () => {
  WT.PhysicalEntity.reset();
  const width = 72;
  const depth = 72;
  const height = 97;
  const entityDimensions = new WT.Dimensions(width, depth, height);
  const worldDims = new WT.Dimensions(width * 2, depth * 2, height * 2);
  let context = WT.createTestContext(worldDims, WT.Perspective.TwoByOneIsometric);
  let scene = new WT.TwoByOneIsometric();
  let nodes = new Array();
  for (let z = 0; z < 2; ++z) {
    for (let y = 0; y < 2; ++y) {
      for (let x = 0; x < 2; ++x) {
        let minLocation = new WT.Point3D(x * entityDimensions.width,
                                        y * entityDimensions.depth,
                                        z * entityDimensions.height);
        let entity = new WT.PhysicalEntity(context, minLocation, entityDimensions);
        let node = new WT.SceneNode(entity, drawCoord(entity));
        scene.setDrawCoords(node);
        nodes.push(node);
      }
    }
  }
  nodes.forEach((node) => scene.insertIntoLevel(node));
  expect(scene.initialised).toBe(true);
  expect(scene.levels.length).toBe(2);

  scene.buildLevels();
  let drawOrder = scene.levels[0].order.slice().reverse();
  expect(drawOrder.length).toBe(4);
  expect(drawOrder[0].entity.id).toBe(1);
  expect(drawOrder[1].entity.id).toBe(3);
  expect(drawOrder[2].entity.id).toBe(0);
  expect(drawOrder[3].entity.id).toBe(2);

  drawOrder = scene.levels[1].order.slice().reverse();
  expect(drawOrder.length).toBe(4);
  expect(drawOrder[0].entity.id).toBe(5);
  expect(drawOrder[1].entity.id).toBe(7);
  expect(drawOrder[2].entity.id).toBe(4);
  expect(drawOrder[3].entity.id).toBe(6);

  nodes.forEach((node) => scene.updateNode(node));
  drawOrder = scene.levels[0].order.slice().reverse();
  expect(drawOrder.length).toBe(4);
  expect(drawOrder[0].entity.id).toBe(1);
  expect(drawOrder[1].entity.id).toBe(3);
  expect(drawOrder[2].entity.id).toBe(0);
  expect(drawOrder[3].entity.id).toBe(2);

  drawOrder = scene.levels[1].order.slice().reverse();
  expect(drawOrder.length).toBe(4);
  expect(drawOrder[0].entity.id).toBe(5);
  expect(drawOrder[1].entity.id).toBe(7);
  expect(drawOrder[2].entity.id).toBe(4);
  expect(drawOrder[3].entity.id).toBe(6);
});

test('draw order of (x, y, z) updating level in a cube', () => {
  WT.PhysicalEntity.reset();
  const width = 72;
  const depth = 72;
  const height = 97;
  const entityDimensions = new WT.Dimensions(width, depth, height);
  const worldDims = new WT.Dimensions(width * 2, depth * 2, height * 3);
  let context = WT.createTestContext(worldDims, WT.Perspective.TwoByOneIsometric);
  let scene = new WT.TwoByOneIsometric();
  let nodes = new Array();

  let addNodeAt = (x, y, z) => {
     let minLocation = new WT.Point3D(x * entityDimensions.width,
                                      y * entityDimensions.depth,
                                      z * entityDimensions.height);
     let entity = new WT.PhysicalEntity(context, minLocation, entityDimensions);
     let node = new WT.SceneNode(entity, drawCoord(entity));
     scene.setDrawCoords(node);
     nodes.push(node);
     return node;
  }

  for (let z = 0; z < 2; ++z) {
    for (let y = 0; y < 2; ++y) {
      let xMax = y == 0 ? 2 : 1;
      for (let x = 0; x < xMax; ++x) {
        addNodeAt(x, y, z);
      }
    }
  }
  // One cube above the rest
  let movable = addNodeAt(0, 0, 2);

  nodes.forEach((node) => scene.insertIntoLevel(node));
  expect(scene.initialised).toBe(true);
  expect(scene.levels.length).toBe(3);
  scene.buildLevels();

  movable.entity.updatePosition(new WT.Vector3D(0, 0, -95));
  scene.updateNode(movable);
  scene.buildLevels();

  // Movable shouldn't still be in it's own level.
  expect(scene.levels[2].order.length).toBe(0);

  let drawOrder = scene.levels[1].order.slice().reverse();
  expect(drawOrder.length).toBe(4);
  expect(drawOrder[0].entity.id).toBe(4);
  expect(drawOrder[1].entity.id).toBe(3);
  expect(drawOrder[2].entity.id).toBe(movable.entity.id);
  expect(drawOrder[3].entity.id).toBe(5);
});

function addDummyGraphic(sheet, type, shape) {
  WT.Terrain.addGraphic(/*terrainType*/type,
                        /*terrainShape*/shape,
                        /*spriteSheet*/sheet,
                        /*coord.x*/1, 1, 1, 1);
}
const dummySheet = { };
const dummySprite = { };
const shapes = [
  WT.TerrainShape.Flat,
  WT.TerrainShape.RampUpSouth,
  WT.TerrainShape.RampUpWest,
  WT.TerrainShape.RampUpEast,
  WT.TerrainShape.RampUpNorth,
];

test('test bug where some blocks were not drawn', () => {
  const cellsX = 11;
  const cellsY = 11;
  const numTerraces = 2;
  const heightMap = [ [ 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 4 ],
                      [ 3, 0, 0, 0, 0, 4, 0, 0, 0, 0, 4 ],
                      [ 2, 0, 2, 2, 2, 2, 3, 1, 0, 0, 4 ],
                      [ 2, 0, 1, 2, 2, 2, 2, 1, 0, 0, 4 ],
                      [ 2, 0, 1, 2, 2, 2, 2, 1, 0, 0, 4 ],
                      [ 2, 4, 1, 2, 2, 2, 2, 1, 0, 4, 4 ],
                      [ 2, 0, 1, 2, 2, 2, 2, 1, 0, 0, 4 ],
                      [ 2, 0, 1, 2, 2, 2, 2, 1, 0, 0, 4 ],
                      [ 2, 0, 1, 1, 1, 1, 1, 1, 0, 0, 4 ],
                      [ 2, 0, 0, 0, 0, 4, 0, 0, 0, 0, 4 ],
                      [ 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2] ];

  const spriteWidth = 322;
  const spriteHeight = 270;
  const physicalDims =
    WT.TwoByOneIsometric.getDimensions(spriteWidth, spriteHeight);
  const worldDims = new WT.Dimensions(physicalDims.width * cellsX,
                                      physicalDims.depth * cellsY,
                                      physicalDims.height * (2 + numTerraces));

  let context = WT.createTestContext(worldDims, WT.Perspective.TwoByOneIsometric);

  const config = new WT.TerrainBuilderConfig(numTerraces,
                                             WT.TerrainType.DryGrass,
                                             WT.TerrainType.DryGrass);
  config.hasRamps = true;
  // Use the height map to construct a terrain.
  let builder = new WT.TerrainBuilder(cellsX, cellsY, heightMap,
                                      config, physicalDims);

  for (let shape of shapes) {
    addDummyGraphic(dummySheet, WT.TerrainType.DryGrass, shape);
  }
  builder.generateMap(context);
  context.scene.buildLevels();
  let camera = new WT.Camera(context.scene, 1024, 1024);

  expect(context.verify()).toBe(true);
  expect(context.scene.graph.levels.length).toBe(3);
  expect(context.scene.nodes.size).toBe(196);
  expect(context.scene.render(camera)).toBe(196);

  expect(WT.Terrain.getDimensions().width).toBe(physicalDims.width);
  expect(WT.Terrain.getDimensions().depth).toBe(physicalDims.depth);
  expect(WT.Terrain.getDimensions().height).toBe(physicalDims.height);

  let node0 = context.scene.getNode(0);
  camera.location = node0.entity.bounds.minLocation;

  expect(node0.level).not.toBe(null);
  expect(node0.level.minZ).toBe(physicalDims.height);
  expect(node0.level.maxZ).toBe(physicalDims.height * 2);
  expect(node0.minZ).toBe(physicalDims.height);
  expect(node0.maxZ).toBe(physicalDims.height * 2);
  expect(node0.level.order.indexOf(node0)).not.toBe(-1);
  expect(node0.drawCoord.x).toBe(0);
  expect(node0.drawCoord.y).toBe(-297);
  expect(node0.entity.visible).toBe(true);
  expect(node0.entity.drawable).toBe(true);
  expect(camera.isOnScreen(node0.drawCoord, spriteWidth, spriteHeight)).toBe(true);

  let node11 = context.scene.getNode(11);
  expect(node11.level).not.toBe(null);
  expect(node11.level.minZ).toBe(physicalDims.height);
  expect(node11.level.maxZ).toBe(physicalDims.height * 2);
  expect(node11.minZ).toBe(physicalDims.height);
  expect(node11.maxZ).toBe(physicalDims.height * 2);
  expect(node11.level.order.indexOf(node11)).not.toBe(-1);
  expect(node11.drawCoord.x).toBe(Math.floor(spriteWidth / 2));
  expect(node11.drawCoord.y).toBe(-217);
  expect(node11.entity.visible).toBe(true);
  expect(node11.entity.drawable).toBe(true);
  expect(camera.isOnScreen(node11.drawCoord, spriteWidth, spriteHeight)).toBe(true);

  expect(node0.succs.length).not.toBe(0);
  expect(node11.succs.length).not.toBe(0);
  expect(node0.succs.indexOf(node11)).not.toBe(-1);
});
