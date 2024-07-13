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
  floor: WT.TerrainType.Upland0,
  wall: WT.TerrainType.Upland1,
  terrainSpriteDescriptor: {
    spriteWidth: 322,
    spriteHeight: 270,
    spriteSheetName: "graphics/png/outside-terrain-tiles-muted-textured",
    tileRowTypes: [
      WT.TerrainType.Lowland5,
      WT.TerrainType.Lowland4,
      WT.TerrainType.Lowland3,
      WT.TerrainType.Lowland2,
      WT.TerrainType.Lowland1,
      WT.TerrainType.Lowland0,
      WT.TerrainType.Upland5,
      WT.TerrainType.Upland4,
      WT.TerrainType.Upland3,
      WT.TerrainType.Upland2,
      WT.TerrainType.Upland1,
      WT.TerrainType.Upland0,
      WT.TerrainType.Water,
    ],
    tileColumnShapes: [
      WT.TerrainShape.Flat,
      WT.TerrainShape.RampUpSouth,
      WT.TerrainShape.RampUpWest,
      WT.TerrainShape.RampUpEast,
      WT.TerrainShape.RampUpNorth,
      WT.TerrainShape.Wall,
      WT.TerrainShape.FlatAloneOut,
      WT.TerrainShape.FlatWestOut,
      WT.TerrainShape.FlatSouthOut,
      WT.TerrainShape.FlatSouthWest,
      WT.TerrainShape.FlatNorthEast,
      WT.TerrainShape.FlatNorth,
      WT.TerrainShape.FlatEastOut,
      WT.TerrainShape.FlatEast,
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
    context.grid.getSurfaceLocationAt(x, y).add(new WT.Vector3D(0, 0, 1));
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
