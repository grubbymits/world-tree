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
  let context = new WT.Context(worldDims);
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
  let context = new WT.Context(worldDims);
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
  let context = new WT.Context(worldDims);
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
  let context = new WT.Context(worldDims);
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
  let context = new WT.Context(worldDims);
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
  let context = new WT.Context(worldDims);
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
  let context = new WT.Context(worldDims);
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
  let context = new WT.Context(worldDims);
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
  let context = new WT.Context(worldDims);
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
  let context = new WT.Context(worldDims);
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
  const numEntities = 4;
  const width = 72;
  const depth = 72;
  const height = 97;
  const entityDimensions = new WT.Dimensions(width, depth, height);
  const worldDims = new WT.Dimensions(width * numEntities, depth, height);
  let context = new WT.Context(worldDims);
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
});
