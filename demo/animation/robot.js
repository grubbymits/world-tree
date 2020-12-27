import * as WT from "../../dist/world-tree.js";

export class Robot extends WT.Actor {
  static sheet = new WT.SpriteSheet("../../../res/img/robot");
  static directions = [ WT.Direction.North,
                        WT.Direction.East,
                        WT.Direction.South,
                        WT.Direction.West ];
  static sprites = new Array();
  static spriteWidth = 96;
  static spriteHeight = 158;
  static relativeDims = new WT.Dimensions(2, 2, 3);
  static dims = new WT.IsometricPhysicalDimensions(this.spriteWidth, Robot.relativeDims);

  static initGraphics() {
    for (let x in this.directions) {
      let direction = this.directions[x];
      console.log("adding sprites for", WT.getDirectionName(direction));
      let animationFrames = new Array();
      for (let y = 0; y < 8; y++) {
        animationFrames.push(new WT.Sprite(this.sheet, x * this.spriteWidth,
                                           y * this.spriteHeight,
                                           this.spriteWidth, this.spriteHeight));
      }
      this.sprites.push(animationFrames);
      console.log("added robot frames:", animationFrames.length);
      console.log(this.sprites);
    }
    this.graphic = new WT.StaticGraphicComponent(this.sprites[0][0].id);
  }

  constructor(context, position) {
    super(context, position, Robot.dims, Robot.graphic, /*debug*/ true);
    console.assert(Robot.sprites.length == Robot.directions.length);
    console.log(Robot.sprites);
    for (let x in Robot.directions) {
      let direction = Robot.directions[x];
      let sprites = Robot.sprites[x];
      let graphic = new WT.LoopGraphicComponent(sprites, 166);
      this.addDirectionalGraphic(direction, graphic);
    }
  }
}

export class RobotController extends WT.Controller {
  constructor(context) {
    super();
    this._context = context;
  }

  get robot() { return this._robot; }

  add(position) {
    console.log("adding robot at:", position);
    this._robot = new Robot(this._context, position);
    console.log("min location:", this.robot.bounds.minLocation);

    this._actors.push(this.robot);
    let bounds = this._context.bounds;
    let spatialInfo = this._context.spatial;
    let robot = this.robot;

    let moveRandomDirection = function() {
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
      robot.action = new WT.MoveForwardsDirection(robot, moveVector, bounds, spatialInfo);
    };

    // Choose another direction when it can't move anymore.
    robot.addEventListener(WT.EntityEvent.ActionComplete, moveRandomDirection);
    // Initialise movement.
    moveRandomDirection();
  }
}
