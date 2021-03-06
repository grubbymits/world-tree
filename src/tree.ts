import { Dimensions,
         BoundingCuboid } from "./physics.js"
import { Entity } from "./entity.js"
import { Point3D } from "./geometry.js"

// TODO Templates/Generics..?

class OctNode {
  // 3x3x3 rounded up to a nice number.
  static readonly MaxEntities: number = 9;

  private _children: Array<OctNode> = new Array<OctNode>();
  private _entities: Array<Entity> = new Array<Entity>();

  get children(): Array<OctNode> { return this._children; }
  get entities(): Array<Entity> { return this._entities; }
  get bounds(): BoundingCuboid { return this._bounds; }
  get centre(): Point3D { return this._bounds.centre; }
  get width(): number { return this._bounds.width; }
  get height(): number { return this._bounds.height; }
  get depth(): number { return this._bounds.depth; }
  get recursiveCountNumEntities(): number {
    if (this._entities.length != 0) {
      return this._entities.length;
    }
    let total = 0;
    for (let child of this._children) {
      total += child.recursiveCountNumEntities;
    }
    return total;
  }

  constructor(private _bounds: BoundingCuboid) { }

  insert(entity: Entity): boolean {
    let inserted: boolean = false;
    if (this._children.length == 0) {
      // For a leaf node, insert it into the entity list and check that we're
      // within the size limit.
      this._entities.push(entity);
      // Allow the bounds to grow to completely contain the entity. This means
      // that some of the nodes could overlap.
      this.bounds.insert(entity.bounds);
      if (this._entities.length > OctNode.MaxEntities) {
        inserted = this.split();
      } else {
        inserted = true;
      }
    } else {
      // Other wise, pass the entity down through one of the children.
      // First try inserting an entity that is fully contained by an existing
      // boundary.
      for (let child of this._children) {
        if (child.bounds.containsBounds(entity.bounds)) {
          inserted = child.insert(entity);
          break;
        }
      }
      // Otherwise, place it based on the entity's centre point and we will then
      // grow the bounds.
      if (!inserted) {
        for (let child of this._children) {
          if (child.containsLocation(entity.centre)) {
            inserted = child.insert(entity);
            break;
          }
        }
      }
    }
    console.assert(inserted, "failed to insert entity into octree node");
    return inserted;
  }

  split(): boolean {
    this._children = new Array<OctNode>();
    // split each dimension into 2.
    const width = (this._bounds.width / 2);
    const depth = (this._bounds.depth / 2);
    const height = (this._bounds.height / 2);
    const dimensions = new Dimensions(width, depth, height);
    //console.log("splitting into 8x (WxDxH):", width, depth, height);

    // half the dimensions again to get the distances to/from the centre.
    const offset = [-0.5, 0.5];

    // Create eight children.
    for (let z = 0; z < 2; z++) {
      for (let y = 0; y < 2; y++) {
        for (let x = 0; x < 2; x++) {
          let offsetX = (offset[x] * dimensions.width);
          let offsetY = (offset[y] * dimensions.depth);
          let offsetZ = (offset[z] * dimensions.height);
          let centre = new Point3D(this.centre.x + offsetX,
                                    this.centre.y + offsetY,
                                    this.centre.z + offsetZ);

          //console.log("chosen centre point (x,y,z):", centre.x, centre.y, centre.z);
          let bounds = new BoundingCuboid(centre, dimensions);
          this._children.push(new OctNode(bounds));
        }
      }
    }

    const insertIntoChild = function(child: OctNode, entity: Entity) {
      if (child.containsLocation(entity.bounds.centre)) {
        return child.insert(entity);
      }
      return false;
    }

    // Insert the entities into the children.
    for (let entity of this._entities) {
      let inserted: boolean = false;
      for (let child of this._children) {
        if (insertIntoChild(child, entity)) {
          inserted = true;
          break;
        }
      }
      console.assert(inserted,
                     "failed to insert into children, entity centred at:",
                     entity.bounds.centre);
    }

    this._entities = [];
    return true;
  }

  containsBounds(bounds: BoundingCuboid): boolean {
    return this._bounds.containsBounds(bounds);
  }

  containsLocation(location: Point3D): boolean {
    return this._bounds.contains(location);
  }

  containsEntity(entity: Entity): boolean {
    return this._entities.indexOf(entity) != -1;
  }

  recursivelyContainsEntity(entity: Entity): boolean {
    if (this.containsEntity(entity)) {
      return true;
    }
    for (let child of this._children) {
      if (child.recursivelyContainsEntity(entity)) {
        return true;
      }
    }
    return false;
  }

  recursiveRemoveEntity(entity: Entity): boolean {
    const idx = this._entities.indexOf(entity);
    if (idx != -1) {
      this._entities.splice(idx, 1);
      return true;
    }
    for (let child of this._children) {
      if (child.recursiveRemoveEntity(entity)) {
        return true;
      }
    }
    return false;
  }
}

export class Octree {
  private _root: OctNode;
  private _numEntities: number = 0;
  private readonly _worldBounds: BoundingCuboid;

  constructor(dimensions: Dimensions) {
    let x = (dimensions.width / 2);
    let y = (dimensions.depth / 2);
    let z = (dimensions.height / 2);
    let centre = new Point3D(x, y, z);
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

  findEntitiesInArea(root: OctNode, area: BoundingCuboid, entities: Array<Entity>) {
    for (let child of root.children) {
      if (!child.bounds.intersects(area)) {
        continue;
      }
      if (child.entities.length != 0) {
        child.entities.forEach(entity => entities.push(entity));
      } else {
        this.findEntitiesInArea(child, area, entities);
      }
    }
  }

  getEntities(area: BoundingCuboid): Array<Entity> {
    let entities = new Array<Entity>();
    this.findEntitiesInArea(this._root, area, entities);
    return entities;
  }

  update(entity: Entity): void {
    const removed: boolean = this._root.recursiveRemoveEntity(entity);
    console.assert(removed);
    this._numEntities--;
    this.insert(entity);
  }

  verify(entities: Array<Entity>): boolean {
    console.log("spatial graph should have num entities:", this._numEntities);
    console.log("counted: ", this._root.recursiveCountNumEntities);
    for (let entity of entities) {
      if (!this._root.recursivelyContainsEntity(entity)) {
        console.error("tree doesn't contain entity at (x,y,z):",
                      entity.x, entity.y, entity.z);
        return false;
      }
    }
    console.log("verified entities in spatial graph:", entities.length);
    return true;
  }
}

