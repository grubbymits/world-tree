import * as WT from "../lib/world-tree.js";

class Droid extends WT.Actor {
    
  static initGraphics() {
    this.sheet = new WT.SpriteSheet("../graphics/png/levitate-droid");
    this.directions = [ WT.Direction.West,
                        WT.Direction.South,
                        WT.Direction.East,
                        WT.Direction.North ];
    this.sprites = new Array();
    this.spriteWidth = 58;
    this.spriteHeight = 107;
    this.dims =
      WT.TwoByOneIsometric.getDimensions(this.spriteWidth, this.spriteHeight);
    this.staticGraphics = new Map();
    for (let x in this.directions) {
      let direction = this.directions[x];
      let sprite = new WT.Sprite(this.sheet, x * this.spriteWidth, 0,
                                 this.spriteWidth, this.spriteHeight);
      let graphic = new WT.StaticGraphicComponent(sprite.id);
      this.staticGraphics.set(direction, graphic);
    }
  }

  constructor(context, position) {
    super(context, position, Droid.dims);
    let graphics = new WT.DirectionalGraphicComponent(Droid.staticGraphics);
    this.addGraphic(graphics);
    
    this.addEventListener(WT.EntityEvent.FaceDirection, () =>
      graphics.direction = this.direction
    );

    let moveRandomDirection = () => {
      let dx = Math.round(Math.random() * 2) - 1;
      let dy = 0;
      let dz = 2;
      // Move along either the x or y axis.
      // Choose values between: -1, 0, 1
      if (dx == 0) {
        dy = Math.round(Math.random() * 2) - 1;
      }
      if (dx == 0 && dy == 0) {
        dy = 1;
      }
      let moveVector = new WT.Vector3D(dx, dy, dz);
      this.direction = WT.getDirectionFromVector(moveVector);
      this.action = new WT.MoveDirection(this, moveVector, context.bounds);
    };

    // Choose another direction when it can't move anymore.
    this.addEventListener(WT.EntityEvent.EndMove, moveRandomDirection);
    // Initialise movement.
    moveRandomDirection();
  }
}

const spriteWidth = 322;
const spriteHeight = 270;
const sheet = new WT.SpriteSheet("../graphics/png/outside-terrain-tiles-muted-textured");
const tileRows = [
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
];

const tileColumns = [
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
];

function addGraphic(column, row) {
  const shape = tileColumns[column];
  const type = tileRows[row];
  WT.Terrain.addGraphic(/*terrainType*/type,
                        /*terrainShape*/shape,
                        /*spriteSheet*/sheet,
                        /*coord.x*/spriteWidth * column,
                        /*coord.y*/spriteHeight * row,
                        /*width*/spriteWidth,
                        /*height*/spriteHeight);
}

for (let row in tileRows) {
  for (let column in tileColumns) {
    addGraphic(column, row);
  }
}

const cellsX = 11;
const cellsY = 11;
const numTerraces = 2;
const heightMap = [ [ 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 4 ],
                    [ 2, 0, 0, 0, 0, 4, 0, 0, 0, 0, 4 ],
                    [ 2, 0, 2, 2, 2, 2, 2, 1, 0, 0, 4 ],
                    [ 2, 0, 1, 2, 2, 2, 2, 1, 0, 0, 4 ],
                    [ 2, 0, 1, 2, 2, 2, 2, 1, 0, 0, 4 ],
                    [ 2, 4, 1, 2, 2, 2, 2, 1, 0, 4, 4 ],
                    [ 2, 0, 1, 2, 2, 2, 2, 1, 0, 0, 4 ],
                    [ 2, 0, 1, 2, 2, 2, 2, 1, 0, 0, 4 ],
                    [ 2, 0, 1, 1, 1, 1, 1, 1, 0, 0, 4 ],
                    [ 2, 0, 0, 0, 0, 4, 0, 0, 0, 0, 4 ],
                    [ 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2] ];

window.onload = (event) => {
  const physicalDims =
    WT.TwoByOneIsometric.getDimensions(spriteWidth, spriteHeight);
  const worldDims = new WT.Dimensions(physicalDims.width * cellsX,
                                      physicalDims.depth * cellsY,
                                      physicalDims.height * (2 + numTerraces));

  let canvas = document.getElementById("demoCanvas");
  let context = WT.createContext(canvas, worldDims, WT.Perspective.TwoByOneIsometric);

  const config = new WT.TerrainBuilderConfig(numTerraces,
                                             WT.TerrainType.Upland4,
                                             WT.TerrainType.Upland3);
  config.hasRamps = true;
  // Use the height map to construct a terrain.
  let builder = new WT.TerrainBuilder(cellsX, cellsY, heightMap,
                                      config, physicalDims);
  builder.generateMap(context);
  WT.Gravity.init(4, context);

  Droid.initGraphics();
  let droidPosition = new WT.Point3D(physicalDims.width + 1,
                                     physicalDims.depth + 1,
                                     physicalDims.height + 1);
  var droid = new Droid(context, droidPosition); 
  let camera = new WT.TrackerCamera(context.scene,
                                    canvas.width, canvas.height,
                                    droid);
  var update = function update() {
    if (document.hasFocus()) {
      context.update(camera);
    }
    window.requestAnimationFrame(update);
  }
  context.update(camera);
  window.requestAnimationFrame(update);
}
