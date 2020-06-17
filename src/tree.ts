import { Location,
         Dimensions,
         BoundingCuboid } from "./physics.js"
import { Entity } from "./entity.js"

// TODO Templates/Generics..?

class OctNode {
  // 3x3x3 rounded up to a nice number.
  static readonly MaxEntities: number = 32;

  private _children: Array<OctNode> = new Array<OctNode>();
  private _entities: Array<Entity> = new Array<Entity>();

  get bounds(): BoundingCuboid { return this._bounds; }
  get centre(): Location { return this._bounds.centre; }
  get width(): number { return this._bounds.width; }
  get height(): number { return this._bounds.height; }
  get depth(): number { return this._bounds.depth; }

  constructor(private _bounds: BoundingCuboid) { }

  insert(entity: Entity): boolean {
    let inserted: boolean = false;
    if (this._children.length == 0) {
      // For a leaf node, insert it into the entity list and check that we're
      // within the size limit.
      this._entities.push(entity);
      if (this._entities.length > OctNode.MaxEntities) {
        inserted = this.split();
      } else {
        inserted = true;
      }
    } else {
      // Other wise, pass the entity down through one of the children.
      for (let child of this._children) {
        if (child.containsBounds(entity.bounds)) {
          inserted = child.insert(entity);
          break;
        } else if (child.containsLocation(entity.centre)) {
          inserted = child.insert(entity);
          break;
        }
      }
    }
    console.assert(inserted, "failed to insert location");
    return inserted;
  }

  split(): boolean {
    console.log("splitting node");
    this._children = new Array<OctNode>();
    // split each dimension into 2.
    let width = Math.floor(this._bounds.width / 2);
    let depth = Math.floor(this._bounds.depth / 2);
    let height = Math.floor(this._bounds.height / 2);
    let dimensions = new Dimensions(width, depth, height);

    // half the dimensions again to get the distances to/from the centre.
    let offset = [-0.5, 0.5];

    // Create eight children.
    for (let z = 0; z < 2; z++) {
      for (let y = 0; y < 2; y++) {
        for (let x = 0; x < 2; x++) {
          let offsetX = Math.floor(offset[x] * dimensions.width);
          let offsetY = Math.floor(offset[y] * dimensions.depth);
          let offsetZ = Math.floor(offset[z] * dimensions.height);
          let centre = new Location(this.centre.x + offsetX,
                                    this.centre.y + offsetY,
                                    this.centre.z + offsetZ);
          let bounds = new BoundingCuboid(centre, dimensions);
          this._children.push(new OctNode(bounds));
        }
      }
    }

    let numInserted = 0;
    // Insert the entities into the children.
    for (let child of this._children) {
      for (let entity of this._entities) {
        if (child.containsBounds(entity.bounds)) {
          if (child.insert(entity)) {
            ++numInserted;
          }
          break;
        } else if (!child.containsLocation(entity.bounds.centre)) {
          if (child.insert(entity)) {
            ++numInserted;
          }
          break;
        }
      }
    }
    console.assert(numInserted == this._entities.length,
                   "failed to insert all entities into children",
                   numInserted, "vs", this._entities.length);

    this._entities = [];
    return true;
  }

  containsBounds(bounds: BoundingCuboid): boolean {
    return this._bounds.containsBounds(bounds);
  }

  containsLocation(location: Location): boolean {
    return this._bounds.contains(location);
  }

  containsEntity(entity: Entity): boolean {
    for (let containedEntity of this._entities) {
      if (containedEntity.id == entity.id) {
        return true;
      }
    }
    for (let child of this._children) {
      if (child.containsEntity(entity)) {
        return true;
      }
    }
    return false;
  }

  get numEntities(): number {
    if (this._entities.length != 0) {
      return this._entities.length;
    }
    let total = 0;
    for (let child of this._children) {
      total += child.numEntities;
    }
    return total;
  }
}

export class Octree {
  private _root: OctNode;
  private _numEntities: number = 0;
  private readonly _worldBounds: BoundingCuboid;

  constructor(dimensions: Dimensions) {
    let x = Math.floor(dimensions.width / 2);
    let y = Math.floor(dimensions.depth / 2);
    let z = Math.floor(dimensions.height / 2);
    let centre = new Location(x, y, z);
    this._worldBounds = new BoundingCuboid(centre, dimensions);
    console.log("creating space of dimensions (WxDxH):",
                this._worldBounds.width,
                this._worldBounds.depth,
                this._worldBounds.height);
    this._root = new OctNode(this._worldBounds);
  }

  get bounds(): BoundingCuboid { return this._root.bounds; }

  insert(entity: Entity): void {
    let inserted = this._root.insert(entity);
    console.assert(inserted, "failed to insert");
    this._numEntities++;
  }

  update(entity: Entity): void {
  }

  verify(entities: Array<Entity>): boolean {
    console.log("spatial graph should have num entities:", this._numEntities);
    console.log("counted: ", this._root.numEntities);
    for (let entity of entities) {
      if (!this._root.containsEntity(entity)) {
        console.error("tree doesn't contain entity at (x,y,z):",
                      entity.x, entity.y, entity.z);
        return false;
      }
    }
    console.log("verified entities in spatial graph:", entities.length);
    return true;
  }
}

