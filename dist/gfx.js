import { Point } from "./map.js";
export var CoordSystem;
(function (CoordSystem) {
    CoordSystem[CoordSystem["Cartisan"] = 0] = "Cartisan";
    CoordSystem[CoordSystem["Isometric"] = 1] = "Isometric";
})(CoordSystem || (CoordSystem = {}));
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
export class GraphicsComponent {
    constructor(_currentSpriteId) {
        this._currentSpriteId = _currentSpriteId;
    }
}
export class StaticGraphicsComponent extends GraphicsComponent {
    constructor(id) {
        super(id);
    }
    update() {
        return this._currentSpriteId;
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
    drawAll(objects, camera) {
        this.sortGameObjects(objects);
        for (let i in objects) {
            let gameObj = objects[i];
            let coord = this.getDrawCoord(gameObj);
            coord = new Point(coord.x + camera.x, coord.y + camera.y);
            let spriteId = gameObj.graphicsComponent.update();
            this.draw(coord, spriteId);
        }
    }
}
export class CartisanRenderer extends Renderer {
    constructor(ctx, width, height, tileWidth, tileHeight, sprites) {
        super(ctx, width, height, tileWidth, tileHeight, sprites);
    }
    getDrawCoord(object) {
        let width = this._tileWidth;
        let height = this._tileHeight;
        return new Point(object.x * width, (object.y * height) - (object.z * height));
    }
    drawFloor(camera, gameMap) {
        for (let y = 0; y < gameMap.height; y++) {
            for (let x = 0; x < gameMap.width; x++) {
                let gameObj = gameMap.getFloor(x, y);
                let coord = this.getDrawCoord(gameObj);
                let newCoord = new Point(coord.x + camera.x, coord.y + camera.y);
                let spriteId = gameObj.graphicsComponent.update();
                this.draw(newCoord, spriteId);
            }
        }
    }
    sortGameObjects(objects) {
        objects.sort((a, b) => {
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
    getDrawCoord(object) {
        let width = this._tileWidth;
        let height = this._tileHeight;
        let coord = convertToIsometric(object.x + object.z, object.y - object.z, width, height);
        return coord;
    }
    drawFloor(camera, gameMap) {
        for (let y = 0; y < gameMap.height; y++) {
            for (let x = gameMap.width - 1; x >= 0; x--) {
                let gameObj = gameMap.getFloor(x, y);
                let coord = this.getDrawCoord(gameObj);
                coord = new Point(coord.x + camera.x, coord.y + camera.y);
                let spriteId = gameObj.graphicsComponent.update();
                this.draw(coord, spriteId);
            }
        }
    }
    sortGameObjects(objects) {
        objects.sort((a, b) => {
            let locA = a.location;
            let locB = a.location;
            if (locA.z > locB.z) {
                return 1;
            }
            else if (locB.z > locA.z) {
                return -1;
            }
            if (locA.y > locB.y) {
                return 1;
            }
            else if (locB.y > locA.y) {
                return -1;
            }
            if (locA.x < locB.x) {
                return 1;
            }
            else if (locB.x < locA.x) {
                return -1;
            }
            return 0;
        });
    }
}
