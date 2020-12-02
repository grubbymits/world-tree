import { Point2D } from "./geometry.js";
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
        this._spriteOffset = new Point2D(offsetX, offsetY);
        this._sheet = _sheet;
        Sprite.add(this);
        this._drawOffset = new Point2D(0, _height - 1);
        let sprite = this;
        this._sheet.image.addEventListener('load', function () {
            for (let x = 0; x < _width; x++) {
                for (let y = _height - 1; y >= 0; y--) {
                    if (!sprite.isTransparentAt(x, y)) {
                        sprite._drawOffset = new Point2D(x, y - _height);
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
