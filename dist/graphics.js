export var CoordSystem;
(function (CoordSystem) {
    CoordSystem[CoordSystem["Cartisan"] = 0] = "Cartisan";
    CoordSystem[CoordSystem["Isometric"] = 1] = "Isometric";
})(CoordSystem || (CoordSystem = {}));
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
export class Renderer {
    constructor(_canvas) {
        this._canvas = _canvas;
        this._width = _canvas.width;
        this._height = _canvas.height;
        this._ctx = this._canvas.getContext("2d", { alpha: false });
    }
    render(entities, camera) {
        this.sortEntitys(entities);
        this._ctx.clearRect(0, 0, this._width, this._height);
        for (let i in entities) {
            let entity = entities[i];
            let coord;
            if (entity.static) {
                let staticEntity = (entity);
                coord = staticEntity.drawCoord;
            }
            else {
                coord = this.getDrawCoord(entity);
            }
            if (!camera.isOnScreen(coord, entity.width, entity.depth)) {
                continue;
            }
            coord = camera.getDrawCoord(coord);
            let spriteId = entity.graphicsComponent.update();
            Sprite.sprites[spriteId].draw(coord, this._ctx);
        }
    }
}
export class CartisanRenderer extends Renderer {
    constructor(canvas) {
        super(canvas);
    }
    static getDrawCoord(entity) {
        return new Point(entity.x, entity.y - entity.z);
    }
    getDrawCoord(entity) {
        return CartisanRenderer.getDrawCoord(entity);
    }
    sortEntitys(entities) {
        entities.sort((a, b) => {
            if (a.z < b.z) {
                return 1;
            }
            else if (b.z < a.z) {
                return -1;
            }
            if (a.y < b.y) {
                return 1;
            }
            else if (b.y < a.y) {
                return -1;
            }
            return 0;
        });
    }
}
export class IsometricRenderer extends Renderer {
    constructor(canvas) {
        super(canvas);
    }
    static getDrawCoord(entity) {
        let dx = Math.floor(0.5 * Math.sqrt(3) * (entity.x + entity.y));
        let dy = Math.floor(0.5 * (entity.y - entity.x));
        return new Point(dx, dy);
    }
    getDrawCoord(entity) {
        return IsometricRenderer.getDrawCoord(entity);
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
}
