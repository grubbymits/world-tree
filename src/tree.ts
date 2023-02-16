import { BoundingCuboid, Dimensions } from "./physics.ts";
import { PhysicalEntity } from "./entity.ts";
import { Point3D } from "./geometry.ts";

// TODO Templates/Generics..?

class OctNode {
  // 3x3x3 rounded up to a nice number.
  static readonly MaxEntities = 30;

  private _children: Array<OctNode> = new Array<OctNode>();
  private _entities: Array<PhysicalEntity> = new Array<PhysicalEntity>();

  get children(): Array<OctNode> {
    return this._children;
  }
  get entities(): Array<PhysicalEntity> {
    return this._entities;
  }
  get bounds(): BoundingCuboid {
    return this._bounds;
  }
  get centre(): Point3D {
    return this._bounds.centre;
  }
  get width(): number {
    return this._bounds.width;
  }
  get height(): number {
    return this._bounds.height;
  }
  get depth(): number {
    return this._bounds.depth;
  }
  get recursiveCountNumEntities(): number {
    if (this.entities.length != 0) {
      return this.entities.length;
    }
    let total = 0;
    for (const child of this.children) {
      total += child.recursiveCountNumEntities;
    }
    return total;
  }

  constructor(private _bounds: BoundingCuboid) {}

  insert(entity: PhysicalEntity): boolean {
    let inserted = false;
    if (this.children.length == 0) {
      // For a leaf node, insert it into the entity list and check that we're
      // within the size limit.
      this.entities.push(entity);
      // Allow the bounds to grow to completely contain the entity. This means
      // that some of the nodes could overlap.
      this.bounds.insert(entity.bounds);
      if (this.entities.length > OctNode.MaxEntities) {
        inserted = this.split();
      } else {
        inserted = true;
      }
    } else {
      // Other wise, pass the entity down through one of the children.
      // First try inserting an entity that is fully contained by an existing
      // boundary.
      for (const child of this.children) {
        if (child.bounds.containsBounds(entity.bounds)) {
          inserted = child.insert(entity);
          break;
        }
      }
      // Otherwise, place it based on the entity's centre point and we will then
      // grow the bounds.
      if (!inserted) {
        for (const child of this.children) {
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
    const width = this.bounds.width / 2;
    const depth = this.bounds.depth / 2;
    const height = this.bounds.height / 2;
    const dimensions = new Dimensions(width, depth, height);

    // half the dimensions again to get the distances to/from the centre.
    const offset = [-0.5, 0.5];

    // Create eight children.
    for (let z = 0; z < 2; z++) {
      for (let y = 0; y < 2; y++) {
        for (let x = 0; x < 2; x++) {
          const offsetX = (offset[x] * dimensions.width);
          const offsetY = (offset[y] * dimensions.depth);
          const offsetZ = (offset[z] * dimensions.height);
          const centre = new Point3D(
            this.centre.x + offsetX,
            this.centre.y + offsetY,
            this.centre.z + offsetZ,
          );

          const bounds = new BoundingCuboid(centre, dimensions);
          this.children.push(new OctNode(bounds));
        }
      }
    }

    const insertIntoChild = function (child: OctNode, entity: PhysicalEntity) {
      if (child.containsLocation(entity.bounds.centre)) {
        return child.insert(entity);
      }
      return false;
    };

    // Insert the entities into the children.
    for (const entity of this._entities) {
      let inserted = false;
      for (const child of this._children) {
        if (insertIntoChild(child, entity)) {
          inserted = true;
          break;
        }
      }
      console.assert(
        inserted,
        "failed to insert into children, entity centred at:",
        entity.bounds.centre,
      );
    }

    this._entities = [];
    return true;
  }

  containsBounds(bounds: BoundingCuboid): boolean {
    return this.bounds.containsBounds(bounds);
  }

  containsLocation(location: Point3D): boolean {
    return this.bounds.contains(location);
  }

  containsEntity(entity: PhysicalEntity): boolean {
    return this.entities.indexOf(entity) != -1;
  }

  recursivelyContainsEntity(entity: PhysicalEntity): boolean {
    if (this.containsEntity(entity)) {
      return true;
    }
    for (const child of this._children) {
      if (child.recursivelyContainsEntity(entity)) {
        return true;
      }
    }
    return false;
  }

  recursiveRemoveEntity(entity: PhysicalEntity): boolean {
    const idx = this.entities.indexOf(entity);
    if (idx != -1) {
      this.entities.splice(idx, 1);
      return true;
    }
    for (const child of this.children) {
      if (child.recursiveRemoveEntity(entity)) {
        return true;
      }
    }
    return false;
  }
}

export class Octree {
  private _root: OctNode;
  private _numEntities = 0;
  private readonly _worldBounds: BoundingCuboid;

  constructor(dimensions: Dimensions) {
    const x = dimensions.width / 2;
    const y = dimensions.depth / 2;
    const z = dimensions.height / 2;
    const centre = new Point3D(x, y, z);
    this._worldBounds = new BoundingCuboid(centre, dimensions);
    this._root = new OctNode(this._worldBounds);
  }

  get root(): OctNode {
    return this._root;
  }
  get bounds(): BoundingCuboid {
    return this.root.bounds;
  }

  insert(entity: PhysicalEntity): void {
    const inserted = this._root.insert(entity);
    console.assert(inserted, "failed to insert");
    this._numEntities++;
  }

  findEntitiesInArea(
    root: OctNode,
    area: BoundingCuboid,
    entities: Array<PhysicalEntity>,
  ) {
    if (root.entities.length != 0) {
      root.entities.forEach((entity) => entities.push(entity));
    } else {
      for (const child of root.children) {
        if (!child.bounds.intersects(area)) {
          continue;
        }
        this.findEntitiesInArea(child, area, entities);
      }
    }
  }

  getEntities(area: BoundingCuboid): Array<PhysicalEntity> {
    const entities = new Array<PhysicalEntity>();
    this.findEntitiesInArea(this.root, area, entities);
    return entities;
  }

  update(entity: PhysicalEntity): void {
    const removed: boolean = this.root.recursiveRemoveEntity(entity);
    console.assert(removed);
    this._numEntities--;
    this.insert(entity);
  }

  verify(entities: Array<PhysicalEntity>): boolean {
    for (const entity of entities) {
      if (!this._root.recursivelyContainsEntity(entity)) {
        console.error(
          "tree doesn't contain entity at (x,y,z):",
          entity.x,
          entity.y,
          entity.z,
        );
        return false;
      }
    }
    return true;
  }
}
