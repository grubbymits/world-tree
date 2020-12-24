import { Point2D } from "./geometry.js"

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
  private _drawOffset: Point2D;

  constructor(private readonly _sheet: SpriteSheet,
              offsetX: number,
              offsetY: number,
              private readonly _width: number,
              private readonly _height: number) {
    this._id = Sprite.sprites.length;
    this._spriteOffset = new Point2D(offsetX, offsetY);
    this._sheet = _sheet;
    Sprite.add(this);
    this._drawOffset = new Point2D(0, _height - 1);

    let sprite: Sprite = this;
    this._sheet.image.addEventListener('load', function() {
      // Find the bottom left-most point.
      for (let x = 0; x < _width; x++) {
        for (let y = _height - 1; y >= 0; y--) {
          if (!sprite.isTransparentAt(x, y)) {
            sprite._drawOffset = new Point2D(x, y-_height);
            console.log("set draw offset:", sprite._drawOffset);
            return;
          }
        }
      }
    });
  }

  draw(coord: Point2D, ctx: CanvasRenderingContext2D): void {
    ctx.drawImage(this._sheet.image,
                  this._spriteOffset.x, this._spriteOffset.y,
                  this._width, this._height,
                  coord.x + this.drawOffset.x,
                  coord.y + this.drawOffset.y,
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
  get drawOffset(): Point2D { return this._drawOffset; }
  set drawOffset(offset: Point2D) { this._drawOffset = offset; }
}

// Computer graphics have their origin in the top left corner.
// But the entity's position should be rooted at it's base, not possibly above
// it, so we need to make an adjustment when drawing. I'm not sure how to
// handle it because I guess we'll need to inverse for handling clicks.

export abstract class GraphicComponent {
  constructor(protected _currentSpriteId: number) { }
              
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
  get offset(): Point2D {
    return Sprite.sprites[this._currentSpriteId].drawOffset;
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
    this._currentSpriteId =
      Math.floor(Math.random() * (this.lastId - this.firstId) + this.firstId);
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
    this._currentSpriteId = 0;
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
