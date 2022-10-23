import * as WT from '../dist/world-tree.js';

test('build queue', () => {
  const numItems = 10;
  let queue = new MinPriorityQueue();
  for (let i = 0; i < numItems; ++i) {
    queue.insert(i, 10 - i);
  }
  for (let i = numItems - 1; i >= 0; --i) {
    let item = queue.pop();
    expect(item).toBe(i);
  }
});
