import * as WT from "../lib/world-tree.mjs";

function createDroid(context, position) {
  const directions = [
    WT.Direction.West,
    WT.Direction.South,
    WT.Direction.East,
    WT.Direction.North,
  ];
  const spriteWidth = 58;
  const spriteHeight = 107;
  const dimensions = WT.TwoByOneIsometric.getDimensions(
    spriteWidth, spriteHeight,
  );
  const sheet = new WT.SpriteSheet("../graphics/png/levitate-droid", context);
  const directionGraphicsMap = new Map();
  for (let x in directions) {
    let direction = directions[x];
    let sprite = new WT.Sprite(
      sheet,
      x * spriteWidth,
      0,
      spriteWidth,
      spriteHeight,
    );
    let graphic = new WT.StaticGraphicComponent(sprite.id);
    directionGraphicsMap.set(direction, graphic);
  }
  const graphics = new WT.DirectionalGraphicComponent(directionGraphicsMap);
  const droid = WT.createGraphicalActor(
    context, position, dimensions, graphics);

  droid.addEventListener(
    WT.EntityEvent.FaceDirection,
    () => graphics.direction = droid.direction,
  );

  let moveRandomDirection = () => {
    let dx = Math.round(Math.random() * 2) - 1;
    let dy = 0;
    let dz = 0;
    // Move along either the x or y axis.
    // Choose values between: -1, 0, 1
    if (dx == 0) {
      dy = Math.round(Math.random() * 2) - 1;
    }
    if (dx == 0 && dy == 0) {
      dy = 1;
    }
    let moveVector = new WT.Vector3D(dx, dy, dz);
    droid.direction = WT.Navigation.getDirectionFromVector(moveVector);
    droid.action = new WT.MoveDirection(droid, moveVector, context.bounds);
  };

  // Choose another direction when it can't move anymore.
  droid.addEventListener(WT.EntityEvent.EndMove, moveRandomDirection);
  // Initialise movement.
  moveRandomDirection();

  return droid;
}

const spriteWidth = 322;
const spriteHeight = 270;
const tileRows = [
  WT.TerrainType.Upland5,
  WT.TerrainType.Upland4,
  WT.TerrainType.Upland3,
  WT.TerrainType.Upland2,
  WT.TerrainType.Upland1,
  WT.TerrainType.Upland0,
];

function addGraphic(row, sheet) {
  const type = tileRows[row];
  WT.Terrain.addGraphic(
    /*terrainType*/ type,
    WT.TerrainShape.Flat,
    /*spriteSheet*/ sheet,
    /*coord.x*/ spriteWidth * 0,
    /*coord.y*/ spriteHeight * row,
    /*width*/ spriteWidth,
    /*height*/ spriteHeight,
  );
  WT.Terrain.addGraphic(
    /*terrainType*/ type,
    WT.TerrainShape.Wall,
    /*spriteSheet*/ sheet,
    /*coord.x*/ spriteWidth * 5,
    /*coord.y*/ spriteHeight * row,
    /*width*/ spriteWidth,
    /*height*/ spriteHeight,
  );
}

const cellsX = 9;
const cellsY = 9;
const numTerraces = 1;
let heightMap = [
  [2, 2, 2, 2, 2, 2, 2, 2, 2],
  [2, 2, 1, 1, 1, 2, 1, 1, 2],
  [2, 1, 1, 1, 1, 2, 1, 1, 2],
  [2, 1, 1, 1, 1, 1, 1, 1, 2],
  [2, 1, 1, 2, 1, 1, 1, 2, 2],
  [2, 1, 2, 1, 1, 1, 1, 1, 2],
  [2, 1, 1, 1, 2, 1, 1, 1, 2],
  [2, 2, 1, 1, 1, 1, 2, 1, 2],
  [2, 2, 2, 2, 2, 2, 2, 2, 2],
];

window.onload = (event) => {
  const physicalDims = WT.TwoByOneIsometric.getDimensions(
    spriteWidth,
    spriteHeight,
  );
  const worldDims = new WT.Dimensions(
    physicalDims.width * cellsX,
    physicalDims.depth * cellsY,
    physicalDims.height * (2 + numTerraces),
  );
  const config = new WT.TerrainBuilderConfig(
    numTerraces,
    WT.TerrainType.Upland0,
    WT.TerrainType.Upland1,
  );
  const canvas = document.getElementById("demoCanvas");
  const context = WT.createContext(
    canvas,
    worldDims,
    WT.Perspective.TwoByOneIsometric,
  );
  const sheet = new WT.SpriteSheet(
    "../graphics/png/outside-terrain-tiles-muted-textured", context
  );
  for (let row in tileRows) {
    addGraphic(row, sheet);
  }

  // Use the height map to construct a terrain.
  const builder = new WT.TerrainBuilder(
    cellsX,
    cellsY,
    heightMap,
    config,
    physicalDims,
  );
  builder.generateMap(context);

  // Place the droid in the middle of the map.
  const droidPosition = new WT.Point3D(
    Math.floor(worldDims.width / 2),
    Math.floor(worldDims.depth / 2),
    Math.floor(physicalDims.height + 1),
  );
  const droid = createDroid(context, droidPosition);
  const camera = new WT.TrackerCamera(
    context.scene,
    canvas.width,
    canvas.height,
    droid,
  );
  var update = function update() {
    if (document.hasFocus()) {
      context.update(camera);
    }
    window.requestAnimationFrame(update);
  };
  context.update(camera);
  window.requestAnimationFrame(update);
};
