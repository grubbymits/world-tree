import { Point2D } from "./geometry.js"
import { getDirectionName,
         Direction } from "./physics.js"

export class SpriteSheet {
  private static _sheets = new Array<SpriteSheet>();

  private static add(sheet: SpriteSheet) {
    this._sheets.push(sheet);
  }

  private _image: HTMLImageElement;
  private _canvas: HTMLCanvasElement;

  constructor(name: string) {
    this._image = new Image();

    if (name) {
      this._image.src = name + ".png";
    } else {
      throw new Error("No filename passed");
    }
    SpriteSheet.add(this);

    let sheet = this;
    this._image.onload = function() {
      console.log("loaded:", sheet.image.src);
      sheet.canvas = document.createElement('canvas');
      let width: number = sheet.width;
      let height: number = sheet.height;
      sheet.canvas.width = width;
      sheet.canvas.height = height;
      sheet.canvas.getContext('2d')!.drawImage(sheet.image, 0, 0, width, height);
    };
  }

  get image(): HTMLImageElement { return this._image;  }
  get width(): number { return this._image.width; }
  get height(): number { return this._image.height; }
  get canvas(): HTMLCanvasElement { return this._canvas; }
  set canvas(c: HTMLCanvasElement) { this._canvas = c; }

  isTransparentAt(x: number, y: number): boolean {
    let data = this._canvas.getContext('2d')!.getImageData(x, y, 1, 1).data;
    return data[3] == 0;
  }
}

export class Sprite {
  private static _sprites = new Array<Sprite>();

  private static add(sprite: Sprite) {
    this._sprites.push(sprite);
  }

  static get sprites(): Array<Sprite> {
    return this._sprites;
  }

  private readonly _id: number;
  private readonly _spriteOffset: Point2D;

  constructor(private readonly _sheet: SpriteSheet,
              offsetX: number,
              offsetY: number,
              private readonly _width: number,
              private readonly _height: number) {
    this._id = Sprite.sprites.length;
    this._spriteOffset = new Point2D(offsetX, offsetY);
    this._sheet = _sheet;
    Sprite.add(this);

    let sprite: Sprite = this;
  }

  draw(coord: Point2D, ctx: CanvasRenderingContext2D): void {
    ctx.drawImage(this._sheet.image,
                  this._spriteOffset.x, this._spriteOffset.y,
                  this._width, this._height,
                  coord.x, coord.y,
                  this._width, this._height);
  }

  isTransparentAt(x: number, y: number): boolean {
    x += this._spriteOffset.x;
    y += this._spriteOffset.y;
    return this._sheet.isTransparentAt(x, y);
  }

  get id(): number { return this._id; }
  get width(): number { return this._width; }
  get height(): number { return this._height; }
}

export abstract class GraphicComponent {
  constructor(protected _currentSpriteId: number) {
    console.assert(typeof(this._currentSpriteId) == "number", "spriteId not a number");
    console.assert(this._currentSpriteId > -1 &&
                   this._currentSpriteId < Sprite.sprites.length,
                   "spriteId not in range:", this._currentSpriteId);
  }
              
  abstract update(): number;
  isTransparentAt(x: number, y: number): boolean {
    return Sprite.sprites[this._currentSpriteId].isTransparentAt(x, y);
  }
  get width(): number { 
    return Sprite.sprites[this._currentSpriteId].width;
  }
  get height(): number { 
    return Sprite.sprites[this._currentSpriteId].height;
  }
}

export class StaticGraphicComponent extends GraphicComponent {
  constructor(id: number) {
    super(id);
  }

  update(): number {
    return this._currentSpriteId;
  }
}

export class AnimatedGraphicComponent extends GraphicComponent {
  protected _nextUpdate: number = 0;
  protected _currentSpriteIdx: number = 0;
  protected _spriteIds: Array<number> = new Array<number>();

  constructor(sprites: Array<Sprite>,
              protected readonly _interval: number) {
    super(sprites[0].id);
    for (let i in sprites) {
      this._spriteIds.push(sprites[i].id);
    }
    this._nextUpdate = Date.now() + _interval;
  }

  update(): number {
    return this._spriteIds[this._currentSpriteIdx];
  }

  protected get firstId(): number { return this._spriteIds[0] }
  protected get lastId(): number {
    return this._spriteIds[this._spriteIds.length - 1];
  }
  protected get currentSpriteId(): number {
    return this._spriteIds[this._currentSpriteIdx];
  }
}

export class OssilateGraphicComponent extends AnimatedGraphicComponent {

  private _increase: boolean = true;

  constructor(sprites: Array<Sprite>, interval: number) {
    super(sprites, interval);
    this._currentSpriteIdx =
      Math.floor(Math.random() * (this._spriteIds.length - 1));
  }

  update(): number {
    if (this._nextUpdate > Date.now()) {
      return this.currentSpriteId;
    }

    if (this._increase) {
      if (this._currentSpriteId != this.lastId) {
        this._currentSpriteIdx++;
      } else {
        this._increase = false;
      }
    } else if (this._currentSpriteIdx != this.firstId) {
      this._currentSpriteIdx--;
    } else {
      this._increase = true;
    }

    this._nextUpdate = Date.now() + this._interval;
    return this.currentSpriteId;
  }
}

export class LoopGraphicComponent extends AnimatedGraphicComponent {
  constructor(sprites: Array<Sprite>, interval: number) {
    super(sprites, interval);
    this._currentSpriteIdx = 0;
  }

  update(): number {
    if (this._nextUpdate > Date.now()) {
      return this.currentSpriteId;
    }
    this._currentSpriteIdx = (this._currentSpriteIdx + 1 ) % this._spriteIds.length;
    this._nextUpdate = Date.now() + this._interval;
    return this.currentSpriteId;
  }
}

export class DirectionalGraphicComponent extends GraphicComponent {
  protected _stationary: boolean = true;
  protected _direction: Direction;

  constructor(protected _staticGraphics: Map<Direction, GraphicComponent>,
              protected _movementGraphics: Map<Direction, GraphicComponent>) {
    super(0);
  }

  get stationary(): boolean { return this._stationary; }
  get direction(): Direction { return this._direction; }
  set stationary(stationary: boolean) { this._stationary = stationary; }
  set direction(direction: Direction) {
    if (!this._staticGraphics.has(direction) ||
        !this._movementGraphics.has(direction)) {
      console.log("graphic direction unsupported");
    }
    this._direction = direction;
  } 

  update(): number {
    if (!this.stationary && this._movementGraphics.has(this.direction)) {
      const spriteId = this._movementGraphics.get(this.direction)!.update();
      return spriteId;
    }
    if (this.stationary && this._staticGraphics.has(this.direction)) {
      const component: GraphicComponent = this._staticGraphics.get(this.direction)!;
      const spriteId = component.update();
      return spriteId;
    }
    if (this.stationary) {
      console.error("unhandled stationary graphic:", getDirectionName(this.direction));
    } else {
      console.error("unhandled movement graphic:", getDirectionName(this.direction));
    }
    return 0;
  }
}
