import * as WT from '../dist/world-tree.js';

function getDimensions(spriteWidth, spriteHeight) {
  return WT.TwoByOneIsometricRenderer.getDimensions(spriteWidth, spriteHeight);
}

test('calculate physical dimensions from sprite dimensions', () => {
  const spriteWidth = 322;
  const spriteHeight = 270;
  const dims = getDimensions(spriteWidth, spriteHeight);
  expect(dims.width).toBe(72);
  expect(dims.depth).toBe(72);
  expect(dims.height).toBe(97);
});

//test('draw order of single row', () => {
  //const heightMap = [ [ 0, 0, 0, 0 ] ];
//});

//test('draw order of single column', () => {
  //const heightMap = [ [ 0 ], [ 0 ], [ 0 ], [ 0 ], ];
//});

//test('draw order of 2x2x1 grid', () => {
//});
