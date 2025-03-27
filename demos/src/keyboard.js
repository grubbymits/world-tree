import * as WT from "../../dist/world-tree.mjs";

const worldDescriptor = {
  canvasName: "demoCanvas",
  projection: "TwoByOneIsometric",
  heightMap: [
    [2, 2, 2, 2, 2, 2, 2, 2, 2],
    [2, 2, 1, 1, 1, 2, 1, 1, 2],
    [2, 1, 1, 1, 1, 2, 1, 1, 2],
    [2, 1, 1, 1, 1, 1, 1, 1, 2],
    [2, 1, 1, 2, 1, 1, 1, 2, 2],
    [2, 1, 2, 1, 1, 1, 1, 1, 2],
    [2, 1, 1, 1, 2, 1, 1, 1, 2],
    [2, 2, 1, 1, 1, 1, 2, 1, 2],
    [2, 2, 2, 2, 2, 2, 2, 2, 2],
  ],
  numTerraces: 2,
  defaultTerrainType: WT.TerrainType.WetGrass,
  terrainSpriteDescriptor: {
    spriteWidth: 161,
    spriteHeight: 124,
    spriteSheetName: "graphics/png/flat-tiles-162x123",
    tileRowTypes: [
      WT.TerrainType.WetGrass,
    ],
    tileColumnShapes: [
      WT.TerrainShape.Flat,
      WT.TerrainShape.RampUpSouth,
      WT.TerrainShape.RampUpWest,
      WT.TerrainShape.RampUpEast,
      WT.TerrainShape.RampUpNorth,
    ],
  },
};

async function createDroid(context, position) {
  const graphicsDescriptor = {
    spriteSheetName: "graphics/png/levitate-droid",
    spriteWidth: 58,
    spriteHeight: 107,
    columnDirections: [
      WT.Direction.West,
      WT.Direction.South,
      WT.Direction.East,
      WT.Direction.North,
    ],
    numFrames: 1,
  };
  const graphics = await WT.createDirectionalGraphics(graphicsDescriptor, context);
  const dimensions = WT.TwoByOneIsometric.getDimensions(
    graphicsDescriptor.spriteWidth, graphicsDescriptor.spriteHeight,
  );
  const droid = new WT.Actor(
    context, position, dimensions, graphics
  );
  droid.gravitySpeed = 0.1;

  droid.addEventListener(
    WT.EntityEvent.FaceDirection,
    () => graphics.direction = droid.direction,
  );

  return droid;
}

window.onload = async (event) => {
  const context = await WT.createWorld(worldDescriptor);
  WT.Gravity.init(context);
  const canvas = document.getElementById(worldDescriptor.canvasName);

  // Place the droid in the middle(ish) of the map.
  const x = 4;
  const y = 2;
  const droidPosition =
    context.grid.getCentreSurfaceLocationAt(x, y).add(new WT.Vector3D(0, 0, 1));
  const droid = await createDroid(context, droidPosition);
  const camera = new WT.TrackerCamera(
    context.scene,
    canvas.width,
    canvas.height,
    droid,
  );
  WT.ArrowKeyMovement(canvas, droid, 1);
  WT.SpaceJump(canvas, droid, 10);
  const update = function() {
    if (document.hasFocus()) {
      context.update(camera);
    }
    window.requestAnimationFrame(update);
  };
  window.requestAnimationFrame(update);
};
