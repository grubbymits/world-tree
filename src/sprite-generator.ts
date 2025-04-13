class Coord {
  constructor(private readonly _x: number,
              private readonly _y: number) {
    Object.freeze(this);
  }
  get x() { return this._x; }
  get y() { return this._y; }
}

export interface SpriteGeneratorDescriptor {
  width: number;
  height: number;
  waterColour: string;
  snowColour: string;
  sandColour: string;
  rockColour: string;
  mudColour: string;
  dryGrassColour: string;
  wetGrassColour: string;
  lightUndergroundColour: string;
  darkUndergroundColour: string;
}

const enum Column {
  Flat,
  RampSouth,
  RampWest,
  RampEast,
  RampNorth,
  WestEdge,
  NorthEdge,
  EastEdge,
  SouthEdge,
  NorthWestCorner,
  NorthEastCorner,
  SouthEastCorner,
  SouthWestCorner,
  NorthPeninsula,
  EastPeninsula,
  SouthPeninsula,
  WestPeninsula,
  Max,
}

export class SpriteGenerator {
  private _canvas: OffscreenCanvas;
  private _ctx: OffscreenCanvasRenderingContext2D;
  private _width: number;
  private _height: number;
  private _colours: Array<string>;
  private _top: Coord;
  private _rightOfTop: Coord;
  private _topRight: Coord;
  private _bottomRight: Coord;
  private _rightOfBottom: Coord;
  private _bottom: Coord;
  private _leftOfBottom: Coord;
  private _bottomLeft: Coord;
  private _topLeft: Coord;
  private _leftOfTop: Coord;
  private _mid: Coord;
  private _leftOfMid: Coord;
  private _rightOfMid: Coord;
  private _backCorner: Coord;

  constructor(private readonly _descriptor: SpriteGeneratorDescriptor) {
    // The incoming width should be divisible by four, so that we can calculate
    // the y delta, between top and topLeft/Right, without rounding. We also want
    // a mid point which also doesn't require rounding.

    // So, firstly round the width and calculate yDelta.
    this.width = this.descriptor.width;
    this.height = this.descriptor.height;
    const widthRem = Math.floor(this.width % 4);
    if (widthRem < 2) {
      this.width +- widthRem;
    } else {
      this.width += widthRem;
    }
    const yDelta = this.width >> 2;
    const midX = Math.floor(0.5 * this.width) - 1;
    const bottomY = this.height - 1 - yDelta;

    // Say we've rounded the width to 20, yDelta would be 5. From the 'top' point
    // we will move 10 units in the x axis and 5 in the y.
    // 0 ... 19
    //
    // Splitting into two sides gives us two sets of points:
    // 0,   1,  2,  3,  4,  5,  6,  7,  8,  9
    // 10, 11, 12, 13, 14, 15, 16, 17, 18, 19
    //
    // In the y-axis we have: 0, 1, 2, 3, 4.
    // If we map the points using the y-axis we get two sets:
    //
    // (0, 4),  (2, 3),   (4, 2), (6, 1),  (8, 0)
    // (10, 0), (12, 1), (14, 2), (16, 3), (18, 4)
    //
    // Which means we have a single point (9, 0), that is in the middle, but not
    // a member of either set.
    //
    //
    //                  * 'top'
    //                /   \
    //               /     \
    //    'topLeft' *       * 'topRight'
    //              |\     /|
    //              | \   / |
    //              |   *   |
    //'bottomLeft'  *   |   * 'bottomRight'
    //               \  |  /
    //                \ | /
    //                  *
    //              'bottom'

    // Clockwise from top
    this.top = new Coord(midX, 0);
    this.rightOfTop = new Coord(midX + 1, 0);
    this.topRight = new Coord(this.width - 1, yDelta);
    this.bottomRight = new Coord(this.width - 1, bottomY);
    this.rightOfBottom = new Coord(midX + 1, this.height - 1);
    this.bottom = new Coord(midX, this.height - 1);
    this.leftOfBottom = new Coord(midX - 1, this.height - 1);
    this.bottomLeft = new Coord(0, bottomY);
    this.topLeft = new Coord(0, yDelta); 
    this.leftOfTop = new Coord(midX - 1, 0);
    
    this.mid = new Coord(midX, yDelta * 2);
    this.leftOfMid = new Coord(midX - 1, yDelta * 2);
    this.rightOfMid = new Coord(midX + 1, yDelta * 2);

    // For ramps
    this.backCorner = new Coord(midX, yDelta);
    
    this.colours = new Array<string>(
      this.descriptor.dryGrassColour,
      this.descriptor.wetGrassColour,
      this.descriptor.sandColour,
      this.descriptor.rockColour,
      this.descriptor.mudColour,
      this.descriptor.snowColour,
      this.descriptor.waterColour,
    );

    const numTerrains = this.colours.length;
    this.canvas = new OffscreenCanvas(
      Column.Max * this.width,
      numTerrains * this.height 
    );
    console.log('generating sprite sheet', this.canvas.width, this.canvas.height);
    const ctx = this.canvas.getContext("2d");
    if (ctx) {
      this.ctx = ctx!;
    }
  }

