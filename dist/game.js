import { TerrainType } from "./terrain.js";
import { SquareGrid } from "./map.js";
import { CoordSystem, StaticGraphicsComponent, CartisanRenderer, IsometricRenderer } from "./gfx.js";
import { MouseController } from "./controller.js";
export class Game {
    constructor(_cellsX, _cellsY, _tileWidth, _tileHeight, sys, canvas, sprites, floorSpriteId) {
        this._controller = new MouseController(canvas);
        this._gameObjects = new Array();
        let _tileDepth = _tileHeight;
        let floorGraphics = new StaticGraphicsComponent(floorSpriteId);
        this._gameMap = new SquareGrid(_cellsX, _cellsY, _tileWidth, _tileDepth, _tileHeight, floorGraphics);
        this._gfx = sys == CoordSystem.Cartisan ?
            new CartisanRenderer(canvas, sprites) :
            new IsometricRenderer(canvas, sprites);
    }
    get map() {
        return this._gameMap;
    }
    getTerrain(x, y) {
        return this._gameMap.getTerrain(x, y, 0);
    }
    addFlatTerrain(x, y, z, component) {
        let terrain = this._gameMap.addRaisedTerrain(x, y, z, TerrainType.Flat, component);
        console.log("created raised", terrain);
        this._gameObjects.push(terrain);
        return terrain;
    }
    update() {
        this._gfx.update(this._gameObjects, this._gameMap, this._controller.camera);
        this._gfx.render();
    }
    run() {
        let game = this;
        var update = function update() {
            if (document.hasFocus()) {
                game.update();
            }
        };
        window.requestAnimationFrame(update);
    }
}
