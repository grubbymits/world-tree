import { Point } from "./map.js";
import { Terrain } from "./terrain.js";
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
    constructor(_canvas, _sprites) {
        this._canvas = _canvas;
        this._sprites = _sprites;
        this._visible = this._canvas.getContext("2d", { alpha: false });
        this._width = _canvas.width;
        this._height = _canvas.height;
        this._offscreenCanvas = document.createElement('canvas');
        this._offscreenCanvas.width = this._width;
        this._offscreenCanvas.height = this._height;
        this._ctx = this._offscreenCanvas.getContext("2d", { alpha: false });
    }
    draw(coord, id) {
        this._sprites[id].draw(coord, this._ctx);
    }
    drawObject(gameObj, camera) {
        let coord = this.getDrawCoord(gameObj);
        if (!camera.isOnScreen(coord)) {
            return;
        }
        coord = camera.getDrawCoord(coord);
        let spriteId = gameObj.graphicsComponent.update();
        this.draw(coord, spriteId);
    }
    drawAll(objects, camera) {
        this.sortGameObjects(objects);
        for (let i in objects) {
            this.drawObject(objects[i], camera);
        }
    }
    update(objects, gameMap, camera) {
        this._ctx.clearRect(0, 0, this._width, this._height);
        this.drawFloor(gameMap, camera);
        this.drawAll(objects, camera);
    }
    render() {
        this._visible.drawImage(this._offscreenCanvas, 0, 0);
    }
}
export class CartisanRenderer extends Renderer {
    constructor(canvas, sprites) {
        super(canvas, sprites);
    }
    getDrawCoord(object) {
        return new Point(object.x, object.y - object.z);
    }
    drawFloor(gameMap, camera) {
        for (let y = 0; y < gameMap.height; y++) {
            for (let x = 0; x < gameMap.width; x++) {
                let gameObj = gameMap.getFloor(x, y);
                let coord = this.getDrawCoord(gameObj);
                coord = camera.getDrawCoord(coord);
                let spriteId = gameObj.graphicsComponent.update();
                this.draw(coord, spriteId);
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
function convertToIsometric(x, y) {
    let width = Terrain.tileWidth;
    let height = Terrain.tileHeight;
    let drawX = Math.floor(x * width / 2) + Math.floor(y * width / 2);
    let drawY = Math.floor(y * height / 2) - Math.floor(x * height / 2);
    return new Point(drawX, drawY);
}
export class IsometricRenderer extends Renderer {
    constructor(canvas, sprites) {
        super(canvas, sprites);
    }
    getDrawCoord(gameObj) {
        let loc = Terrain.scaleLocation(gameObj.location);
        let coord = convertToIsometric(loc.x + loc.z, loc.y - loc.z);
        return coord;
    }
    drawFloor(gameMap, camera) {
        for (let y = 0; y < gameMap.height; y++) {
            for (let x = gameMap.width - 1; x >= 0; x--) {
                let terrain = gameMap.getFloor(x, y);
                this.drawObject(terrain, camera);
            }
        }
    }
    sortGameObjects(objects) {
        objects.sort((a, b) => {
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
