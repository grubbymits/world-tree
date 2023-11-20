import { Point2D } from "./geometry.ts";
import { Direction, Navigation } from "./navigation.ts";
import { ContextImpl } from "./context.ts";
import { Renderer } from "./render.ts";

export const DummySpriteSheet = {
  loaded: true,
  addBitmap: function (
    id: number,
    x: number,
    y: number,
    width: number,
    height: number
  ): void {},
};

class SpriteBitmap {
  constructor(
    private readonly _id: number,
    private readonly _x: number,
    private readonly _y: number,
    private readonly _width: number,
    private readonly _height: number
  ) {
    Object.freeze(this);
  }
  get id(): number {
    return this._id;
  }
  get x(): number {
    return this._x;
  }
  get y(): number {
    return this._y;
  }
  get width(): number {
    return this._width;
  }
  get height(): number {
    return this._height;
  }
}

export class SpriteSheet {
  private static _sheets = new Array<SpriteSheet>();

  private static add(sheet: SpriteSheet) {
    this._sheets.push(sheet);
  }

  static reset(): void {
    this._sheets = new Array<SpriteSheet>();
  }

  private _image: HTMLImageElement;
  private _canvas: OffscreenCanvas;
  private _context2D: OffscreenCanvasRenderingContext2D | null;
  private _canvasBlob: Blob;
  private _renderer: Renderer;
  private _loaded = false;
  private _bitmapsToLoad: Array<SpriteBitmap> = new Array<SpriteBitmap>();

  private constructor(context: ContextImpl) {
    this._renderer = context.renderer;
    this._image = new Image();
  }

  private async generateBlob() {
    this.canvas = new OffscreenCanvas(this.width, this.height);
    this.context2D = this.canvas.getContext("2d", {
      willReadFrequently: true,
    })!;
    this.context2D.drawImage(this.image, 0, 0, this.width, this.height);
    await this.canvas.convertToBlob().then(
      (blob) => {
        this.canvasBlob = blob;
      },
      (error) => {
        console.log("failed to convert to blob:", error);
      }
    );
    this.loaded = true;
  }

  private static load(sheet: SpriteSheet, name: string): Promise<void> {
    return new Promise((resolve, reject) => {
      sheet.image.onload = () => resolve(sheet.generateBlob())
      sheet.image.src = name + ".png";
    });
  }

  public static async create(name: string, context: ContextImpl): Promise<SpriteSheet> {
    const sheet = new SpriteSheet(context);
    await this.load(sheet, name);
    this.add(sheet);
    return sheet;
  }

  get image(): HTMLImageElement {
    return this._image;
  }
  get width(): number {
    return this._image.width;
  }
  get height(): number {
    return this._image.height;
  }
  get name(): string {
    return this._image.src;
  }
  get loaded(): boolean {
    return this._loaded;
  }
  set loaded(b: boolean) {
    console.log("loaded spritesheet:", this.image.src);
    this._loaded = b;
  }
  get canvas(): OffscreenCanvas {
    return this._canvas;
  }
  set canvas(c: OffscreenCanvas) {
    this._canvas = c;
  }
  get context2D(): OffscreenCanvasRenderingContext2D {
    return this._context2D!;
  }
  set context2D(c: OffscreenCanvasRenderingContext2D) {
    this._context2D = c;
  }
  get canvasBlob(): Blob {
    return this._canvasBlob!;
  }
  set canvasBlob(b: Blob) {
    this._canvasBlob = b;
  }
  get bitmapsToLoad(): Array<SpriteBitmap> {
    return this._bitmapsToLoad;
  }

  isTransparentAt(x: number, y: number): boolean {
    const data = this.context2D.getImageData(x, y, 1, 1).data;
    return data[3] == 0;
  }

  async addBitmap(
    id: number,
    x: number,
    y: number,
    width: number,
    height: number
  ): Promise<void> {
    console.assert(this.loaded, "sheet not loaded!");
    createImageBitmap(this.canvasBlob, x, y, width, height).then(
      (bitmap) => {
        this._renderer.addBitmap(id, bitmap);
      },
      (error) => {
        console.log("failed to createImageBitmap:", error);
      }
    );
  }
}

export class Sprite {
  static sprites: Array<Sprite> = new Array<Sprite>();
  private readonly _id: number;
  private readonly _offset: Point2D;

  private constructor(
    private readonly _sheet: SpriteSheet,
    x: number,
    y: number,
    private readonly _width: number,
    private readonly _height: number
  ) {
    this._offset = new Point2D(x, y);
    console.assert(this.offset.x >= 0, "offset.x < 0");
    console.assert(this.offset.y >= 0, "offset.y < 0");
    const maxOffset = new Point2D(
      this.offset.x + this.width,
      this.offset.y + this.height
    );
    this._id = Sprite.sprites.length;
  }

  public static create(
    sheet: SpriteSheet,
    x: number,
    y: number,
    width: number,
    height: number): number {
    console.assert(sheet.loaded, "sheet is not loaded yet!");
    const sprite = new Sprite(sheet, x, y, width, height);
    this.sprites.push(sprite);
    sheet.addBitmap(
      sprite.id,
      sprite.offset.x,
      sprite.offset.y,
      sprite.width,
      sprite.height
    );
    return sprite.id;
  }

