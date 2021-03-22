import { Point2D, Point3D, Segment2D } from "./geometry.js";
import { Sprite } from "./graphics.js";
import { Dimensions } from "./physics.js";
import { TimedEventHandler } from "./events.js";
export var RenderOrder;
(function (RenderOrder) {
    RenderOrder[RenderOrder["Before"] = -1] = "Before";
    RenderOrder[RenderOrder["Any"] = 0] = "Any";
    RenderOrder[RenderOrder["After"] = 1] = "After";
})(RenderOrder || (RenderOrder = {}));
export class SceneNode {
    constructor(_entity, _drawCoord) {
        this._entity = _entity;
        this._drawCoord = _drawCoord;
        this._preds = new Array();
        this._succs = new Array();
        this._topOutlineSegments = new Array();
        this._sideOutlineSegments = new Array();
        this._baseOutlineSegments = new Array();
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
    overlapZ(other) {
        return (this.entity.bounds.minZ >= other.entity.bounds.minZ &&
            this.entity.bounds.minZ < other.entity.bounds.maxZ) ||
            (this.entity.bounds.maxZ > other.entity.bounds.minZ &&
                this.entity.bounds.maxZ <= other.entity.bounds.maxZ);
    }
    intersectsTop(other) {
        for (let otherTop of other.topSegments) {
            for (let baseSegment of this.baseSegments) {
                if (baseSegment.intersects(otherTop)) {
                    return true;
                }
            }
            for (let sideSegment of this.sideSegments) {
                if (sideSegment.intersects(otherTop)) {
                    return true;
                }
            }
        }
        return false;
    }
    addPred(pred) {
        let idx = this._preds.indexOf(pred);
        if (idx != -1)
            return;
        this._preds.push(pred);
    }
    addSucc(succ) {
        let idx = this._succs.indexOf(succ);
        if (idx != -1)
            return;
        this._succs.push(succ);
    }
    removePred(pred) {
        let idx = this._preds.indexOf(pred);
        if (idx == -1)
            return;
        this._preds.splice(idx, 1);
    }
    removeSucc(succ) {
        let idx = this._succs.indexOf(succ);
        if (idx == -1)
            return;
        this._succs.splice(idx, 1);
    }
    get id() { return this._entity.id; }
    get drawCoord() { return this._drawCoord; }
    get topSegments() { return this._topOutlineSegments; }
    get baseSegments() { return this._baseOutlineSegments; }
    get sideSegments() { return this._sideOutlineSegments; }
    get allSegments() {
        let outline = new Array();
        this.topSegments.forEach(segment => outline.push(segment));
        this.sideSegments.forEach(segment => outline.push(segment));
        this.baseSegments.forEach(segment => outline.push(segment));
        return outline;
    }
    get entity() { return this._entity; }
    get preds() { return this._preds; }
    get succs() { return this._succs; }
    get level() { return this._level; }
    get minZ() { return this._entity.bounds.minZ; }
    get maxZ() { return this._entity.bounds.maxZ; }
    set level(level) { this._level = level; }
    set drawCoord(coord) { this._drawCoord = coord; }
    get isRoot() { return this._preds.length == 0; }
}
class SceneLevel {
    constructor(root) {
        this._nodes = new Array();
        this._roots = new Array();
        this._discovered = new Set();
        this._topologicalOrder = new Array();
        this._minZ = root.minZ;
        this._maxZ = root.maxZ;
        this._nodes.push(root);
        root.level = this;
    }
    get nodes() { return this._nodes; }
    get roots() { return this._roots; }
    get order() { return this._topologicalOrder; }
    inrange(entity) {
        return entity.bounds.minZ >= this._minZ && entity.bounds.minZ < this._maxZ;
    }
    add(node, graph) {
        node.level = this;
        this._nodes.push(node);
        this.update(node, graph);
    }
    remove(node) {
        let idx = this._nodes.indexOf(node);
        console.assert(idx != -1);
        this._nodes.splice(idx, 1);
        idx = this._roots.indexOf(node);
        if (idx != -1) {
            this._roots.splice(idx, 1);
        }
    }
    update(node, graph) {
        node.preds.forEach((pred) => {
            if (graph.drawOrder(pred, node) != RenderOrder.Before) {
                pred.removeSucc(node);
                node.removePred(pred);
            }
        });
        node.succs.forEach((succ) => {
            if (graph.drawOrder(succ, node) != RenderOrder.After) {
                node.removeSucc(succ);
                succ.removePred(node);
            }
        });
        for (let i = 0; i < this._nodes.length; i++) {
            let existing = this._nodes[i];
            if (existing.id == node.id) {
                continue;
            }
            const order = graph.drawOrder(node, existing);
            if (RenderOrder.Before == order) {
                node.addSucc(existing);
                existing.addPred(node);
            }
            else if (RenderOrder.After == order) {
                existing.addSucc(node);
                node.addPred(existing);
            }
        }
        if (node.isRoot && this._roots.indexOf(node) == -1) {
            this._roots.push(node);
        }
        this._discovered.clear();
        this._topologicalOrder.length = 0;
        for (let i in this._roots) {
            if (this._discovered.has(this._roots[i])) {
                continue;
            }
            this.topologicalSort(graph, this._roots[i]);
        }
    }
    buildGraph(graph) {
        let startTime = Date.now();
        for (let i = 0; i < this._nodes.length; i++) {
            let nodeI = this._nodes[i];
            for (let j = 0; j < this._nodes.length; j++) {
                if (i == j)
                    continue;
                let nodeJ = this._nodes[j];
                const order = graph.drawOrder(nodeI, nodeJ);
                if (RenderOrder.Before == order) {
                    nodeI.addSucc(nodeJ);
                    nodeJ.addPred(nodeI);
                }
                else if (RenderOrder.After == order) {
                    nodeJ.addSucc(nodeI);
                    nodeI.addPred(nodeJ);
                }
            }
        }
        let endTime = Date.now();
        console.log("building graph of size:", this._nodes.length);
        console.log("time elasped (ms):", endTime - startTime);
        for (let node of this._nodes) {
            if (node.preds.length == 0) {
                this._roots.push(node);
            }
        }
        this._discovered.clear();
        this._topologicalOrder.length = 0;
        startTime = Date.now();
        for (let i in this._roots) {
            if (this._discovered.has(this._roots[i])) {
                continue;
            }
            this.topologicalSort(graph, this._roots[i]);
        }
        endTime = Date.now();
        console.log("time elasped for graph sort (ms):", endTime - startTime);
    }
    topologicalSort(graph, node) {
        this._discovered.add(node);
        for (let succ of node.succs) {
            if (this._discovered.has(succ))
                continue;
            this.topologicalSort(graph, succ);
        }
        this._topologicalOrder.push(node);
    }
}
export class SceneGraph {
    constructor() {
        this._levels = new Array();
    }
    setDrawCoords(node) {
        const entity = node.entity;
        const min = entity.bounds.minLocation;
        const max = entity.bounds.maxLocation;
        const width = entity.bounds.width;
        const depth = entity.bounds.depth;
        const height = entity.bounds.height;
        node.topSegments.length = 0;
        node.baseSegments.length = 0;
        node.sideSegments.length = 0;
        const min2D = this.getDrawCoord(min);
        const base1 = this.getDrawCoord(new Point3D(min.x, max.y, min.z));
        const base2 = this.getDrawCoord(new Point3D(max.x, max.y, min.z));
        node.baseSegments.push(new Segment2D(min2D, base1));
        node.baseSegments.push(new Segment2D(base1, base2));
        const max2D = this.getDrawCoord(max);
        const top1 = this.getDrawCoord(new Point3D(min.x, min.y, max.z));
        const top2 = this.getDrawCoord(new Point3D(max.x, min.y, max.z));
        node.topSegments.push(new Segment2D(top1, top2));
        node.topSegments.push(new Segment2D(top2, max2D));
        node.sideSegments.push(new Segment2D(min2D, top1));
        node.sideSegments.push(new Segment2D(base2, max2D));
        const drawHeightOffset = min2D.sub(top2);
        const coord = this.getDrawCoord(entity.bounds.minLocation);
        const adjustedCoord = new Point2D(coord.x, coord.y - drawHeightOffset.y);
        node.drawCoord = adjustedCoord;
    }
    get levels() { return this._levels; }
    get initialised() { return this.levels.length != 0; }
    insertNode(node) {
        this.setDrawCoords(node);
        if (this.initialised) {
            this.insertIntoLevel(node);
        }
        else {
            console.log("not inserting into level entity with id", node.entity.id);
        }
    }
    updateNode(node) {
        this.setDrawCoords(node);
        console.assert(node.level != null, "node with id:", node.entity.id, "isn't assigned a level!");
        let level = node.level;
        if (level.inrange(node.entity)) {
            level.update(node, this);
        }
        else {
            level.remove(node);
            console.log("changing scene level of entity:", node.entity.id);
            this.insertIntoLevel(node);
        }
    }
    insertIntoLevel(node) {
        for (let level of this._levels) {
            if (level.inrange(node.entity)) {
                level.add(node, this);
                return;
            }
        }
        console.log("creating new SceneLevel");
        this._levels.push(new SceneLevel(node));
    }
    buildLevels() {
        this._levels.forEach((level) => level.buildGraph(this));
    }
}
export class SceneRenderer {
    constructor(_canvas, _graph) {
        this._canvas = _canvas;
        this._graph = _graph;
        this._handler = new TimedEventHandler();
        this._nodes = new Map();
        this._width = _canvas.width;
        this._height = _canvas.height;
        this._ctx = this._canvas.getContext("2d", { alpha: false });
    }
    get ctx() { return this._ctx; }
    get graph() { return this._graph; }
    get nodes() { return this._nodes; }
    getNode(id) {
        console.assert(this.nodes.has(id));
        return this.nodes.get(id);
    }
    addTimedEvent(callback) {
        this._handler.add(callback);
    }
    insertEntity(entity) {
        let node = new SceneNode(entity, this.graph.getDrawCoord(entity.bounds.minLocation));
        this.nodes.set(node.id, node);
        this.graph.insertNode(node);
    }
    updateEntity(entity) {
        console.assert(this._nodes.has(entity.id));
        let node = this._nodes.get(entity.id);
        this.graph.updateNode(node);
    }
    getLocationAt(x, y, camera) {
        let entity = this.getEntityDrawnAt(x, y, camera);
        if (entity != null) {
            return entity.bounds.minLocation;
        }
        return null;
    }
    getEntityDrawnAt(x, y, camera) {
        for (let i = this.graph.levels.length - 1; i >= 0; i--) {
            const level = this.graph.levels[i];
            for (let j = 0; j < level.nodes.length; j++) {
                const node = level.nodes[j];
                const entity = node.entity;
                if (!entity.visible || !entity.drawable) {
                    continue;
                }
                if (!camera.isOnScreen(node.drawCoord, entity.width, entity.depth)) {
                    continue;
                }
                let onScreenCoord = camera.getDrawCoord(node.drawCoord);
                let graphic = entity.graphic;
                if (x < onScreenCoord.x || y < onScreenCoord.y ||
                    x > onScreenCoord.x + graphic.width ||
                    y > onScreenCoord.y + graphic.height) {
                    continue;
                }
                if (!graphic.isTransparentAt(x - onScreenCoord.x, y - onScreenCoord.y)) {
                    return entity;
                }
            }
        }
        return null;
    }
    renderNode(node, camera) {
        const entity = node.entity;
        if (!entity.visible || !entity.drawable) {
            return;
        }
        const width = entity.graphics[0].width;
        const height = entity.graphics[0].height;
        if (camera.isOnScreen(node.drawCoord, width, height)) {
            const coord = camera.getDrawCoord(node.drawCoord);
            entity.graphics.forEach((component) => {
                const spriteId = component.update();
                Sprite.sprites[spriteId].draw(coord, this.ctx);
            });
        }
    }
    ;
    render(camera) {
        if (!this.graph.initialised) {
            let nodeList = new Array();
            for (let node of this._nodes.values()) {
                nodeList.push(node);
            }
            console.log("first render...");
            console.log("inserted nodes into list:", nodeList.length);
            nodeList.sort((a, b) => {
                if (a.minZ < b.minZ)
                    return RenderOrder.Before;
                if (a.minZ > b.minZ)
                    return RenderOrder.After;
                return RenderOrder.Any;
            });
            nodeList.forEach((node) => this.graph.insertIntoLevel(node));
            this.graph.buildLevels();
        }
        this.ctx.clearRect(0, 0, this._width, this._height);
        this.graph.levels.forEach((level) => {
            for (let i = level.order.length - 1; i >= 0; i--) {
                const node = level.order[i];
                this.renderNode(node, camera);
            }
        });
        this._handler.service();
    }
}
export var Perspective;
(function (Perspective) {
    Perspective[Perspective["TrueIsometric"] = 0] = "TrueIsometric";
    Perspective[Perspective["TwoByOneIsometric"] = 1] = "TwoByOneIsometric";
})(Perspective || (Perspective = {}));
export class IsometricPhysicalDimensions extends Dimensions {
    constructor(spriteWidth, relativeDims) {
        let width = IsometricPhysicalDimensions.physicalWidth(spriteWidth);
        let depth = IsometricPhysicalDimensions.physicalDepth(width, relativeDims);
        let height = IsometricPhysicalDimensions.physicalHeight(width, relativeDims);
        super(width, depth, height);
    }
    static physicalWidth(spriteWidth) {
        return Math.round(spriteWidth * this._oneOverSqrt3);
    }
    static physicalDepth(physicalWidth, relativeDims) {
        let depthRatio = relativeDims.depth / relativeDims.width;
        return Math.round(physicalWidth * depthRatio);
    }
    static physicalHeight(physicalWidth, relativeDims) {
        let heightRatio = relativeDims.height / relativeDims.width;
        return Math.round(physicalWidth * heightRatio);
    }
}
IsometricPhysicalDimensions._oneOverSqrt3 = 1 / Math.sqrt(3);
export class TrueIsometric extends SceneGraph {
    constructor() { super(); }
    static getDrawCoord(loc) {
        const dx = Math.round(this._halfSqrt3 * (loc.x + loc.y));
        const dy = Math.round((0.5 * (loc.y - loc.x)) - loc.z);
        return new Point2D(dx, dy);
    }
    getDrawCoord(location) {
        return TrueIsometric.getDrawCoord(location);
    }
    drawOrder(first, second) {
        if (first.overlapX(second)) {
            return first.entity.bounds.minY <= second.entity.bounds.minY ?
                RenderOrder.Before : RenderOrder.After;
        }
        if (first.overlapY(second)) {
            return first.entity.bounds.minX >= second.entity.bounds.minX ?
                RenderOrder.Before : RenderOrder.After;
        }
        if (!first.overlapZ(second)) {
            return RenderOrder.Any;
        }
        if (first.intersectsTop(second)) {
            return RenderOrder.Before;
        }
        if (second.intersectsTop(first)) {
            return RenderOrder.After;
        }
        return RenderOrder.Any;
    }
}
TrueIsometric._sqrt3 = Math.sqrt(3);
TrueIsometric._halfSqrt3 = Math.sqrt(3) * 0.5;
export class TwoByOneIsometric extends SceneGraph {
    constructor() { super(); }
    static getDrawCoord(loc) {
        const dx = Math.round((loc.x + loc.y) * 2 * this._oneOverMagicRatio);
        const dy = Math.round((loc.y - loc.x - loc.z) * this._oneOverMagicRatio);
        return new Point2D(dx, dy);
    }
    static getDimensions(spriteWidth, spriteHeight) {
        const oneUnit = spriteWidth * 0.25;
        const twoUnits = spriteWidth * 0.5;
        const width = oneUnit * this._magicRatio;
        const depth = twoUnits * Math.sin(Math.atan(0.5));
        const height = (spriteHeight - twoUnits) * this._magicRatio;
        return new Dimensions(Math.round(width), Math.round(depth), Math.round(height));
    }
    static drawOrder(first, second) {
        if (first.overlapX(second)) {
            return first.entity.bounds.minY < second.entity.bounds.minY ?
                RenderOrder.Before : RenderOrder.After;
        }
        if (first.overlapY(second)) {
            return first.entity.bounds.minX > second.entity.bounds.minX ?
                RenderOrder.Before : RenderOrder.After;
        }
        if (!first.overlapZ(second)) {
            return RenderOrder.Any;
        }
        if (first.intersectsTop(second)) {
            return RenderOrder.Before;
        }
        if (second.intersectsTop(first)) {
            return RenderOrder.After;
        }
        return RenderOrder.Any;
    }
    getDrawCoord(location) {
        return TwoByOneIsometric.getDrawCoord(location);
    }
    drawOrder(first, second) {
        return TwoByOneIsometric.drawOrder(first, second);
    }
}
TwoByOneIsometric._magicRatio = Math.cos(Math.atan(0.5));
TwoByOneIsometric._oneOverMagicRatio = 1 / Math.cos(Math.atan(0.5));
