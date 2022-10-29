import { assertEquals } from "https://deno.land/std@0.160.0/testing/asserts.ts";

import * as WT from '../dist/world-tree.js';

Deno.test('build queue', () => {
  const numItems = 10;
  let queue = new WT.MinPriorityQueue<number>();
  for (let i = 0; i < numItems; ++i) {
    queue.insert(i, 10 - i);
  }
  for (let i = numItems - 1; i >= 0; --i) {
    let item = queue.pop();
    assertEquals(item, i);
  }
});
