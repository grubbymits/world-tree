import { Dimensions, BoundingCuboid } from "./physics.js";
import { Point3D } from "./geometry.js";
class OctNode {
    constructor(_bounds) {
        this._bounds = _bounds;
        this._children = new Array();
        this._entities = new Array();
    }
    get bounds() { return this._bounds; }
    get centre() { return this._bounds.centre; }
    get width() { return this._bounds.width; }
    get height() { return this._bounds.height; }
    get depth() { return this._bounds.depth; }
    get numEntities() {
        if (this._entities.length != 0) {
            return this._entities.length;
        }
        let total = 0;
        for (let child of this._children) {
            total += child.numEntities;
        }
        return total;
    }
    insert(entity) {
        let inserted = false;
        if (this._children.length == 0) {
            this._entities.push(entity);
            if (this._entities.length > OctNode.MaxEntities) {
                inserted = this.split();
            }
            else {
                inserted = true;
            }
        }
        else {
            for (let child of this._children) {
                if (child.containsLocation(entity.centre)) {
                    inserted = child.insert(entity);
                    break;
                }
            }
        }
        console.assert(inserted, "failed to insert location");
        return inserted;
    }
    split() {
        this._children = new Array();
        const width = Math.floor(this._bounds.width / 2);
        const depth = Math.floor(this._bounds.depth / 2);
        const height = Math.floor(this._bounds.height / 2);
        const dimensions = new Dimensions(width, depth, height);
        let offset = [-0.5, 0.5];
        for (let z = 0; z < 2; z++) {
            for (let y = 0; y < 2; y++) {
                for (let x = 0; x < 2; x++) {
                    let offsetX = Math.floor(offset[x] * dimensions.width);
                    let offsetY = Math.floor(offset[y] * dimensions.depth);
                    let offsetZ = Math.floor(offset[z] * dimensions.height);
                    let centre = new Point3D(this.centre.x + offsetX, this.centre.y + offsetY, this.centre.z + offsetZ);
                    let bounds = new BoundingCuboid(centre, dimensions);
                    this._children.push(new OctNode(bounds));
                }
            }
        }
        let insertIntoChild = function (child, entity) {
            if (child.containsLocation(entity.bounds.centre)) {
                return child.insert(entity);
            }
            return false;
        };
        for (let entity of this._entities) {
            let inserted = false;
            for (let child of this._children) {
                if (insertIntoChild(child, entity)) {
                    inserted = true;
                    break;
                }
            }
            console.assert(inserted, "failed to insert into children, entity centred at:", entity.bounds.centre);
        }
        this._entities = [];
        return true;
    }
    containsBounds(bounds) {
        return this._bounds.containsBounds(bounds);
    }
    containsLocation(location) {
        return this._bounds.contains(location);
    }
    containsEntity(entity) {
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
    getEntities(area) {
        let entities = new Array();
        if (!this._bounds.containsBounds(area) && !this._bounds.intersects(area)) {
            return entities;
        }
        for (let child of this._children) {
            child.getEntities(area).forEach(entity => entities.push(entity));
        }
        for (let entity of this._entities) {
            entities.push(entity);
        }
        return entities;
    }
}
OctNode.MaxEntities = 32;
export class Octree {
    constructor(dimensions) {
        this._numEntities = 0;
        let x = Math.floor(dimensions.width / 2);
        let y = Math.floor(dimensions.depth / 2);
        let z = Math.floor(dimensions.height / 2);
        let centre = new Point3D(x, y, z);
        this._worldBounds = new BoundingCuboid(centre, dimensions);
        console.log("creating space of dimensions (WxDxH):", this._worldBounds.width, this._worldBounds.depth, this._worldBounds.height);
        this._root = new OctNode(this._worldBounds);
    }
    get bounds() { return this._root.bounds; }
    insert(entity) {
        let inserted = this._root.insert(entity);
        console.assert(inserted, "failed to insert");
        this._numEntities++;
    }
    getEntities(bounds) {
        return this._root.getEntities(bounds);
    }
    update(entity) {
    }
    verify(entities) {
        console.log("spatial graph should have num entities:", this._numEntities);
        console.log("counted: ", this._root.numEntities);
        for (let entity of entities) {
            if (!this._root.containsEntity(entity)) {
                console.error("tree doesn't contain entity at (x,y,z):", entity.x, entity.y, entity.z);
                return false;
            }
        }
        console.log("verified entities in spatial graph:", entities.length);
        return true;
    }
}
