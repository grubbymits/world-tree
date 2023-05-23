import { Point2D } from "./geometry.ts";
import { Direction, Navigation } from "./navigation.ts";
import { ContextImpl } from "./context.ts";
import { Renderer } from "./render.ts";

export const DummySpriteSheet = {
  addForValidation: function (_sprite: Sprite): boolean {
    return true;
  },
  addBitmap: function (
    id: number,
    x: number,
    y: number,
    width: number,
    height: number
  ): void {},
};

export class SpriteSheet {
  private static _sheets = new Array<SpriteSheet>();

  private static add(sheet: SpriteSheet) {
    this._sheets.push(sheet);
  }

  static reset(): void {
    this._sheets = new Array<SpriteSheet>();
  }

  private _image: HTMLImageElement;
  private _canvas: HTMLCanvasElement;
  private _renderer: Renderer;
  private _loaded = false;
  private _toValidate: Array<Sprite> = new Array<Sprite>();

  constructor(name: string, context: ContextImpl) {
    this._renderer = context.renderer;
    this._image = new Image();

    if (name) {
      this._image.src = name + ".png";
    } else {
      throw new Error("No filename passed");
    }
    SpriteSheet.add(this);

    this.image.addEventListener("onload", () => {
      this.canvas = document.createElement("canvas");
      this.canvas.width = this.width;
      this.canvas.height = this.height;
      this.canvas
        .getContext("2d")!
        .drawImage(this.image, 0, 0, this.width, this.height);
      this.loaded = true;
    });
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
    this._loaded = b;
  }
  get canvas(): HTMLCanvasElement {
    return this._canvas;
  }
  set canvas(c: HTMLCanvasElement) {
    this._canvas = c;
  }

  isTransparentAt(x: number, y: number): boolean {
    const data = this.canvas.getContext("2d")!.getImageData(x, y, 1, 1).data;
    return data[3] == 0;
  }

  addForValidation(sprite: Sprite): void {
    this._toValidate.push(sprite);
  }

  async addBitmap(
    id: number,
    x: number,
    y: number,
    width: number,
    height: number
  ): Promise<void> {
    if (this.loaded) {
      const bitmap = await createImageBitmap(this.image, x, y, width, height);
      this._renderer.addBitmap(id, bitmap);
    } else {
      this.image.addEventListener("onload", () => {
        this.addBitmap(id, x, y, width, height);
      });
    }
  }
}

export class Sprite {
  static sprites: Array<Sprite> = new Array<Sprite>();
  private readonly _id: number;
  private readonly _offset: Point2D;

  constructor(
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
    //console.assert(
    //  maxOffset.x <= this.sheet.width,
    //  "sprite id:",
    //  this.id,
    //  "sprite max X offset too large",
    //  maxOffset.x,
    //);
    //console.assert(
    //  maxOffset.y <= this.sheet.height,
    //  "sprite id:",
    //  this.id,
    //  "sprite max Y offset too large",
    //  maxOffset.y,
    //);
    this._id = Sprite.sprites.length;
    Sprite.sprites.push(this);
    this.sheet.addBitmap(
      this.id,
      this.offset.x,
      this.offset.y,
      this.width,
      this.height
    );
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

export function generateSprites(
  sheet: SpriteSheet,
  width: number,
  height: number,
  xBegin: number,
  yBegin: number,
  columns: number,
  rows: number
): Array<Sprite> {
  const sprites = new Array<Sprite>();
  const xEnd = xBegin + columns;
  const yEnd = yBegin + rows;
  for (let y = yBegin; y < yEnd; y++) {
    for (let x = xBegin; x < xEnd; x++) {
      sprites.push(new Sprite(sheet, x * width, y * height, width, height));
    }
  }
  return sprites;
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

export function generateStaticGraphics(
  sheet: SpriteSheet,
  width: number,
  height: number,
  xBegin: number,
  yBegin: number,
  columns: number,
  rows: number
): Array<StaticGraphicComponent> {
  const graphics = new Array<StaticGraphicComponent>();
  const xEnd = xBegin + columns;
  const yEnd = yBegin + rows;
  for (let y = yBegin; y < yEnd; y++) {
    for (let x = xBegin; x < xEnd; x++) {
      const sprite = new Sprite(sheet, x * width, y * height, width, height);
      graphics.push(new StaticGraphicComponent(sprite.id));
    }
  }
  return graphics;
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