  get width(): number { return this._width; }
  set width(w: number) { this._width = w; }
  get height(): number { return this._height; }
  set height(h: number) { this._height = h; }
  get canvas(): OffscreenCanvas { return this._canvas; }
  set canvas(c: OffscreenCanvas) { this._canvas = c; }
  get ctx(): OffscreenCanvasRenderingContext2D { return this._ctx; }
  set ctx(c: OffscreenCanvasRenderingContext2D) { this._ctx = c; }
  get descriptor(): SpriteGeneratorDescriptor { return this._descriptor; }
  get colours(): Array<string> { return this._colours; }
  set colours(a: Array<string>) { this._colours = a; }

  get top(): Coord { return this._top; }
  set top(c: Coord) { this._top = c; }
  get rightOfTop(): Coord { return this._rightOfTop; }
  set rightOfTop(c: Coord) { this._rightOfTop = c; }
  get topRight(): Coord { return this._topRight; }
  set topRight(c: Coord) { this._topRight = c; }
  get bottomRight(): Coord { return this._bottomRight; }
  set bottomRight(c: Coord) { this._bottomRight = c; }
  get rightOfBottom(): Coord { return this._rightOfBottom; }
  set rightOfBottom(c: Coord) { this._rightOfBottom = c; }
  get bottom(): Coord { return this._bottom; }
  set bottom(c: Coord) { this._bottom = c; }
  get leftOfBottom(): Coord { return this._leftOfBottom; }
  set leftOfBottom(c: Coord) { this._leftOfBottom = c; }
  get bottomLeft(): Coord { return this._bottomLeft; }
  set bottomLeft(c: Coord) { this._bottomLeft = c; }
  get topLeft(): Coord { return this._topLeft; }
  set topLeft(c: Coord) { this._topLeft = c; }
  get leftOfTop(): Coord { return this._leftOfTop; }
  set leftOfTop(c: Coord) { this._leftOfTop = c; }
  get mid(): Coord { return this._mid; }
  set mid(c: Coord) { this._mid = c; }
  get leftOfMid(): Coord { return this._leftOfMid; }
  set leftOfMid(c: Coord) { this._leftOfMid = c; }
  get rightOfMid(): Coord { return this._rightOfMid; }
  set rightOfMid(c: Coord) { this._rightOfMid = c; }
  get backCorner(): Coord { return this._backCorner; }
  set backCorner(c: Coord) { this._backCorner = c; }

  generateSpriteSheet(): ImageBitmap {
    if (this.ctx) {
      this.generateFlat(Column.Flat);
      this.generateRampSouth();
      this.generateRampWest();
      this.generateRampEast();
      this.generateRampNorth();
      this.generateEdge(Column.WestEdge);
      this.generateEdge(Column.NorthEdge);
      this.generateEdge(Column.EastEdge);
      this.generateEdge(Column.SouthEdge);
      this.generateCorner(Column.NorthWestCorner);
      this.generateCorner(Column.NorthEastCorner);
      this.generateCorner(Column.SouthEastCorner);
      this.generateCorner(Column.SouthWestCorner);
      this.generatePeninsula(Column.NorthPeninsula);
      this.generatePeninsula(Column.EastPeninsula);
      this.generatePeninsula(Column.SouthPeninsula);
      this.generatePeninsula(Column.WestPeninsula);
      return this.canvas.transferToImageBitmap();
    } else {
      throw new Error('no offscreen rendering context');
    }
    return new ImageBitmap();
  }

