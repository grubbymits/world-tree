import { Point2D } from "./geometry.js";
import { getDirectionName, Direction } from "./physics.js";
export var DummySpriteSheet = {
    addForValidation: function (sprite) { return true; }
};
export class SpriteSheet {
    constructor(name) {
        this._loaded = false;
        this._toValidate = new Array();
        this._image = new Image();
        if (name) {
            this._image.src = name + ".png";
        }
        else {
            throw new Error("No filename passed");
        }
        SpriteSheet.add(this);
        this._image.onload = () => {
            this.canvas = document.createElement('canvas');
            this.canvas.width = this.width;
            this.canvas.height = this.height;
            this.canvas.getContext('2d').drawImage(this.image, 0, 0, this.width, this.height);
            console.log("loaded spritesheet (WxH):", this.width, this.height);
            this.loaded = true;
            for (let sprite of this._toValidate) {
                sprite.validate();
            }
        };
    }
    static add(sheet) {
        this._sheets.push(sheet);
    }
    static reset() {
        this._sheets = new Array();
    }
    get image() { return this._image; }
    get width() { return this._image.width; }
    get height() { return this._image.height; }
    get name() { return this._image.src; }
    get loaded() { return this._loaded; }
    set loaded(b) { this._loaded = b; }
    get canvas() { return this._canvas; }
    set canvas(c) { this._canvas = c; }
    isTransparentAt(x, y) {
        let data = this.canvas.getContext('2d').getImageData(x, y, 1, 1).data;
        return data[3] == 0;
    }
    addForValidation(sprite) {
        this._toValidate.push(sprite);
    }
}
SpriteSheet._sheets = new Array();
export class Sprite {
    constructor(_sheet, offsetX, offsetY, _width, _height) {
        this._sheet = _sheet;
        this._width = _width;
        this._height = _height;
        console.assert(offsetX >= 0, "offsetX < 0");
        console.assert(offsetY >= 0, "offsetY < 0");
        this._id = Sprite.sprites.length;
        this._spriteOffset = new Point2D(offsetX, offsetY);
        this._maxOffset = new Point2D(this.offset.x + this.width, this.offset.y + this.height);
        Sprite.add(this);
        if (this.sheet.loaded) {
            this.validate();
        }
        else {
            this.sheet.addForValidation(this);
        }
    }
    static reset() {
        this._sprites = new Array();
    }
    static add(sprite) {
        this._sprites.push(sprite);
    }
    static get sprites() {
        return this._sprites;
    }
    draw(coord, ctx) {
        ctx.drawImage(this.sheet.image, this.offset.x, this.offset.y, this.width, this.height, coord.x, coord.y, this.width, this.height);
    }
    validate() {
        console.assert(this.maxOffset.x <= this.sheet.width, "sprite id:", this.id, "sprite max X offset too large", this.maxOffset.x);
        console.assert(this.maxOffset.y <= this.sheet.height, "sprite id:", this.id, "sprite max Y offset too large", this.maxOffset.y);
    }
    isTransparentAt(x, y) {
        x += this.offset.x;
        y += this.offset.y;
        return this.sheet.isTransparentAt(x, y);
    }
    get id() { return this._id; }
    get width() { return this._width; }
    get height() { return this._height; }
    get sheet() { return this._sheet; }
    get offset() { return this._spriteOffset; }
    get maxOffset() { return this._maxOffset; }
}
Sprite._sprites = new Array();
export function generateSprites(sheet, width, height, xBegin, yBegin, columns, rows) {
    var sprites = new Array();
    const xEnd = xBegin + columns;
    const yEnd = yBegin + rows;
    for (let y = yBegin; y < yEnd; y++) {
        for (let x = xBegin; x < xEnd; x++) {
            sprites.push(new Sprite(sheet, x * width, y * height, width, height));
        }
    }
    return sprites;
}
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
export function generateStaticGraphics(sheet, width, height, xBegin, yBegin, columns, rows) {
    var graphics = new Array();
    const xEnd = xBegin + columns;
    const yEnd = yBegin + rows;
    for (let y = yBegin; y < yEnd; y++) {
        for (let x = xBegin; x < xEnd; x++) {
            const sprite = new Sprite(sheet, x * width, y * height, width, height);
            graphics.push(new StaticGraphicComponent(sprite.id));
        }
    }
    return graphics;
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
    constructor(_staticGraphics) {
        super(0);
        this._staticGraphics = _staticGraphics;
        this._direction = Direction.North;
    }
    get direction() { return this._direction; }
    set direction(direction) {
        if (this._staticGraphics.has(direction)) {
            this._direction = direction;
        }
        else {
            console.log("graphic direction unsupported");
        }
    }
    update() {
        if (this._staticGraphics.has(this.direction)) {
            const component = this._staticGraphics.get(this.direction);
            const spriteId = component.update();
            return spriteId;
        }
        console.error("unhandled stationary graphic:", getDirectionName(this.direction));
        return 0;
    }
}
export class AnimatedDirectionalGraphicComponent extends GraphicComponent {
    constructor(_staticGraphics, _movementGraphics) {
        super(0);
        this._staticGraphics = _staticGraphics;
        this._movementGraphics = _movementGraphics;
        this._stationary = true;
        this._direction = Direction.North;
    }
    get stationary() { return this._stationary; }
    get direction() { return this._direction; }
    set stationary(stationary) { this._stationary = stationary; }
    set direction(direction) {
        if (this._staticGraphics.has(direction) && this._movementGraphics.has(direction)) {
            this._direction = direction;
        }
        else {
            console.log("graphic direction unsupported");
        }
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
