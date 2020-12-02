import { Point2D } from "./geometry.js";
import { Sprite } from "./graphics.js";
var RenderOrder;
(function (RenderOrder) {
    RenderOrder[RenderOrder["Before"] = -1] = "Before";
    RenderOrder[RenderOrder["Any"] = 0] = "Any";
    RenderOrder[RenderOrder["After"] = 1] = "After";
})(RenderOrder || (RenderOrder = {}));
class SceneNode {
    constructor(_entity) {
        this._entity = _entity;
    }
    overlapX(other) {
        return (this.entity.bounds.minX >= other.entity.bounds.minX &&
            this.entity.bounds.minX < other.entity.bounds.maxX) ||
            (this.entity.bounds.maxX > other.entity.bounds.minX &&
                this.entity.bounds.maxX <= other.entity.bounds.maxX);
    }
    overlapY(other) {
        return (this.entity.bounds.minY >= other.entity.bounds.minY &&
            this.entity.bounds.minY < other.entity.bounds.maxY) ||
            (this.entity.bounds.maxY > other.entity.bounds.minY &&
                this.entity.bounds.maxY <= other.entity.bounds.maxY);
    }
    get entity() { return this._entity; }
    get pred() { return this._pred; }
    get succ() { return this._succ; }
    get level() { return this._level; }
    get minZ() { return this._entity.bounds.minZ; }
    get maxZ() { return this._entity.bounds.maxZ; }
    set pred(pred) { this._pred = pred; }
    set succ(succ) { this._succ = succ; }
    set level(level) { this._level = level; }
}
class SceneLevel {
    constructor(root) {
        this._nodes = new Array();
        this._minZ = root.minZ;
        this._maxZ = root.maxZ;
        this._nodes.push(root);
        root.level = this;
    }
    get nodes() { return this._nodes; }
    inrange(entity) {
        return entity.bounds.minZ >= this._minZ && entity.bounds.minZ < this._maxZ;
    }
    add(node, drawOrder) {
        node.level = this;
        this._nodes.push(node);
        this.sort(drawOrder);
    }
    remove(node) {
        this._nodes.splice(this._nodes.indexOf(node), 1);
    }
    sort(drawOrder) {
        this._nodes.sort(drawOrder);
    }
}
export class SceneGraph {
    constructor(_canvas) {
        this._canvas = _canvas;
        this._levels = new Array();
        this._nodes = new Map();
        this._width = _canvas.width;
        this._height = _canvas.height;
        this._ctx = this._canvas.getContext("2d", { alpha: false });
    }
    render(camera) {
        if (this._levels.length == 0) {
            let nodeList = new Array();
            for (let node of this._nodes.values()) {
                nodeList.push(node);
            }
            console.log("first render...");
            console.log("inserted nodes into list:", nodeList.length);
            nodeList.sort((a, b) => {
                if (a.minZ <= b.minZ)
                    return RenderOrder.Before;
                return RenderOrder.After;
            });
            nodeList.forEach((node) => this.insertIntoLevel(node));
        }
        let ctx = this._ctx;
        ctx.clearRect(0, 0, this._width, this._height);
        this._levels.forEach((level) => {
            level.nodes.forEach((node) => {
                const entity = node.entity;
                if (entity.visible &&
                    camera.isOnScreen(entity.drawCoord, entity.width, entity.depth)) {
                    const coord = camera.getDrawCoord(entity.drawCoord);
                    entity.graphics.forEach((component) => {
                        const spriteId = component.update();
                        Sprite.sprites[spriteId].draw(coord, ctx);
                    });
                }
            });
        });
    }
    insertEntity(entity) {
        this.setDrawCoord(entity);
        let node = new SceneNode(entity);
        this._nodes.set(entity.id, node);
        if (this._levels.length != 0) {
            this.insertIntoLevel(node);
        }
    }
    updateEntity(entity) {
        console.assert(this._nodes.has(entity.id));
        this.setDrawCoord(entity);
        let node = this._nodes.get(entity.id);
        let level = node.level;
        if (level.inrange(node.entity)) {
            level.sort(this.drawOrder);
        }
        else {
            level.remove(node);
            this.insertIntoLevel(node);
        }
    }
    insertIntoLevel(node) {
        for (let level of this._levels) {
            if (level.inrange(node.entity)) {
                level.add(node, this.drawOrder);
                console.log("level contains num of nodes:", level.nodes.length);
                return;
            }
        }
        console.log("creating new SceneLevel");
        this._levels.push(new SceneLevel(node));
    }
    getLocationAt(x, y, camera) {
        let entity = this.getEntityDrawnAt(x, y, camera);
        if (entity != null) {
            return entity.bounds.minLocation;
        }
        return null;
    }
    getEntityDrawnAt(x, y, camera) {
        for (let i = this._levels.length - 1; i >= 0; i--) {
            const level = this._levels[i];
            for (let j = 0; j < level.nodes.length; j++) {
                const node = level.nodes[j];
                const entity = node.entity;
                if (!entity.visible ||
                    !camera.isOnScreen(entity.drawCoord, entity.width, entity.depth)) {
                    continue;
                }
                let entityDrawCoord = camera.getDrawCoord(entity.drawCoord);
                let graphic = entity.graphic;
                if (x < entityDrawCoord.x || y < entityDrawCoord.y ||
                    x > entityDrawCoord.x + graphic.width ||
                    y > entityDrawCoord.y + graphic.height) {
                    continue;
                }
                if (!graphic.isTransparentAt(x - entityDrawCoord.x, y - entityDrawCoord.y)) {
                    return entity;
                }
            }
        }
        return null;
    }
}
export class IsometricRenderer extends SceneGraph {
    constructor(canvas) {
        super(canvas);
    }
    static getDrawCoord(loc) {
        let dx = Math.floor(this._halfSqrt3 * (loc.x + loc.y));
        let dy = Math.floor((0.5 * (loc.y - loc.x)) - loc.z);
        return new Point2D(dx, dy);
    }
    setDrawCoord(entity) {
        let coord = IsometricRenderer.getDrawCoord(entity.bounds.minLocation);
        entity.drawCoord = new Point2D(coord.x, coord.y - entity.depth);
    }
    getDrawCoord(location) {
        return IsometricRenderer.getDrawCoord(location);
    }
    drawOrder(first, second) {
        if (first.overlapX(second)) {
            return first.entity.bounds.maxY < second.entity.bounds.minY ?
                RenderOrder.Before : RenderOrder.After;
        }
        return first.entity.bounds.minX > second.entity.bounds.maxX ?
            RenderOrder.Before : RenderOrder.After;
    }
}
IsometricRenderer._sqrt3 = Math.sqrt(3);
IsometricRenderer._halfSqrt3 = Math.sqrt(3) * 0.5;