  drawSide(coords: Array<Coord>, colour: string, offset: Coord) {
    this.ctx.fillStyle = colour;
    this.ctx.strokeStyle = colour;
    this.ctx.beginPath();
    this.ctx.moveTo(coords[0].x + offset.x, coords[0].y + offset.y);
    for (let i = 1; i < coords.length; ++i) {
      const coord = coords[i];
      this.ctx.lineTo(coord.x + offset.x, coord.y + offset.y);
      this.ctx.stroke();
    }
    this.ctx.fill();
  }

  drawThreeSides(rightShape: Array<Coord>,
                 leftShape: Array<Coord>,
                 topShape: Array<Coord>,
                 column: Column) {
    for (let i = 0; i < this.colours.length; ++i) {
      const topColour = this.colours[i];
      const offset = new Coord(this.width * column, this.height * i); 
      this.drawSide(rightShape, this.descriptor.lightUndergroundColour, offset);
      this.drawSide(leftShape, this.descriptor.darkUndergroundColour, offset);
      this.drawSide(topShape, topColour, offset);
    }
  }

  generateFlat(column: Column) {
    const rightShape = new Array<Coord>(
      this.topRight,
      this.bottomRight,
      this.rightOfBottom,
      this.bottom,
      this.mid,
    );
    const leftShape = new Array<Coord>(
      this.topLeft,
      this.bottomLeft,
      this.leftOfBottom,
      this.bottom,
      this.mid,
    );
    const topShape = new Array<Coord>(
      this.leftOfTop,
      this.top,
      this.rightOfTop,
      this.topRight,
      this.rightOfMid,
      this.leftOfMid,
      this.topLeft,
    );
    for (let i = 0; i < this.colours.length; ++i) {
      const topColour = this.colours[i];
      const offset = new Coord(this.width * column, this.height * i); 
      this.drawSide(rightShape, this.descriptor.lightUndergroundColour, offset);
      this.drawSide(leftShape, this.descriptor.darkUndergroundColour, offset);
      this.drawSide(topShape, topColour, offset);
    }
  }

  generateRampSouth() {
    const rightShape = new Array<Coord> (
      this.bottomRight,
      this.bottom,
      this.mid,
      this.topRight,
    );
    const leftShape = new Array<Coord>(
      this.bottomLeft,
      this.bottom,
      this.mid,
    );
    const topShape = new Array<Coord>(
      this.bottomLeft,
      this.backCorner,
      this.topRight,
      this.mid,
    );
    for (let i = 0; i < this.colours.length; ++i) {
      const topColour = this.colours[i];
      const offset = new Coord(this.width * Column.RampSouth, this.height * i); 
      this.drawSide(rightShape, this.descriptor.lightUndergroundColour, offset);
      this.drawSide(leftShape, this.descriptor.darkUndergroundColour, offset);
      this.drawSide(topShape, topColour, offset);
    }
  }

  generateRampWest() {
    const rightShape = new Array<Coord> (
      this.bottomRight,
      this.bottom,
      this.mid,
    );
    const leftShape = new Array<Coord>(
      this.topLeft,
      this.bottomLeft,
      this.bottom,
      this.mid,
    );
    const topShape = new Array<Coord>(
      this.topLeft,
      this.mid,
      this.bottomRight,
      this.backCorner,
    );
    this.drawThreeSides(rightShape, leftShape, topShape, Column.RampWest);
  }

