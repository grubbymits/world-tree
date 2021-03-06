import { Point2D } from "./geometry.js";
import { getDirectionName } from "./physics.js";
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
        let sprite = this;
    }
    static add(sprite) {
        this._sprites.push(sprite);
    }
    static get sprites() {
        return this._sprites;
    }
    draw(coord, ctx) {
        ctx.drawImage(this._sheet.image, this._spriteOffset.x, this._spriteOffset.y, this._width, this._height, coord.x, coord.y, this._width, this._height);
    }
    isTransparentAt(x, y) {
        x += this._spriteOffset.x;
        y += this._spriteOffset.y;
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
        console.assert(typeof (this._currentSpriteId) == "number", "spriteId not a number");
        console.assert(this._currentSpriteId > -1 &&
            this._currentSpriteId < Sprite.sprites.length, "spriteId not in range:", this._currentSpriteId);
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
export class AnimatedGraphicComponent extends GraphicComponent {
    constructor(sprites, _interval) {
        super(sprites[0].id);
        this._interval = _interval;
        this._nextUpdate = 0;
        this._currentSpriteIdx = 0;
        this._spriteIds = new Array();
        for (let i in sprites) {
            this._spriteIds.push(sprites[i].id);
        }
        this._nextUpdate = Date.now() + _interval;
    }
    update() {
        return this._spriteIds[this._currentSpriteIdx];
    }
    get firstId() { return this._spriteIds[0]; }
    get lastId() {
        return this._spriteIds[this._spriteIds.length - 1];
    }
    get currentSpriteId() {
        console.assert(this._currentSpriteIdx >= 0);
        console.assert(this._currentSpriteIdx < this._spriteIds.length);
        return this._spriteIds[this._currentSpriteIdx];
    }
}
export class OssilateGraphicComponent extends AnimatedGraphicComponent {
    constructor(sprites, interval) {
        super(sprites, interval);
        this._increase = true;
        this._currentSpriteIdx =
            Math.floor(Math.random() * (this._spriteIds.length - 1));
    }
    update() {
        if (this._nextUpdate > Date.now()) {
            return this.currentSpriteId;
        }
        if (this._currentSpriteIdx == this._spriteIds.length - 1) {
            this._increase = false;
        }
        else if (this._currentSpriteIdx == 0) {
            this._increase = true;
        }
        if (this._increase) {
            this._currentSpriteIdx++;
        }
        else {
            this._currentSpriteIdx--;
        }
        this._nextUpdate = Date.now() + this._interval;
        return this.currentSpriteId;
    }
}
export class LoopGraphicComponent extends AnimatedGraphicComponent {
    constructor(sprites, interval) {
        super(sprites, interval);
        this._currentSpriteIdx = 0;
    }
    update() {
        if (this._nextUpdate > Date.now()) {
            return this.currentSpriteId;
        }
        this._currentSpriteIdx = (this._currentSpriteIdx + 1) % this._spriteIds.length;
        this._nextUpdate = Date.now() + this._interval;
        return this.currentSpriteId;
    }
}
export class DirectionalGraphicComponent extends GraphicComponent {
    constructor(_staticGraphics, _movementGraphics) {
        super(0);
        this._staticGraphics = _staticGraphics;
        this._movementGraphics = _movementGraphics;
        this._stationary = true;
    }
    get stationary() { return this._stationary; }
    get direction() { return this._direction; }
    set stationary(stationary) { this._stationary = stationary; }
    set direction(direction) {
        if (!this._staticGraphics.has(direction) ||
            !this._movementGraphics.has(direction)) {
            console.log("graphic direction unsupported");
        }
        this._direction = direction;
    }
    update() {
        if (!this.stationary && this._movementGraphics.has(this.direction)) {
            const spriteId = this._movementGraphics.get(this.direction).update();
            return spriteId;
        }
        if (this.stationary && this._staticGraphics.has(this.direction)) {
            const component = this._staticGraphics.get(this.direction);
            const spriteId = component.update();
            return spriteId;
        }
        if (this.stationary) {
            console.error("unhandled stationary graphic:", getDirectionName(this.direction));
        }
        else {
            console.error("unhandled movement graphic:", getDirectionName(this.direction));
        }
        return 0;
    }
}