  isTransparentAt(x: number, y: number): boolean {
    x += this.offset.x;
    y += this.offset.y;
    return this.sheet.isTransparentAt(x, y);
  }

  get sheet(): SpriteSheet {
    return this._sheet;
  }
  get id(): number {
    return this._id;
  }
  get width(): number {
    return this._width;
  }
  get height(): number {
    return this._height;
  }
  get offset(): Point2D {
    return this._offset;
  }
}

export enum GraphicEvent {
  AddCanvas,
  AddSprite,
  Draw,
}

export class DrawElement {
  constructor(
    private readonly _spriteId: number,
    private readonly _coord: Point2D
  ) {
    Object.freeze(this);
  }
  get spriteId(): number {
    return this._spriteId;
  }
  get coord(): Point2D {
    return this._coord;
  }
}

export abstract class GraphicComponent {
  constructor(protected _currentSpriteId: number) {}

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

export class DummyGraphicComponent extends GraphicComponent {
  constructor(
    private readonly _width: number,
    private readonly _height: number
  ) {
    super(0);
  }
  get width(): number {
    return this._width;
  }
  get height(): number {
    return this._height;
  }
  update(): number {
    return 0;
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
  protected _nextUpdate = 0;
  protected _currentSpriteIdx = 0;
  protected _spriteIds: Array<number> = new Array<number>();

  constructor(sprites: Array<Sprite>, protected readonly _interval: number) {
    super(sprites[0].id);
    for (const i in sprites) {
      this._spriteIds.push(sprites[i].id);
    }
    this._nextUpdate = Date.now() + _interval;
  }

  update(): number {
    return this._spriteIds[this._currentSpriteIdx];
  }

  protected get firstId(): number {
    return this._spriteIds[0];
  }
  protected get lastId(): number {
    return this._spriteIds[this._spriteIds.length - 1];
  }
  protected get currentSpriteId(): number {
    console.assert(this._currentSpriteIdx >= 0);
    console.assert(this._currentSpriteIdx < this._spriteIds.length);
    return this._spriteIds[this._currentSpriteIdx];
  }
}

export class OssilateGraphicComponent extends AnimatedGraphicComponent {
  private _increase = true;

  constructor(sprites: Array<Sprite>, interval: number) {
    super(sprites, interval);
    this._currentSpriteIdx = Math.floor(
      Math.random() * (this._spriteIds.length - 1)
    );
  }

  update(): number {
    if (this._nextUpdate > Date.now()) {
      return this.currentSpriteId;
    }

    if (this._currentSpriteIdx == this._spriteIds.length - 1) {
      this._increase = false;
    } else if (this._currentSpriteIdx == 0) {
      this._increase = true;
    }

    if (this._increase) {
      this._currentSpriteIdx++;
    } else {
      this._currentSpriteIdx--;
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
    this._currentSpriteIdx =
      (this._currentSpriteIdx + 1) % this._spriteIds.length;
    this._nextUpdate = Date.now() + this._interval;
    return this.currentSpriteId;
  }
}

export class DirectionalGraphicComponent extends GraphicComponent {
  protected _direction: Direction = Direction.North;

  constructor(protected _staticGraphics: Map<Direction, GraphicComponent>) {
    super(0);
  }

  get direction(): Direction {
    return this._direction;
  }
  set direction(direction: Direction) {
    if (this._staticGraphics.has(direction)) {
      this._direction = direction;
    } else {
      console.log("graphic direction unsupported");
    }
  }

  update(): number {
    if (this._staticGraphics.has(this.direction)) {
      const component: GraphicComponent = this._staticGraphics.get(
        this.direction
      )!;
      const spriteId = component.update();
      return spriteId;
    }
    console.error(
      "unhandled stationary graphic:",
      Navigation.getDirectionName(this.direction)
    );
    return 0;
  }
}

export class AnimatedDirectionalGraphicComponent extends GraphicComponent {
  protected _stationary = true;
  protected _direction: Direction = Direction.North;

  constructor(
    protected _staticGraphics: Map<Direction, GraphicComponent>,
    protected _movementGraphics: Map<Direction, GraphicComponent>
  ) {
    super(0);
  }

  get stationary(): boolean {
    return this._stationary;
  }
  set stationary(stationary: boolean) {
    this._stationary = stationary;
  }
  get direction(): Direction {
    return this._direction;
  }
  set direction(direction: Direction) {
    if (
      this._staticGraphics.has(direction) &&
      this._movementGraphics.has(direction)
    ) {
      this._direction = direction;
    } else {
      console.log("graphic direction unsupported");
    }
  }

  update(): number {
    if (!this.stationary && this._movementGraphics.has(this.direction)) {
      const spriteId = this._movementGraphics.get(this.direction)!.update();
      return spriteId;
    }
    if (this.stationary && this._staticGraphics.has(this.direction)) {
      const component: GraphicComponent = this._staticGraphics.get(
        this.direction
      )!;
      const spriteId = component.update();
      return spriteId;
    }
    if (this.stationary) {
      console.error(
        "unhandled stationary graphic:",
        Navigation.getDirectionName(this.direction)
      );
    } else {
      console.error(
        "unhandled movement graphic:",
        Navigation.getDirectionName(this.direction)
      );
    }
    return 0;
  }
}
