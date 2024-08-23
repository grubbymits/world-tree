export interface PriorityQueue<T> {
  insert(x: T, k: number): void;
  build(): void;
  pop(): T;
  setKey(x: T, k: number): void;
  empty(): boolean;
}

class QueueItem<T> {
  constructor(private readonly _element: T, private _key: number) {}
  get element(): T {
    return this._element;
  }
  get key(): number {
    return this._key;
  }
  set key(k: number) {
    this._key = k;
  }
}

export class MinPriorityQueue<T> implements PriorityQueue<T> {
  private _items: Array<QueueItem<T>> = new Array<QueueItem<T>>();
  private _indices: Map<T, number> = new Map<T, number>();

  constructor() {}

  get indices(): Map<T, number> {
    return this._indices;
  }
  get items(): Array<QueueItem<T>> {
    return this._items;
  }
  get size(): number {
    return this.items.length - 1;
  }
  get length(): number {
    return this.items.length;
  }
  empty(): boolean {
    return this.length == 0;
  }
  pop(): T {
    const minItem = this.items[0];
    this.items.splice(0, 1);
    this.indices.delete(minItem.element);
    for (let i = 0; i < this.items.length; ++i) {
      const item = this.items[i];
      this.indices.set(item.element, i);
    }
    this.build();
    return minItem.element;
  }
  parentIdx(i: number): number {
    return (i - 1) >> 1;
  }
  leftIdx(i: number): number {
    return 2 * i + 1;
  }
  rightIdx(i: number): number {
    return 2 * i + 2;
  }
  keyAt(i: number): number {
    console.assert(i < this.length);
    const item = this.items[i];
    return item.key;
  }
  insert(x: T, k: number): void {
    console.assert(!this.indices.has(x));
    this.items.push(new QueueItem(x, Number.MAX_VALUE));
    this.indices.set(x, this.size);
    this.setKey(x, k);
  }
  setKey(x: T, k: number): void {
    console.assert(this.indices.has(x));
    let i: number = this.indices.get(x)!;
    console.assert(i < this.length);
    const item: QueueItem<T> = this.items[i];
    console.assert(k <= item.key);
    item.key = k;

    while (i > 0 && this.keyAt(this.parentIdx(i)) > this.keyAt(i)) {
      this.exchange(i, this.parentIdx(i));
      i = this.parentIdx(i);
    }
  }
  exchange(idxA: number, idxB: number): void {
    console.assert(idxA < this.length);
    console.assert(idxB < this.length);
    const itemA = this.items[idxA];
    const itemB = this.items[idxB];
    this.items[idxA] = itemB;
    this.items[idxB] = itemA;
    this.indices.set(itemA.element, idxB);
    this.indices.set(itemB.element, idxA);
  }
  build(): void {
    // Bottom half of heap are leaves, so don't process them here.
    for (let i = this.size >> 1; i >= 0; i--) {
      this.heapify(i);
    }
  }
  heapify(i: number): void {
    const left = this.leftIdx(i);
    const right = this.rightIdx(i);
    let smallest = i;
    if (left < this.length && this.keyAt(left) < this.keyAt(i)) {
      smallest = left;
    }
    if (right < this.length && this.keyAt(right) < this.keyAt(i)) {
      smallest = right;
    }
    if (smallest != i) {
      this.exchange(i, smallest);
      this.heapify(smallest);
    }
  }
}
