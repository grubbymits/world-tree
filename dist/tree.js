import { Dimensions, BoundingCuboid } from "./physics.js";
import { Point3D } from "./geometry.js";
class OctNode {
    constructor(_bounds) {
        this._bounds = _bounds;
        this._children = new Array();
        this._entities = new Array();
    }
    get children() { return this._children; }
    get entities() { return this._entities; }
    get bounds() { return this._bounds; }
    get centre() { return this._bounds.centre; }
    get width() { return this._bounds.width; }
    get height() { return this._bounds.height; }
    get depth() { return this._bounds.depth; }
    get recursiveCountNumEntities() {
        if (this._entities.length != 0) {
            return this._entities.length;
        }
        let total = 0;
        for (let child of this._children) {
            total += child.recursiveCountNumEntities;
        }
        return total;
    }
    insert(entity) {
        let inserted = false;
        if (this._children.length == 0) {
            this._entities.push(entity);
            this.bounds.insert(entity.bounds);
            if (this._entities.length > OctNode.MaxEntities) {
                inserted = this.split();
            }
            else {
                inserted = true;
            }
        }
        else {
            for (let child of this._children) {
                if (child.bounds.containsBounds(entity.bounds)) {
                    inserted = child.insert(entity);
                    break;
                }
            }
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
    split() {
        this._children = new Array();
        const width = (this._bounds.width / 2);
        const depth = (this._bounds.depth / 2);
        const height = (this._bounds.height / 2);
        const dimensions = new Dimensions(width, depth, height);
        const offset = [-0.5, 0.5];
        for (let z = 0; z < 2; z++) {
            for (let y = 0; y < 2; y++) {
                for (let x = 0; x < 2; x++) {
                    let offsetX = (offset[x] * dimensions.width);
                    let offsetY = (offset[y] * dimensions.depth);
                    let offsetZ = (offset[z] * dimensions.height);
                    let centre = new Point3D(this.centre.x + offsetX, this.centre.y + offsetY, this.centre.z + offsetZ);
                    let bounds = new BoundingCuboid(centre, dimensions);
                    this._children.push(new OctNode(bounds));
                }
            }
        }
        const insertIntoChild = function (child, entity) {
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
        return this._entities.indexOf(entity) != -1;
    }
    recursivelyContainsEntity(entity) {
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
    recursiveRemoveEntity(entity) {
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
OctNode.MaxEntities = 1000;
export class Octree {
    constructor(dimensions) {
        this._numEntities = 0;
        let x = (dimensions.width / 2);
        let y = (dimensions.depth / 2);
        let z = (dimensions.height / 2);
        let centre = new Point3D(x, y, z);
        this._worldBounds = new BoundingCuboid(centre, dimensions);
        this._root = new OctNode(this._worldBounds);
    }
    get bounds() { return this._root.bounds; }
    insert(entity) {
        let inserted = this._root.insert(entity);
        console.assert(inserted, "failed to insert");
        this._numEntities++;
    }
    findEntitiesInArea(root, area, entities) {
        if (root.entities.length != 0) {
            root.entities.forEach(entity => entities.push(entity));
            return;
        }
        for (let child of root.children) {
            if (!child.bounds.intersects(area)) {
                continue;
            }
            this.findEntitiesInArea(child, area, entities);
        }
    }
    getEntities(area) {
        let entities = new Array();
        this.findEntitiesInArea(this._root, area, entities);
        return entities;
    }
    update(entity) {
        const removed = this._root.recursiveRemoveEntity(entity);
        console.assert(removed);
        this._numEntities--;
        this.insert(entity);
    }
    verify(entities) {
        console.log("spatial graph should have num entities:", this._numEntities);
        console.log("counted: ", this._root.recursiveCountNumEntities);
        for (let entity of entities) {
            if (!this._root.recursivelyContainsEntity(entity)) {
                console.error("tree doesn't contain entity at (x,y,z):", entity.x, entity.y, entity.z);
                return false;
            }
        }
        console.log("verified entities in spatial graph:", entities.length);
        return true;
    }
}
