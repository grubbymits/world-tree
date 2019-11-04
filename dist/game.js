import { TerrainType } from "./terrain.js";
import { SquareGrid } from "./map.js";
import { CoordSystem, StaticGraphicsComponent, CartisanRenderer, IsometricRenderer } from "./gfx.js";
import { Camera } from "./camera.js";
export class Game {
    constructor(_cellsX, _cellsY, _tileWidth, _tileHeight, sys, _canvas, _sprites, floorSpriteId) {
        this._canvas = _canvas;
        this._gameObjects = new Array();
        let _tileDepth = _tileHeight;
        let floorGraphics = new StaticGraphicsComponent(floorSpriteId);
        this._gameMap = new SquareGrid(_cellsX, _cellsY, _tileWidth, _tileDepth, _tileHeight, floorGraphics);
        let context = _canvas.getContext("2d", { alpha: false });
        this._camera = new Camera(0, 0, _canvas.width, _canvas.height);
        this._gfx = sys == CoordSystem.Cartisan ?
            new CartisanRenderer(context, _canvas.width, _canvas.height, _sprites) :
            new IsometricRenderer(context, _canvas.width, _canvas.height, _sprites);
        this._gfx.clear();
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
    addMouseCamera() {
        var camera = this._camera;
        this._canvas.addEventListener('mousemove', e => {
            camera.x = e.clientX;
            camera.y = e.clientY;
        });
    }
    update() {
        let context = this._canvas.getContext("2d", { alpha: false });
        context.fillStyle = '#000000';
        context.fillRect(0, 0, this._canvas.width, this._canvas.height);
        this._gfx.drawFloor(this._camera, this._gameMap);
        this._gfx.drawAll(this._gameObjects, this._camera);
    }
}
