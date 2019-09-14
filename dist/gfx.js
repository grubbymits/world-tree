import { Point } from "./map.js";
export class Drawable {
    constructor(_x, _y, _z, _drawPoint) {
        this._x = _x;
        this._y = _y;
        this._z = _z;
        this._drawPoint = _drawPoint;
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
    get drawPoint() {
        return this._drawPoint;
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
    constructor(_ctx, _width, _height, _sprites) {
        this._ctx = _ctx;
        this._width = _width;
        this._height = _height;
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
        for (let i in drawables) {
            let drawable = drawables[i];
            let coord = new Point(drawable.drawPoint.x + camera.x, drawable.drawPoint.y + camera.y);
            this.draw(coord, drawable.spriteId);
        }
    }
}
