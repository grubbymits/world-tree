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

class SpriteGenerator {
  constructor(private readonly _descriptor: SpriteGeneratorDescriptor) {
    // The incoming width should be divisible by four, so that we can calculate
    // the y delta, between top and topLeft/Right, without rounding. We also want
    // a mid point which also doesn't require rounding.

    // So, firstly round the width and calculate yDelta.
    this.width = descriptor.width;
    this.height = descriptor.height;
    const widthRem = Math.floor(this.width % 4);
    if (widthRem < 2) {
      this.width +- widthRem;
    } else {
      this.width += widthRem;
    }
    const yDelta = this.width >> 2;
    const midX = Math.floor(0.5 * this.width) - 1;
    const bottomY = this.height - 1 - yDelta;

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
    this.topRight = new Coord(width - 1, yDelta);
    this.bottomRight = new Coord(width - 1, bottomY);
    this.rightOfBottom = new Coord(midX + 1, height - 1);
    this.bottom = new Coord(midX, height - 1);
    this.leftOfBottom = new Coord(midX - 1, height - 1);
    this.bottomLeft = new Coord(0, bottomY);
    this.topLeft = new Coord(0, yDelta); 
    this.leftOfTop = new Coord(midX - 1, 0);
    
    this.mid = new Coord(midX, yDelta * 2);
    this.leftOfMid = new Coord(midX - 1, yDelta * 2);
    this.rightOfMid = new Coord(midX + 1, yDelta * 2);
    
    this.colours = new Array<string>(
      descriptor.dryGrassColour,
      descriptor.wetGrassColour,
      descriptor.sandColour,
      descriptor.rockColour,
      descriptor.mudColour,
      descriptor.snowColour,
      descriptor.waterColour,
    );

    const numShapes = 1;
    const numTerrains = this.colours.length;
    this.canvas = new OffscreenCanvas(
      numShapes * this.width,
      numTerrains * this.height 
    );
    console.log('generating sprite sheet', this.canvas.width, this.canvas.height);
    this.ctx = canvas.getContext("2d");
  }

  get descriptor(): SpriteGeneratorDescriptor { return this._descriptor; }
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
  set bottomLeft(c: coord) { this._bottomLeft = c; }
  get topLeft(): Coord { return this._topLeft; }
  set topLeft(c: coord) { this._topLeft = c; }
  get leftOfTop(): Coord { return this._leftOfTop; }
  set leftOfTop(c: coord) { this._leftOfTop = c; }
  get mid(): Coord { return this._mid; }
  set mid(c: Coord) { this._mid = c; }
  get leftOfMid(): Coord { return this._leftOfMid; }
  set leftOfMid(c: Coord) { this._leftOfMid = c; }
  get rightOfMid(): Coord { return this._rightOfMid; }
  set rightOfMid(c: Coord) { this._rightOfMid = c; }

  drawShape(coords: Array<Coord>, colour: string, offset: Coord) {
    this.ctx.fillStyle = colour;
    this.ctx.beginPath();
    this.ctx.moveTo(coords[0].x + offset.x, coords[0].y + offset.y);
    for (let i = 1; i < coords.length; ++i) {
      const coord = coords[i];
      this.ctx.lineTo(coord.x + offset.x, coord.y + offset.y);
      // stroke?
    }
    this.ctx.fill();
  }

  generateSprites(): ImageBitmap {
    if (ctx) {
      generateFlat();
      return canvas.transferToImageBitmap();
    }
    return new ImageBitmap();
  }
}

function generateFlat(width: number, height: number,
                      topColours: Array<string>,
                      darkUndergroundColour: string,
                      lightUndergroundColour: string,
                      ctx: OffscreenCanvasRenderingContext2D) {
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
  for (let i = 0; i < topColours.length; ++i) {
    const topColour = topColours[i];
    const offset = new Coord(0, height * i); 
    drawShape(rightShape, lightUndergroundColour, offset, ctx);
    drawShape(leftShape, darkUndergroundColour, offset, ctx);
    drawShape(topShape, topColour, offset, ctx);
  }
}

