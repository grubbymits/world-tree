import { Point } from "./map.js";
export class Drawable {
    constructor(_x, _y, _z) {
        this._x = _x;
        this._y = _y;
        this._z = _z;
        this._spriteId = 0;
    }
    get x() {
        return this._x;
    }
    get y() {
        return this._y;
    }
    get z() {
        return this._z;
    }
    get spriteId() {
        return this._spriteId;
    }
    set spriteId(id) {
        this._spriteId = id;
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
        console.log("load", name);
    }
    get image() {
        return this._image;
    }
}
export class Sprite {
    constructor(_sheet, _offsetX, _offsetY, _width, _height) {
        this._sheet = _sheet;
        this._offsetX = _offsetX;
        this._offsetY = _offsetY;
        this._width = _width;
        this._height = _height;
    }
    draw(coord, ctx) {
        ctx.drawImage(this._sheet.image, this._offsetX, this._offsetY, this._width, this._height, coord.x, coord.y, this._width, this._height);
    }
}
export class Renderer {
    constructor(_ctx, _width, _height, _tileWidth, _tileHeight, _sprites) {
        this._ctx = _ctx;
        this._width = _width;
        this._height = _height;
        this._tileWidth = _tileWidth;
        this._tileHeight = _tileHeight;
        this._sprites = _sprites;
    }
    clear() {
        this._ctx.fillStyle = '#000000';
        this._ctx.fillRect(0, 0, this._width, this._height);
    }
    draw(coord, id) {
        this._sprites[id].draw(coord, this._ctx);
    }
    drawAll(drawables, camera) {
        this.sortDrawables(drawables);
        for (let i in drawables) {
            let drawable = drawables[i];
            let coord = this.getDrawCoord(drawable);
            coord = new Point(coord.x + camera.x, coord.y + camera.y);
            this.draw(coord, drawable.spriteId);
        }
    }
}
export class CartisanRenderer extends Renderer {
    constructor(ctx, width, height, tileWidth, tileHeight, sprites) {
        super(ctx, width, height, tileWidth, tileHeight, sprites);
    }
    getDrawCoord(drawable) {
        let width = this._tileWidth;
        let height = this._tileHeight;
        return new Point(drawable.x * width, (drawable.y * height) - (drawable.z * height));
    }
    drawFloor(camera, gameMap) {
        for (let y = 0; y < gameMap.height; y++) {
            for (let x = 0; x < gameMap.width; x++) {
                let location = gameMap.getLocation(x, y);
                let coord = this.getDrawCoord(location);
                let newCoord = new Point(coord.x + camera.x, coord.y + camera.y);
                this.draw(newCoord, location.spriteId);
            }
        }
    }
    sortDrawables(drawables) {
        drawables.sort((a, b) => {
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
function convertToIsometric(x, y, width, height) {
    let drawX = Math.floor(x * width / 2) + Math.floor(y * width / 2);
    let drawY = Math.floor(y * height / 2) - Math.floor(x * height / 2);
    return new Point(drawX, drawY);
}
export class IsometricRenderer extends Renderer {
    constructor(ctx, width, height, tileWidth, tileHeight, sprites) {
        super(ctx, width, height, tileWidth, tileHeight, sprites);
    }
    getDrawCoord(drawable) {
        let width = this._tileWidth;
        let height = this._tileHeight;
        let coord = convertToIsometric(drawable.x + drawable.z, drawable.y - drawable.z, width, height);
        return coord;
    }
    drawFloor(camera, gameMap) {
        for (let y = 0; y < gameMap.height; y++) {
            for (let x = gameMap.width - 1; x >= 0; x--) {
                let location = gameMap.getLocation(x, y);
                let coord = this.getDrawCoord(location);
                coord = new Point(coord.x + camera.x, coord.y + camera.y);
                this.draw(coord, location.spriteId);
            }
        }
    }
    sortDrawables(drawables) {
        drawables.sort((a, b) => {
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
