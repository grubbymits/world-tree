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

  constructor(private _bounds: BoundingCuboid) {
    /*
    console.log("constructing octree node of size (WxDxH):",
                _bounds.width, _bounds.depth, _bounds.height,
                "rooted at min location (x,y,z):",
                _bounds.minLocation.x,
                _bounds.minLocation.y,
                _bounds.minLocation.z);
    */
  }

  insertAndEnlarge(entity: Entity) {
    this._bounds.insert(entity.bounds);
    this._entities.push(entity);
  }

  insert(entity: Entity) {
    if (!this._bounds.containsBounds(entity.bounds)) {
      console.log("inserting entity that doesn't entirely fit");
    }
    this._entities.push(entity);
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

  init() {
    //console.log("initialising node with number of entities:",
      //          this._entities.length);

    if (this._entities.length > OctNode.MaxEntities) {
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
      // Insert the entities into the children.
      for (let entity of this._entities) {
        for (let child of this._children) {
          if (child.containsBounds(entity.bounds)) {
            child.insert(entity);
            break;
          } else if (child.containsLocation(entity.centre)) {
            child.insert(entity);
            break;
          }
        }
      }
      for (let child of this._children) {
        child.init();
      }
      // Clear the array as the children now hold the entities.
      this._entities = [];
    } else if (this._entities.length != 0) {
      //console.log("not splitting node, contains number of entities:",
        //          this._entities.length);
      //for (let entity of this._entities) {
        //console.log("entity at (x,y,z):", entity.x, entity.y, entity.z)
      //}
    }
    
    console.assert(this._entities.length <= OctNode.MaxEntities,
                   "Node contains too many entities:", this._entities.length);
  }
}

export class Octree {
  private _root: OctNode;
  private _numEntities: number = 0;

  constructor(entities: Array<Entity>) {
    let dimensions = new Dimensions(2, 2, 2);
    let centre = new Location(1, 1, 1);
    let bounds = new BoundingCuboid(centre, dimensions);
    this._root = new OctNode(bounds);
    console.log("create octree for number of entities:", entities.length);

    for (let entity of entities) {
      this._root.insertAndEnlarge(entity);
    }
    console.log("grown root node to:");
    this._root.bounds.dump();
    this._root.init();
  }

  verify(entities: Array<Entity>): boolean {
    for (let entity of entities) {
      if (!this._root.containsEntity(entity)) {
        console.error("tree doesn't contain entity at (x,y,z):",
                      entity.x, entity.y, entity.z);
        return false;
      }
    }
    return true;
  }
}

