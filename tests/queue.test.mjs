import * as WT from "../dist/world-tree.mjs";

test("build queue", () => {
  const numItems = 10;
  let queue = new WT.MinPriorityQueue();
  for (let i = 0; i < numItems; ++i) {
    let key = 9 - i;
    queue.insert(i, key);
  }
  for (let i = numItems - 1; i >= 0; --i) {
    let item = queue.pop();
    expect(item).toBe(i);
  }
});
