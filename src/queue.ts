
export interface PriorityQueue<T> {
  insert(x: T, k: number): void;
  first(): T;
  pop(): T;
  setKey(x: T, k: number);
}

class QueueItem <T> {
  constructor(private readonly _element: T,
              private _key: number) { }
  //get index(): T { return this._index; }
  get element(): T { return this._element; }
  get key(): number { return this._key; }
  set key(k: number) { this._key = k; }
}

export class MinPriorityQueue<T> implements PriorityQueue<T> {
  private _items: Array<QueueItem<T>> = new Array<QueueItem<T>>(); 
  private _indices: Map<T, number> = new Map<T, number>();
  private _length: number = 0;

  constructor() { }

  set length(l: number) { this._length = l; }
  get length(): number { return this._length; }
  get indices(): Map<T, number> { return this._indices; }
  get items(): Array<QueueItem<T>> { return this._items; }
  get size(): number { return this.items.length; }
  get first(): T { return this.items[0].element; }
  get pop(): T {
    let min = this.first;
    this.items.splice(0, 1);
    this.items.heapify(0);
    return min;
  }
  parentIdx(i: number): number {
    return i >> 1;
  }
  leftIdx(i: number): number {
    return 2 * i;
  }
  rightIdx(i: number): number {
    return 2 * i + 1;
  }
  keyAt(i: number): number {
    let item = this.items[i];
    return item.key;
  }
  insert(x: T, k: number): void {
    console.assert(!this.items.has(x));
    this.items.push(new QueueItem(x, Number.MAX_VALUE));
    this.setKey(x, k);
  }
  setKey(x: T, k: number): void {
    console.assert(this.indices.has(x));
    let i = this.indices.get(x);
    let item = this.items[i];
    console.assert(k <= item.key);
    item.key = k;

    while (i > 0 && this.keyAt(this.parentIdx(i)) < this.keyAt(i)) {
      this.exchange(i, this.parentIdx(i));
      i = this.parentIdx(i);
    }
  }
  exchange(idxA: number, idxB: number): void {
    let itemA = this.items[idxA];
    let itemB = this.items[idxB];
    this.items[idxA] = itemB;
    this.items[idxB] = itemA;
    this.indices.set(itemA, idxB);
    this.indices.set(itemB, idxA);
  }
  build(): void {
    // Bottom half of heap are leaves, so don't process them here.
    for (let i = this.size >> 1; i >= 0; i--) {
      this.heapify(i);
    }
  }
  heapify(i: number): void {
    let left = this.leftIdx(i);
    let right = this.rightIdx(i);
    let smallest = i;
    if (left <= this.size && this.keyAt(left) < this.keyAt(i)) {
      smallest = left;
    } else if (right <= this.size && this.keyAt(right) < this.keyAt(i)) {
      smallest = right;
    }
    if (smallest != i) {
      this.exchange(i, smallest);
      this.heapify(smallest);
    }
  }
}
