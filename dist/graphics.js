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
    constructor(_canvas, _camera, entities) {
        this._canvas = _canvas;
        this._camera = _camera;
        this._nodes = new Map();
        this._width = _canvas.width;
        this._height = _canvas.height;
        this._ctx = this._canvas.getContext("2d", { alpha: false });
        this.initDrawCoords(entities);
        entities.sort(this.drawOrder);
        this._root = new SceneNode(entities[0]);
        this._nodes.set(entities[0], this._root);
        let pred = this._root;
        for (let i = 1; i < entities.length; i++) {
            let entity = entities[i];
            let succ = new SceneNode(entity);
            this._nodes.set(entity, succ);
            pred.succ = succ;
            succ.pred = pred;
            pred = succ;
        }
        this._leaf = pred;
    }
    render() {
        this._ctx.clearRect(0, 0, this._width, this._height);
        let node = this._root;
        while (node != undefined) {
            let entity = node.entity;
            if (entity.visible) {
                let coord = this.getDrawCoord(entity);
                if (this._camera.isOnScreen(coord, entity.width, entity.depth)) {
                    coord = this._camera.getDrawCoord(coord);
                    for (let i in entity.graphics) {
                        let component = entity.graphics[i];
                        let spriteId = component.update();
                        Sprite.sprites[spriteId].draw(coord, this._ctx);
                    }
                }
            }
            node = node.succ;
        }
    }
    getDrawnAt(x, y) {
        console.log("getDrawnAt:", x, y);
        let node = this._leaf;
        while (node != undefined) {
            let entity = node.entity;
            if (entity.visible &&
                this._camera.isOnScreen(entity.drawCoord, entity.width, entity.depth)) {
                let entityDrawCoord = this._camera.getDrawCoord(entity.drawCoord);
                let graphic = entity.graphic;
                if (x < entityDrawCoord.x || y < entityDrawCoord.y ||
                    x > entityDrawCoord.x + graphic.width ||
                    y > entityDrawCoord.y + graphic.height) {
                    node = node.pred;
                    continue;
                }
                if (!graphic.isTransparentAt(x - entityDrawCoord.x, y - entityDrawCoord.y)) {
                    console.log("found entity drawn at:", entityDrawCoord);
                    return entity;
                }
            }
            node = node.pred;
        }
        return null;
    }
    insertEntity(entity) {
        let node = new SceneNode(entity);
        this._nodes.set(entity, node);
        let next = this._root;
        let last = next;
        while (next != undefined) {
            if (this.drawOrder(node.entity, next.entity) == -1) {
                node.pred = next.pred;
                node.succ = next;
                next.pred = node;
                return;
            }
            last = next;
            next = next.succ;
        }
        console.log("inserting node at end");
        last.succ = node;
        node.pred = last;
        this._leaf = node;
    }
}
export class IsometricRenderer extends SceneGraph {
    constructor(canvas, camera, entities) {
        super(canvas, camera, entities);
    }
    static getDrawCoord(entity) {
        let dx = Math.floor(this._halfSqrt3 * (entity.x + entity.y));
        let dy = Math.floor((0.5 * (entity.y - entity.x)) - entity.z);
        return new Point(dx, dy);
    }
    getDrawCoord(entity) {
        if (entity.hasMoved) {
            let coord = IsometricRenderer.getDrawCoord(entity);
            entity.drawCoord = coord;
        }
        return entity.drawCoord;
    }
    initDrawCoords(entities) {
        for (let entity of entities) {
            entity.drawCoord = IsometricRenderer.getDrawCoord(entity);
        }
    }
    drawOrder(a, b) {
        if (a.z > b.z) {
            return 1;
        }
        else if (b.z > a.z) {
            return -1;
        }
        if (a.y > b.y) {
            return 1;
        }
        else if (b.y > a.y) {
            return -1;
        }
        if (a.x < b.x) {
            return 1;
        }
        else if (b.x < a.x) {
            return -1;
        }
        return 0;
    }
}
IsometricRenderer._sqrt3 = Math.sqrt(3);
IsometricRenderer._halfSqrt3 = Math.sqrt(3) * 0.5;
