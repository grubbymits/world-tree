import * as WT from '../dist/world-tree.js';

function getDimensions(spriteWidth, spriteHeight) {
  return WT.TwoByOneIsometric.getDimensions(spriteWidth, spriteHeight);
}

test('calculate physical dimensions from sprite dimensions', () => {
  const spriteWidth = 322;
  const spriteHeight = 270;
  const dims = getDimensions(spriteWidth, spriteHeight);
  expect(dims.width).toBe(72);
  expect(dims.depth).toBe(72);
  expect(dims.height).toBe(97);
});

function drawOrder(entityA, entityB) {
  return WT.TwoByOneIsometric.drawOrder(entityA, entityB);
}

function drawCoord(entity) {
  return WT.TwoByOneIsometric.getDrawCoord(entity.bounds.minLocation);
}

test('draw order of single row', () => {
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
  const width = 72;
  const depth = 72;
  const height = 97;
  const entityDimensions = new WT.Dimensions(width, depth, height);
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
  expect(drawOrder(nodes[1], nodes[2])).toBe(WT.RenderOrder.Any);
  expect(drawOrder(nodes[2], nodes[3])).toBe(WT.RenderOrder.Any);
  expect(drawOrder(nodes[3], nodes[2])).toBe(WT.RenderOrder.Any);
  expect(drawOrder(nodes[2], nodes[1])).toBe(WT.RenderOrder.Any);
  expect(drawOrder(nodes[1], nodes[0])).toBe(WT.RenderOrder.Any);
});


//test('draw order of 2x2x1 grid', () => {
//});
