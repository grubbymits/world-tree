export class Point {
    constructor(_x, _y) {
        this._x = _x;
        this._y = _y;
    }
    get x() { return this._x; }
    get y() { return this._y; }
    add(other) {
        return new Point(this.x + other.x, this.y + other.y);
    }
    sub(other) {
        return new Point(this.x - other.x, this.y - other.y);
    }
}
export class SpriteSheet {
    constructor(name) {
        this._image = new Image();
        if (name) {
            this._image.src = name + ".png";
        }
        else {
            throw new Error("No filename passed");
        }
        SpriteSheet.add(this);
        let sheet = this;
        this._image.onload = function () {
            console.log("loaded:", sheet.image.src);
            sheet.canvas = document.createElement('canvas');
            let width = sheet.width;
            let height = sheet.height;
            sheet.canvas.width = width;
            sheet.canvas.height = height;
            sheet.canvas.getContext('2d').drawImage(sheet.image, 0, 0, width, height);
        };
    }
    static add(sheet) {
        this._sheets.push(sheet);
    }
    get image() { return this._image; }
    get width() { return this._image.width; }
    get height() { return this._image.height; }
    get canvas() { return this._canvas; }
    set canvas(c) { this._canvas = c; }
    isTransparentAt(x, y) {
        let data = this._canvas.getContext('2d').getImageData(x, y, 1, 1).data;
        return data[3] == 0;
    }
}
SpriteSheet._sheets = new Array();
export class Sprite {
    constructor(_sheet, offsetX, offsetY, _width, _height) {
        this._sheet = _sheet;
        this._width = _width;
        this._height = _height;
        this._id = Sprite.sprites.length;
        this._spriteOffset = new Point(offsetX, offsetY);
        this._sheet = _sheet;
        Sprite.add(this);
        this._drawOffset = new Point(0, _height - 1);
        let sprite = this;
        this._sheet.image.addEventListener('load', function () {
            for (let x = 0; x < _width; x++) {
                for (let y = _height - 1; y >= 0; y--) {
                    if (!sprite.isTransparentAt(x, y)) {
                        sprite._drawOffset = new Point(x, y - _height);
                        console.log("set draw offset:", sprite._drawOffset);
                        return;
                    }
                }
            }
        });
    }
    static add(sprite) {
        this._sprites.push(sprite);
    }
    static get sprites() {
        return this._sprites;
    }
    draw(coord, ctx) {
        ctx.drawImage(this._sheet.image, this._spriteOffset.x, this._spriteOffset.y, this._width, this._height, coord.x + this.drawOffset.x, coord.y + this.drawOffset.y, this._width, this._height);
    }
    isTransparentAt(x, y) {
        x += this._spriteOffset.x;
        y += this._spriteOffset.y;
        return this._sheet.isTransparentAt(x, y);
    }
    get id() { return this._id; }
    get width() { return this._width; }
    get height() { return this._height; }
    get drawOffset() { return this._drawOffset; }
    set drawOffset(offset) { this._drawOffset = offset; }
}
Sprite._sprites = new Array();
export class GraphicComponent {
    constructor(_currentSpriteId) {
        this._currentSpriteId = _currentSpriteId;
    }
    isTransparentAt(x, y) {
        return Sprite.sprites[this._currentSpriteId].isTransparentAt(x, y);
    }
    get width() {
        return Sprite.sprites[this._currentSpriteId].width;
    }
    get height() {
        return Sprite.sprites[this._currentSpriteId].height;
    }
    get offset() {
        return Sprite.sprites[this._currentSpriteId].drawOffset;
    }
}
export class StaticGraphicComponent extends GraphicComponent {
    constructor(id) {
        super(id);
    }
    update() {
        return this._currentSpriteId;
    }
}
export class OssilateGraphicComponent extends GraphicComponent {
    constructor(sprites, _interval) {
        super(sprites[0].id);
        this._interval = _interval;
        this._increase = true;
        this._startId = 0;
        this._endId = 0;
        this._nextUpdate = 0;
        this._startId = sprites[0].id;
        this._endId = sprites[sprites.length - 1].id;
        this._currentSpriteId =
            Math.floor(Math.random() * (this._endId - this._startId) + this._startId);
        this._nextUpdate = Date.now() + _interval;
    }
    update() {
        if (this._nextUpdate > Date.now()) {
            return this._currentSpriteId;
        }
        if (this._increase) {
            if (this._currentSpriteId != this._endId) {
                this._currentSpriteId++;
            }
            else {
                this._increase = false;
            }
        }
        else if (this._currentSpriteId != this._startId) {
            this._currentSpriteId--;
        }
        else {
            this._increase = true;
        }
        this._nextUpdate = Date.now() + this._interval;
        return this._currentSpriteId;
    }
}
class SceneNode {
    constructor(_entity) {
        this._entity = _entity;
        this._succ = null;
        this._pred = null;
    }
    get x() { return this._entity.x; }
    get y() { return this._entity.y; }
    get z() { return this._entity.z; }
    get entity() { return this._entity; }
    get pred() { return this._pred; }
    get succ() { return this._succ; }
    set succ(s) { this._succ = s; }
    set pred(p) { this._pred = p; }
}
export class SceneGraph {
    constructor(_canvas) {
        this._canvas = _canvas;
        this._nodes = new Map();
        this._width = _canvas.width;
        this._height = _canvas.height;
        this._ctx = this._canvas.getContext("2d", { alpha: false });
    }
    dump() {
        console.log("scene graph contains number node:", this._nodes.size);
        console.log("draw order:");
        let node = this._root;
        while (node != null) {
            console.log(node.x, node.y, node.z);
            node = node.succ;
        }
    }
    renderGeometry(entity, camera) {
        let points = entity.geometry.points;
        let first = points[0];
        let coord = camera.getDrawCoord(this.getDrawCoord(first));
        this._ctx.strokeStyle = "#FF0000";
        this._ctx.beginPath();
        this._ctx.moveTo(coord.x, coord.y);
        for (let i = 1; i < points.length; i++) {
            coord = camera.getDrawCoord(this.getDrawCoord(points[i]));
            this._ctx.lineTo(coord.x, coord.y);
        }
        this._ctx.stroke();
    }
    render(camera) {
        this._ctx.clearRect(0, 0, this._width, this._height);
        let node = this._root;
        while (node != null) {
            let entity = node.entity;
            if (camera.isOnScreen(entity.drawCoord, entity.width, entity.depth) &&
                entity.visible) {
                let coord = camera.getDrawCoord(entity.drawCoord);
                for (let i in entity.graphics) {
                    let component = entity.graphics[i];
                    let spriteId = component.update();
                    Sprite.sprites[spriteId].draw(coord, this._ctx);
                }
                if (entity.drawGeometry) {
                    this.renderGeometry(entity, camera);
                }
            }
            node = node.succ;
        }
    }
    getLocationAt(x, y, camera) {
        let entity = this.getEntityDrawnAt(x, y, camera);
        if (entity != null) {
            return entity.bounds.minLocation;
        }
        return null;
    }
    getEntityDrawnAt(x, y, camera) {
        let node = this._leaf;
        while (node != null && node != undefined) {
            let entity = node.entity;
            if (entity.visible &&
                camera.isOnScreen(entity.drawCoord, entity.width, entity.depth)) {
                let entityDrawCoord = camera.getDrawCoord(entity.drawCoord);
                let graphic = entity.graphic;
                if (x < entityDrawCoord.x || y < entityDrawCoord.y ||
                    x > entityDrawCoord.x + graphic.width ||
                    y > entityDrawCoord.y + graphic.height) {
                    node = node.pred;
                    continue;
                }
                if (!graphic.isTransparentAt(x - entityDrawCoord.x, y - entityDrawCoord.y)) {
                    return entity;
                }
            }
            node = node.pred;
        }
        return null;
    }
    insertEntity(entity) {
        this.setDrawCoord(entity);
        let node = new SceneNode(entity);
        this._nodes.set(entity, node);
        if (this._root == undefined) {
            console.log("set initial root of the scene");
            this._root = node;
            this._leaf = node;
            this._root.pred = null;
            this._root.succ = null;
            return;
        }
        return this.insertNode(node);
    }
    insertNode(node) {
        if (this.drawBefore(node.entity, this._root.entity)) {
            return this.insertBefore(node, this._root);
        }
        if (this.drawBefore(this._leaf.entity, node.entity)) {
            return this.insertAfter(node, this._leaf);
        }
        let existing = this._root.succ;
        while (existing != null) {
            if (this.drawBefore(node.entity, existing.entity)) {
                this.insertBefore(node, existing);
                console.assert(this._root.pred == null, "expected root to have no predecessor");
                console.assert(this._leaf.succ == null, "expected leaf to have no successor", this._leaf.entity.id);
                return;
            }
            existing = existing.succ;
        }
        console.error("unable to insert entity into scene graph");
        console.log("entity at", node.entity.x, node.entity.y, node.entity.z);
        console.log("current leaf at:", this._leaf.entity.x, this._leaf.entity.y, this._leaf.entity.z);
    }
    insert(first, second, third) {
        first.succ = second;
        second.pred = first;
        second.succ = third;
        third.pred = second;
        let verifyChainMap = new Map();
        let node = this._root;
        let numFound = 0;
        while (node != null) {
            console.assert(!verifyChainMap.has(node.entity.id), "node accessible more than once!");
            verifyChainMap.set(node, true);
            node = node.succ;
            numFound++;
        }
        if (numFound == this._nodes.size) {
        }
        else {
            console.error("unsuccessful insertion, only found", numFound, "out of a total", this._nodes.size);
        }
    }
    insertBefore(node, succ) {
        let first = succ.pred;
        let second = node;
        let third = succ;
        if (first == null) {
            console.assert(succ.entity.id == this._root.entity.id, "expected root node");
            console.log("updating root scene node:", node.entity.id);
            this._root = node;
            this._root.pred = null;
            this._root.succ = succ;
            succ.pred = this._root;
        }
        else {
            this.insert(first, second, third);
        }
    }
    insertAfter(node, pred) {
        let first = pred;
        let second = node;
        let third = pred.succ;
        if (third == null) {
            console.assert(pred.entity.id == this._leaf.entity.id, "expected leaf node");
            console.log("updating leaf scene node:", node.entity.id);
            this._leaf = node;
            this._leaf.succ = null;
            this._leaf.pred = pred;
            pred.succ = this._leaf;
        }
        else {
            this.insert(first, second, third);
        }
    }
    remove(node) {
        if (node.pred == null) {
            this._root = node.succ;
            this._root.pred = null;
        }
        else if (node.succ == null) {
            this._leaf = node.pred;
            this._leaf.succ = null;
        }
        else {
            let first = node.pred;
            let second = node.succ;
            first.succ = second;
            second.pred = first;
        }
    }
    updateEntity(entity) {
        console.assert(this._nodes.has(entity), "entity not in node map");
        this.setDrawCoord(entity);
        let node = this._nodes.get(entity);
        this.remove(node);
        this.insertNode(node);
        return;
        let pred = node.pred;
        let succ = node.succ;
        let drawBeforeSucc = succ != null && this.drawBefore(entity, succ.entity);
        let drawAfterPred = pred != null && this.drawBefore(pred.entity, entity);
        if (drawAfterPred && drawBeforeSucc ||
            pred == null && drawBeforeSucc ||
            succ == null && drawAfterPred) {
            console.log("no update needed");
            return;
        }
        if (pred != null && !drawAfterPred) {
            while (pred != null) {
                if (this.drawBefore(entity, pred.entity)) {
                    return this.insertBefore(node, pred);
                }
                pred = pred.pred;
            }
            return this.insertBefore(node, this._root);
        }
        else if (succ != null && !drawBeforeSucc) {
            while (succ != null) {
                if (this.drawBefore(entity, succ.entity)) {
                    return this.insertBefore(node, succ);
                }
                succ = succ.succ;
            }
            return this.insertAfter(node, this._leaf);
        }
        console.error("didn't update scene graph");
    }
}
export class IsometricRenderer extends SceneGraph {
    constructor(canvas) {
        super(canvas);
    }
    static getDrawCoord(loc) {
        let dx = Math.floor(this._halfSqrt3 * (loc.x + loc.y));
        let dy = Math.floor((0.5 * (loc.y - loc.x)) - loc.z);
        return new Point(dx, dy);
    }
    setDrawCoord(entity) {
        let coord = IsometricRenderer.getDrawCoord(entity.bounds.minLocation);
        entity.drawCoord = new Point(coord.x, coord.y - entity.depth);
    }
    getDrawCoord(location) {
        return IsometricRenderer.getDrawCoord(location);
    }
    drawBefore(first, second) {
        let sameX = first.x == second.x;
        let sameY = first.y == second.y;
        let sameZ = first.z == second.z;
        if (first.bounds.maxY < second.bounds.minY) {
            return true;
        }
        if (first.bounds.minX > second.bounds.minX) {
            return true;
        }
        if (first.bounds.maxZ < second.bounds.minZ) {
            return true;
        }
        if (sameX && sameY) {
            return first.bounds.minZ < second.bounds.minZ;
        }
        return false;
        return first.bounds.minY < second.bounds.minY &&
            first.bounds.minX > second.bounds.minX &&
            first.bounds.minZ < second.bounds.minZ;
        return false;
    }
}
IsometricRenderer._sqrt3 = Math.sqrt(3);
IsometricRenderer._halfSqrt3 = Math.sqrt(3) * 0.5;
