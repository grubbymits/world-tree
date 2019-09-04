export class SpriteSheet {
    constructor(name) {
        this._image = new Image();
        this._ready = false;
        if (name) {
            this._image.src = "res/img/" + name + ".png";
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
    render(coord, ctx) {
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
    render(coord, id) {
        this._sprites[id].render(coord, this._ctx);
    }
}
