import { Point, CoordSystem } from "./map.js";
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
export function renderRaised(gameMap, camera, sys, gfx) {
    let locations = gameMap.raisedLocations;
    if (sys == CoordSystem.Cartisan) {
        for (let i in locations) {
            let location = locations[i];
            let coord = gameMap.getDrawCoord(location.x, location.y, 0, sys);
            let newCoord = new Point(coord.x + camera.x, coord.y + camera.y);
            gfx.render(newCoord, location.spriteId);
        }
    }
}
export function renderFloor(gameMap, camera, sys, gfx) {
    if (sys == CoordSystem.Cartisan) {
        for (let y = 0; y < gameMap.height; y++) {
            for (let x = 0; x < gameMap.width; x++) {
                let location = gameMap.getLocation(x, y);
                let coord = gameMap.getDrawCoord(x, y, 0, sys);
                let newCoord = new Point(coord.x + camera.x, coord.y + camera.y);
                gfx.render(newCoord, location.spriteId);
            }
        }
    }
    else if (sys == CoordSystem.Isometric) {
        for (let y = 0; y < gameMap.height; y++) {
            for (let x = gameMap.width - 1; x >= 0; x--) {
                let location = gameMap.getLocation(x, y);
                let coord = gameMap.getDrawCoord(x, y, 0, sys);
                let newCoord = new Point(coord.x + camera.x, coord.y + camera.y);
                gfx.render(newCoord, location.spriteId);
            }
        }
    }
    else {
        throw ("invalid coordinate system");
    }
}
