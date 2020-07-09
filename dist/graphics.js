export class Point {
    constructor(_x, _y) {
        this._x = _x;
        this._y = _y;
    }
    get x() { return this._x; }
    get y() { return this._y; }
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
    constructor(_sheet, _offsetX, _offsetY, _width, _height) {
        this._sheet = _sheet;
        this._offsetX = _offsetX;
        this._offsetY = _offsetY;
        this._width = _width;
        this._height = _height;
        this._id = Sprite.sprites.length;
        Sprite.add(this);
    }
    static add(sprite) {
        this._sprites.push(sprite);
    }
    static get sprites() {
        return this._sprites;
    }
    draw(coord, ctx) {
        ctx.drawImage(this._sheet.image, this._offsetX, this._offsetY, this._width, this._height, coord.x, coord.y, this._width, this._height);
    }
    isTransparentAt(x, y) {
        x += this._offsetX;
        y += this._offsetY;
        return this._sheet.isTransparentAt(x, y);
    }
    get id() { return this._id; }
    get width() { return this._width; }
    get height() { return this._height; }
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
        while (node != undefined) {
            console.log(node.x, node.y, node.z);
            node = node.succ;
        }
    }
    render(camera) {
        this._ctx.clearRect(0, 0, this._width, this._height);
        let node = this._root;
        while (node != undefined) {
            let entity = node.entity;
            if (camera.isOnScreen(entity.drawCoord, entity.width, entity.depth) &&
                entity.visible) {
                let coord = camera.getDrawCoord(entity.drawCoord);
                for (let i in entity.graphics) {
                    let component = entity.graphics[i];
                    let spriteId = component.update();
                    Sprite.sprites[spriteId].draw(coord, this._ctx);
                }
            }
            node = node.succ;
        }
    }
    getLocationAt(x, y, camera) {
        let entity = this.getEntityDrawnAt(x, y, camera);
        if (entity != undefined) {
            return entity.bounds.minLocation;
        }
        return null;
    }
    getEntityDrawnAt(x, y, camera) {
        let node = this._leaf;
        while (node != undefined) {
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
            return;
        }
        let existing = this._root;
        while (existing != undefined) {
            if (this.drawOrder(existing.entity, node.entity) == -1) {
                if (existing == this._root) {
                    this._root = node;
                    this._root.succ = existing;
                    existing.pred = this._root;
                }
                else {
                    let first = existing.pred;
                    let second = node;
                    let third = existing;
                    first.succ = second;
                    second.pred = first;
                    second.succ = third;
                    third.pred = second;
                }
                return;
            }
            existing = existing.succ;
        }
        let last = this._leaf;
        this._leaf = node;
        last.succ = this._leaf;
        this._leaf.pred = last;
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
        entity.drawCoord =
            IsometricRenderer.getDrawCoord(entity.bounds.minLocation);
    }
    getDrawCoord(location) {
        return IsometricRenderer.getDrawCoord(location);
    }
    drawOrder(first, second) {
        let sameX = first.x == second.x;
        let sameY = first.y == second.y;
        let sameZ = first.z == second.z;
        if (sameX) {
            if (sameY) {
                return first.z < second.z ? 1 : -1;
            }
            else {
                return first.y < second.y ? 1 : -1;
            }
        }
        return first.x > second.x ? 1 : -1;
    }
}
IsometricRenderer._sqrt3 = Math.sqrt(3);
IsometricRenderer._halfSqrt3 = Math.sqrt(3) * 0.5;
