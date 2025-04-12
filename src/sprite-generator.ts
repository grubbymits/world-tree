class Coord {
  constructor(private readonly _x: number,
              private readonly _y: number) {
    Object.freeze(this);
  }
  get x() { return this._x; }
  get y() { return this._y; }
}

function drawShape(coords: Array<Coord>, colour: string,
                   ctx: OffscreenCanvasRenderingContext2D) {
  ctx.moveTo(coords[0].x, coords[0].y);
  ctx.beginPath();
  for (let i = 1; i < coords.length; ++i) {
    const coord = coords[i];
    ctx.lineTo(coord.x, coord.y);
  }
  ctx.fill();
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

export function generateSprites(descriptor: SpriteGeneratorDescriptor) {

  // The incoming width should be divisible by four, so that we can calculate
  // the y delta, between top and topLeft/Right, without rounding. We also want
  // a mid point which also doesn't require rounding.
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

  // So, firstly round the width and calculate yDelta.
  const widthRem = Math.floor(descriptor.width % 4);
  if (widthRem < 2) {
    descriptor.width +- widthRem;
  } else {
    descriptor.width += widthRem;
  }
  const colours = new Array<string>(
    descriptor.dryGrassColour,
    descriptor.wetGrassColour,
    descriptor.sandColour,
    descriptor.rockColour,
    descriptor.mudColour,
    descriptor.snowColour,
    descriptor.waterColour,
  );
  const numShapes = 1;
  const numTerrains = colours.length;
  const canvas = new OffscreenCanvas(
    numTerrains * descriptor.width, 
    numShapes * descriptor.height
  );
  const ctx = canvas.getContext("2d");
  if (ctx) {
    generateFlat(
      descriptor.width,
      descriptor.height,
      colours,
      descriptor.darkUndergroundColour,
      descriptor.lightUndergroundColour,
      ctx!
    );
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

  const yDelta = width >> 2;
  const midX = Math.floor(0.5 * width) - 1;
  const bottomY = height - 1 - yDelta;

  const leftOfTopCoord = new Coord(midX - 1, 0);
  const rightOfTopCoord = new Coord(midX + 1, 0);
  const topRightCoord = new Coord(width - 1, yDelta);
  const topLeftCoord = new Coord(0, yDelta); 
  const midCoord = new Coord(midX, yDelta * 2);
  const leftOfMidCoord = new Coord(midX - 1, yDelta * 2);
  const rightOfMidCoord = new Coord(midX + 1, yDelta * 2);
  const bottomRightCoord = new Coord(width - 1, bottomY);
  const bottomLeftCoord = new Coord(0, bottomY);
  const bottomCoord = new Coord(midX, height - 1);
  const rightOfBottomCoord = new Coord(midX + 1, height - 1);
  const leftOfBottomCoord = new Coord(midX - 1, height - 1);

  const rightShape = new Array<Coord>(
    topRightCoord,
    bottomRightCoord,
    rightOfBottomCoord,
    bottomCoord,
    midCoord,
  );
  const leftShape = new Array<Coord>(
    topLeftCoord,
    bottomLeftCoord,
    leftOfBottomCoord,
    bottomCoord,
    midCoord,
  );
  const topShape = new Array<Coord>(
    leftOfTopCoord,
    rightOfTopCoord,
    topRightCoord,
    rightOfMidCoord,
    leftOfMidCoord,
    topLeftCoord,
  );
  for (const topColour of topColours) {
    drawShape(rightShape, darkUndergroundColour, ctx);
    drawShape(leftShape, lightUndergroundColour, ctx);
    drawShape(topShape, topColour, ctx);
  }
}

