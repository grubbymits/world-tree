import { Point, CoordSystem, Location, GameMap } from "./map.js"

export class SpriteSheet {
  private _image: HTMLImageElement;

  constructor(name: string) {
    this._image = new Image();

    if (name) {
      this._image.src = name + ".png";
    } else {
      throw new Error("No filename passed");
    }
    console.log("load", name);
  }

  get image(): HTMLImageElement {
    return this._image;
  }
}

export class Sprite {
  constructor(private readonly _sheet: SpriteSheet,
              private readonly _offsetX: number,
              private readonly _offsetY: number,
              private readonly _width: number,
              private readonly _height: number) { }

  render(coord: Point, ctx: CanvasRenderingContext2D): void {
    ctx.drawImage(this._sheet.image,
                  this._offsetX, this._offsetY,
                  this._width, this._height,
                  coord.x, coord.y,
                  this._width, this._height);
  }
}

export class Renderer {
  constructor(private _ctx: CanvasRenderingContext2D,
              private readonly _width: number,
              private readonly _height: number,
              private _sprites: Array<Sprite>) { }

  clear(): void {
    this._ctx.fillStyle = '#000000';
    this._ctx.fillRect(0, 0, this._width, this._height);
  }

  render(coord: Point, id: number): void {
    this._sprites[id].render(coord, this._ctx);
  }
}

export function renderRaised(gameMap: GameMap, camera: Point, sys: CoordSystem,
                             gfx: Renderer) {
  let locations: Array<Location> = gameMap.raisedLocations;
  if (sys == CoordSystem.Cartisan) {
    for (let i in locations) {
      let location = locations[i];
      let coord = gameMap.getDrawCoord(location.x, location.y, 0, sys);
      let newCoord = new Point(coord.x + camera.x, coord.y + camera.y);
      gfx.render(newCoord, location.spriteId);
    }
  }
}

export function renderFloor(gameMap: GameMap, camera: Point, sys: CoordSystem,
                            gfx: Renderer) {
  if (sys == CoordSystem.Cartisan) {
    for (let y = 0; y < gameMap.height; y++) {
      for (let x = 0; x < gameMap.width; x++) {
        let location = gameMap.getLocation(x, y);
        let coord = gameMap.getDrawCoord(x, y, 0, sys);
        let newCoord = new Point(coord.x + camera.x, coord.y + camera.y);
        gfx.render(newCoord, location.spriteId);
      }
    }
  } else if (sys == CoordSystem.Isometric) {
    for (let y = 0; y < gameMap.height; y++) {
      for (let x = gameMap.width - 1; x >= 0; x--) {
        let location = gameMap.getLocation(x, y);
        let coord = gameMap.getDrawCoord(x, y, 0, sys);
        let newCoord = new Point(coord.x + camera.x, coord.y + camera.y);
        gfx.render(newCoord, location.spriteId);
      }
    }
  } else {
    throw("invalid coordinate system");
  }
}
