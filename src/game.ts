import { Location, GameObject } from "./entity.js"
import { Terrain, TerrainType } from "./terrain.js"
import { Point, SquareGrid } from "./map.js"
import { CoordSystem, Sprite,
         GraphicsComponent, StaticGraphicsComponent,
         Renderer, CartisanRenderer, IsometricRenderer } from "./gfx.js"
import { MouseController } from "./controller.js"

export class Game {
  private _gameMap: SquareGrid;
  private _gfx: Renderer;
  private _gameObjects : Array<GameObject>;
  private _controller: MouseController;

  constructor(_cellsX: number,
              _cellsY: number,
              _tileWidth: number,
              _tileHeight: number,
              sys: CoordSystem,
              private _canvas: HTMLCanvasElement,
              _sprites: Array<Sprite>,
              floorSpriteId: number) {

    this._controller = new MouseController(_canvas);
    this._gameObjects = new Array<GameObject>();
    let _tileDepth = _tileHeight; // FIXME
    let floorGraphics = new StaticGraphicsComponent(floorSpriteId);
    this._gameMap = new SquareGrid(_cellsX, _cellsY, _tileWidth, _tileDepth,
                                   _tileHeight, floorGraphics);

    let context = _canvas.getContext("2d", { alpha: false })!;
    this._gfx = sys == CoordSystem.Cartisan ?
      new CartisanRenderer(context, _canvas.width, _canvas.height, _sprites) :
      new IsometricRenderer(context, _canvas.width, _canvas.height, _sprites);
    this._gfx.clear();
  }

  get map(): SquareGrid {
    return this._gameMap;
  }

  getTerrain(x: number, y: number): Terrain | null {
    return this._gameMap.getTerrain(x, y, 0);
  }

  addFlatTerrain(x: number, y: number, z: number, component: GraphicsComponent): Terrain {
    let terrain = this._gameMap.addRaisedTerrain(x, y, z, TerrainType.Flat, component);
    console.log("created raised", terrain);
    this._gameObjects.push(terrain);
    return terrain;
  }

  update(): void {
    let context = this._canvas.getContext("2d", { alpha: false })!;
    context.fillStyle = '#000000'; 
    context.fillRect(0, 0, this._canvas.width, this._canvas.height);
    this._gfx.drawFloor(this._controller.camera, this._gameMap);
    this._gfx.drawAll(this._gameObjects, this._controller.camera);
  }
}
