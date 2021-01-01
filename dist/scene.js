import { Point2D, Point3D, Segment2D } from "./geometry.js";
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
        this._preds = new Array();
        this._succs = new Array();
        this._topOutlineSegments = new Array();
        this._sideOutlineSegments = new Array();
        this._baseOutlineSegments = new Array();
        this._drawCoord = new Point2D(0, 0);
        SceneNode.graph.setDrawCoords(this);
    }
    static set graph(g) { this._graph = g; }
    static get graph() { return this._graph; }
    overlapX(other) {
        return (this.entity.bounds.minX >= other.entity.bounds.minX &&
            this.entity.bounds.minX <= other.entity.bounds.maxX) ||
            (this.entity.bounds.maxX >= other.entity.bounds.minX &&
                this.entity.bounds.maxX <= other.entity.bounds.maxX);
    }
    overlapY(other) {
        return (this.entity.bounds.minY >= other.entity.bounds.minY &&
            this.entity.bounds.minY <= other.entity.bounds.maxY) ||
            (this.entity.bounds.maxY >= other.entity.bounds.minY &&
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
    addPred(predId) {
        let idx = this._preds.indexOf(predId);
        if (idx != -1)
            return;
        this._preds.push(predId);
    }
    addSucc(succId) {
        let idx = this._succs.indexOf(succId);
        if (idx != -1)
            return;
        this._succs.push(succId);
    }
    removePred(predId) {
        let idx = this._preds.indexOf(predId);
        if (idx == -1)
            return;
        this._preds.splice(idx, 1);
    }
    removeSucc(succId) {
        let idx = this._succs.indexOf(succId);
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
        idx = this._roots.indexOf(node.id);
        if (idx != -1) {
            this._roots.splice(idx, 1);
        }
    }
    update(node, graph) {
        node.preds.forEach((predId) => {
            if (graph.drawOrder(predId, node.id) != RenderOrder.Before) {
                graph.nodes.get(predId).removeSucc(node.id);
                node.removePred(predId);
            }
        });
        node.succs.forEach((succId) => {
            if (graph.drawOrder(succId, node.id) != RenderOrder.After) {
                node.removeSucc(succId);
                graph.nodes.get(succId).removePred(node.id);
            }
        });
        for (let i = 0; i < this._nodes.length; i++) {
            let existing = this._nodes[i];
            if (existing.id == node.id) {
                continue;
            }
            const order = graph.drawOrder(node.id, existing.id);
            if (RenderOrder.Before == order) {
                node.addSucc(existing.id);
                existing.addPred(node.id);
            }
            else if (RenderOrder.After == order) {
                existing.addSucc(node.id);
                node.addPred(existing.id);
            }
        }
        if (node.isRoot && this._roots.indexOf(node.id) == -1) {
            this._roots.push(node.id);
        }
        this._discovered.clear();
        this._topologicalOrder.length = 0;
        for (let i in this._roots) {
            if (this._discovered.has(this._roots[i])) {
                continue;
            }
            this.topologicalSort(graph, graph.getNode(this._roots[i]));
        }
    }
    buildGraph(graph) {
        console.log("buildGraph of size:", this._nodes.length);
        for (let i = 0; i < this._nodes.length; i++) {
            let nodeI = this._nodes[i];
            for (let j = 0; j < this._nodes.length; j++) {
                if (i == j)
                    continue;
                let nodeJ = this._nodes[j];
                const order = graph.drawOrder(nodeI.id, nodeJ.id);
                if (RenderOrder.Before == order) {
                    nodeI.addSucc(nodeJ.id);
                    nodeJ.addPred(nodeI.id);
                }
                else if (RenderOrder.After == order) {
                    nodeJ.addSucc(nodeI.id);
                    nodeI.addPred(nodeJ.id);
                }
            }
        }
        for (let i in this._nodes) {
            const node = this._nodes[i];
            if (node.preds.length == 0) {
                this._roots.push(node.id);
            }
        }
        this._discovered.clear();
        this._topologicalOrder.length = 0;
        for (let i in this._roots) {
            if (this._discovered.has(this._roots[i])) {
                continue;
            }
            this.topologicalSort(graph, graph.getNode(this._roots[i]));
        }
    }
    topologicalSort(graph, node) {
        this._discovered.add(node.id);
        for (let succId of node.succs) {
            if (this._discovered.has(succId))
                continue;
            this.topologicalSort(graph, graph.getNode(succId));
        }
        this._topologicalOrder.push(node);
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
        SceneNode.graph = this;
    }
    get nodes() { return this._nodes; }
    getNode(id) {
        console.assert(this._nodes.has(id));
        return this._nodes.get(id);
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
                if (a.minZ < b.minZ)
                    return RenderOrder.Before;
                if (a.minZ > b.minZ)
                    return RenderOrder.After;
                return RenderOrder.Any;
            });
            nodeList.forEach((node) => this.insertIntoLevel(node));
            this._levels.forEach((level) => level.buildGraph(this));
        }
        const renderNode = function (node) {
            const entity = node.entity;
            if (!entity.visible) {
                return;
            }
            const width = entity.graphics[0].width;
            const height = entity.graphics[0].height;
            if (camera.isOnScreen(node.drawCoord, width, height)) {
                const coord = camera.getDrawCoord(node.drawCoord);
                entity.graphics.forEach((component) => {
                    const spriteId = component.update();
                    Sprite.sprites[spriteId].draw(coord, ctx);
                });
                if (entity.drawGeometry) {
                    for (const segment of node.allSegments) {
                        ctx.beginPath();
                        let drawP0 = camera.getDrawCoord(segment.p0);
                        let drawP1 = camera.getDrawCoord(segment.p1);
                        ctx.moveTo(drawP0.x, drawP0.y);
                        ctx.lineTo(drawP1.x, drawP1.y);
                        ctx.stroke();
                    }
                }
            }
        };
        let ctx = this._ctx;
        ctx.clearRect(0, 0, this._width, this._height);
        this._levels.forEach((level) => {
            for (let i = level.order.length - 1; i >= 0; i--) {
                const node = level.order[i];
                renderNode(node);
            }
        });
    }
    insertEntity(entity) {
        let node = new SceneNode(entity);
        this._nodes.set(node.id, node);
        if (this._levels.length != 0) {
            this.insertIntoLevel(node);
        }
    }
    updateEntity(entity) {
        console.assert(this._nodes.has(entity.id));
        let node = this._nodes.get(entity.id);
        this.setDrawCoords(node);
        let level = node.level;
        if (level.inrange(node.entity)) {
            level.update(node, this);
        }
        else {
            level.remove(node);
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
                    !camera.isOnScreen(node.drawCoord, entity.width, entity.depth)) {
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
}
export var Perspective;
(function (Perspective) {
    Perspective[Perspective["TrueIsometric"] = 0] = "TrueIsometric";
    Perspective[Perspective["TwoByOneIsometric"] = 1] = "TwoByOneIsometric";
})(Perspective || (Perspective = {}));
export class IsometricRenderer extends SceneGraph {
    constructor(canvas) {
        super(canvas);
    }
    static getDrawCoord(loc) {
        let dx = Math.floor(this._halfSqrt3 * (loc.x + loc.y));
        let dy = Math.floor((0.5 * (loc.y - loc.x)) - loc.z);
        return new Point2D(dx, dy);
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
        const coord = IsometricRenderer.getDrawCoord(entity.bounds.minLocation);
        const adjustedCoord = new Point2D(coord.x, coord.y - drawHeightOffset.y);
        node.drawCoord = adjustedCoord;
    }
    getDrawCoord(location) {
        return IsometricRenderer.getDrawCoord(location);
    }
    drawOrder(firstId, secondId) {
        const first = this._nodes.get(firstId);
        const second = this._nodes.get(secondId);
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
IsometricRenderer._sqrt3 = Math.sqrt(3);
IsometricRenderer._halfSqrt3 = Math.sqrt(3) * 0.5;
export class TwoByOneIsometricRenderer extends IsometricRenderer {
    constructor(canvas) {
        super(canvas);
    }
    static getDrawCoord(loc) {
        let dx = Math.floor(2 * (loc.x + loc.y));
        let dy = Math.floor(loc.y - loc.x - loc.z);
        return new Point2D(dx, dy);
    }
    getDrawCoord(location) {
        return TwoByOneIsometricRenderer.getDrawCoord(location);
    }
}
