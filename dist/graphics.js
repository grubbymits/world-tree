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
        console.log("load", name);
        SpriteSheet.add(this);
    }
    static add(sheet) {
        this._sheets.push(sheet);
    }
    get image() {
        return this._image;
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
    get id() {
        return this._id;
    }
}
Sprite._sprites = new Array();
export class GraphicComponent {
    constructor(_currentSpriteId) {
        this._currentSpriteId = _currentSpriteId;
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
        this._currentSpriteId = Math.floor(Math.random() * (this._endId - this._startId) + this._startId);
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
    get xChild() { return this._xChild; }
    get yChild() { return this._yChild; }
    get zChild() { return this._zChild; }
    get x() { return this._entity.x; }
    get y() { return this._entity.y; }
    get z() { return this._entity.z; }
    get entity() { return this._entity; }
    set xChild(x) { this._xChild = x; }
    set yChild(y) { this._yChild = y; }
    set zChild(z) { this._zChild = z; }
}
export class SceneGraph {
    constructor(_canvas, rootEntity, entities) {
        this._canvas = _canvas;
        this._width = _canvas.width;
        this._height = _canvas.height;
        this._ctx = this._canvas.getContext("2d", { alpha: false });
        this.initDrawCoords(entities);
        this.sortEntitys(entities);
        this._root = new SceneNode(rootEntity);
        let x = this._root.x;
        let y = this._root.y;
        let z = this._root.z;
        console.log("rooting scene at: (x, y, z):", x, y, z);
        for (let i = 1; i < entities.length; i++) {
            let entity = entities[i];
            if (entity == rootEntity) {
                continue;
            }
            this.insertEntity(entities[i]);
        }
    }
    renderEntity(entity, camera) {
        let coord = this.getDrawCoord(entity);
        if (!camera.isOnScreen(coord, entity.width, entity.depth)) {
            return;
        }
        coord = camera.getDrawCoord(coord);
        for (let i in entity.graphics) {
            let component = entity.graphics[i];
            let spriteId = component.update();
            Sprite.sprites[spriteId].draw(coord, this._ctx);
        }
    }
    render(camera) {
        this._ctx.clearRect(0, 0, this._width, this._height);
        let parentNode = this._root;
        let xNode = parentNode.xChild;
        while (xNode != undefined) {
            this.renderEntity(xNode.entity, camera);
            xNode = xNode.xChild;
        }
        let yNode = parentNode.yChild;
        while (yNode != undefined) {
            this.renderEntity(yNode.entity, camera);
            xNode = yNode.xChild;
            while (xNode != undefined) {
                this.renderEntity(xNode.entity, camera);
                let zNode = xNode.zChild;
                while (zNode != undefined) {
                    this.renderEntity(zNode.entity, camera);
                    zNode = zNode.zChild;
                }
                xNode = xNode.xChild;
            }
            yNode = yNode.yChild;
        }
    }
}
export class IsometricRenderer extends SceneGraph {
    constructor(canvas, rootEntity, entities) {
        super(canvas, rootEntity, entities);
    }
    static getDrawCoord(entity) {
        let dx = Math.floor(0.5 * this._sqrt3 * (entity.x + entity.y));
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
    sortEntitys(entities) {
        entities.sort((a, b) => {
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
        });
    }
    insertEntity(entity) {
        let newNode = new SceneNode(entity);
        let parentNode = this._root;
        console.log("insert entity at (x,y,z):", entity.x, entity.y, entity.z);
        while (entity.y > parentNode.y) {
            let childNode = parentNode.yChild;
            if (childNode == undefined) {
                parentNode.yChild = newNode;
                console.log("for parent at (x,y,z)", parentNode.x, parentNode.y, parentNode.z);
                console.log("inserted new y child");
                return;
            }
            parentNode = childNode;
        }
        while (entity.x < parentNode.x) {
            let childNode = parentNode.xChild;
            if (childNode == undefined) {
                console.log("for parent at (x,y,z)", parentNode.x, parentNode.y, parentNode.z);
                console.log("inserted new x child");
                parentNode.xChild = newNode;
                return;
            }
            parentNode = childNode;
        }
        while (entity.z > parentNode.z) {
            let childNode = parentNode.zChild;
            if (childNode == undefined) {
                console.log("for parent at (x,y,z)", parentNode.x, parentNode.y, parentNode.z);
                console.log("inserted new z child");
                parentNode.zChild = newNode;
                return;
            }
            parentNode = childNode;
        }
        console.log("need to place entity between existing nodes...");
        this.insertNode(parentNode, newNode);
    }
    insertNode(parentNode, childNode) {
        if (parentNode.y < childNode.y) {
            if (parentNode.yChild != undefined) {
                childNode.yChild = parentNode.yChild;
            }
            parentNode.yChild = childNode;
        }
        else if (parentNode.x > childNode.x) {
            if (parentNode.xChild != undefined) {
                childNode.xChild = parentNode.xChild;
            }
            parentNode.xChild = childNode;
        }
        else if (parentNode.z < childNode.z) {
            if (parentNode.zChild != undefined) {
                childNode.zChild = parentNode.zChild;
            }
            parentNode.zChild = childNode;
        }
    }
}
IsometricRenderer._sqrt3 = Math.sqrt(3);