  generateRampEast() {
    const rightShape = new Array<Coord>(
      this.topRight,
      this.bottomRight,
      this.bottom,
    );
    const topShape = new Array<Coord> (
      this.bottomLeft,
      this.top,
      this.topRight,
      this.bottom,
    );
    for (let i = 0; i < this.colours.length; ++i) {
      const topColour = this.colours[i];
      const offset = new Coord(this.width * Column.RampEast, this.height * i); 
      this.drawSide(rightShape, this.descriptor.lightUndergroundColour, offset);
      this.drawSide(topShape, topColour, offset);
    }
  }

  generateRampNorth() {
    const leftShape = new Array<Coord>(
      this.bottomLeft,
      this.topLeft,
      this.bottom,
    );
    const topShape = new Array<Coord> (
      this.top,
      this.topLeft,
      this.bottom,
      this.bottomRight,
    );
    for (let i = 0; i < this.colours.length; ++i) {
      const topColour = this.colours[i];
      const offset = new Coord(this.width * Column.RampNorth, this.height * i); 
      this.drawSide(leftShape, this.descriptor.darkUndergroundColour, offset);
      this.drawSide(topShape, topColour, offset);
    }
  }

  drawShadow(from: Coord, to: Coord, offset: Coord) {
    this.ctx.strokeStyle = "rgb(0 0 0 / 25%)";
    this.ctx.beginPath();
    this.ctx.moveTo(from.x + offset.x, from.y + offset.y);
    this.ctx.lineTo(to.x + offset.x, to.y + offset.y);
    this.ctx.stroke();
  }

  generateEdge(column: Column) {
    let from: Coord;
    let to: Coord;
    switch (column) {
    default:
      throw new Error('unhandled edge');
      break;
    case Column.WestEdge:
      from = this.topLeft;
      to = this.mid;
      break;
    case Column.NorthEdge:
      from = this.topLeft;
      to = this.top;
      break;
    case Column.EastEdge:
      from = this.topRight;
      to = this.top;
      break;
    case Column.SouthEdge:
      from = this.topRight;
      to = this.mid;
      break;
    }
    this.generateFlat(column);
    for (let i = 0; i < this.colours.length; ++i) {
      const offset = new Coord(this.width * column, this.height * i);
      this.drawShadow(from, to, offset);
    }
  }

  generateCorner(column: Column) {
    let start: Coord;
    let mid: Coord;
    let end: Coord;
    switch (column) {
    default:
      throw new Error('unhandled corner');
      break;
    case Column.NorthWestCorner:
      start = this.mid;
      mid = this.topLeft;
      end = this.top
      break;
    case Column.NorthEastCorner:
      start = this.topLeft;
      mid = this.top;
      end = this.topRight;
      break;
    case Column.SouthEastCorner:
      start = this.top;
      mid = this.topRight;
      end = this.mid;
      break;
    case Column.SouthWestCorner:
      start = this.topRight;
      mid = this.mid;
      end = this.topLeft;
      break;
    }
    this.generateFlat(column);
    for (let i = 0; i < this.colours.length; ++i) {
      const offset = new Coord(this.width * column, this.height * i);
      this.drawShadow(start, mid, offset);
      this.drawShadow(mid, end, offset);
    }
  }

  generatePeninsula(column: Column) {
    let a: Coord;
    let b: Coord;
    let c: Coord;
    let d: Coord;
    switch (column) {
    default:
      throw new Error('unhandled peninsula');
      break;
    case Column.NorthPeninsula:
      a = this.mid;
      b = this.topLeft;
      c = this.top
      d = this.topRight;
      break;
    case Column.EastPeninsula:
      a = this.topLeft;
      b = this.top;
      c = this.topRight;
      d = this.mid;
      break;
    case Column.SouthPeninsula:
      a = this.top;
      b = this.topRight;
      c = this.mid;
      d = this.topLeft;
      break;
    case Column.WestPeninsula:
      a = this.topRight;
      b = this.mid;
      c = this.topLeft;
      d = this.top;
      break;
    }
    this.generateFlat(column);
    for (let i = 0; i < this.colours.length; ++i) {
      const offset = new Coord(this.width * column, this.height * i);
      this.drawShadow(a, b, offset);
      this.drawShadow(b, c, offset);
      this.drawShadow(c, d, offset);
    }
  }
}

