import { Location, Dimensions, BoundingCuboid } from "./physics.js";
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
    insertAndEnlarge(entity) {
        this._bounds.insert(entity.bounds);
        this._entities.push(entity);
    }
    insert(entity) {
        if (!this._bounds.containsBounds(entity.bounds)) {
            console.log("inserting entity that doesn't entirely fit");
        }
        this._entities.push(entity);
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
    init() {
        if (this._entities.length > OctNode.MaxEntities) {
            this._children = new Array();
            let width = Math.floor(this._bounds.width / 2);
            let depth = Math.floor(this._bounds.depth / 2);
            let height = Math.floor(this._bounds.height / 2);
            let dimensions = new Dimensions(width, depth, height);
            let offset = [-0.5, 0.5];
            for (let z = 0; z < 2; z++) {
                for (let y = 0; y < 2; y++) {
                    for (let x = 0; x < 2; x++) {
                        let offsetX = Math.floor(offset[x] * dimensions.width);
                        let offsetY = Math.floor(offset[y] * dimensions.depth);
                        let offsetZ = Math.floor(offset[z] * dimensions.height);
                        let centre = new Location(this.centre.x + offsetX, this.centre.y + offsetY, this.centre.z + offsetZ);
                        let bounds = new BoundingCuboid(centre, dimensions);
                        this._children.push(new OctNode(bounds));
                    }
                }
            }
            for (let entity of this._entities) {
                for (let child of this._children) {
                    if (child.containsBounds(entity.bounds)) {
                        child.insert(entity);
                        break;
                    }
                    else if (child.containsLocation(entity.centre)) {
                        child.insert(entity);
                        break;
                    }
                }
            }
            for (let child of this._children) {
                child.init();
            }
            this._entities = [];
        }
        else if (this._entities.length != 0) {
        }
        console.assert(this._entities.length <= OctNode.MaxEntities, "Node contains too many entities:", this._entities.length);
    }
}
OctNode.MaxEntities = 32;
export class Octree {
    constructor(entities) {
        this._numEntities = 0;
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
    verify(entities) {
        for (let entity of entities) {
            if (!this._root.containsEntity(entity)) {
                console.error("tree doesn't contain entity at (x,y,z):", entity.x, entity.y, entity.z);
                return false;
            }
        }
        return true;
    }
}
