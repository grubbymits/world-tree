import * as WT from "../../dist/world-tree.js";

export class Robot extends WT.Actor {
  static sheet = new WT.SpriteSheet("../../../res/img/robot-2-1");
  static directions = [ WT.Direction.West,
                        WT.Direction.North,
                        WT.Direction.East,
                        WT.Direction.South ];
  static sprites = new Array();
  static spriteWidth = 85;
  static spriteHeight = 113;
  static dims =
    WT.TwoByOneIsometricRenderer.getDimensions(this.spriteWidth, this.spriteHeight);

  static initGraphics() {
    this._staticGraphics = new Map();
    this._movementSprites = new Array();
    for (let x in this.directions) {
      let direction = this.directions[x];
      let sprite = new WT.Sprite(this.sheet, x * this.spriteWidth, 0,
                                 this.spriteWidth, this.spriteHeight);
      let graphic = new WT.StaticGraphicComponent(sprite.id);
      this._staticGraphics.set(direction, graphic);
    }
    for (let x in this.directions) {
      let direction = this.directions[x];
      let animationFrames = new Array();
      for (let y = 1; y < 8; y++) {
        animationFrames.push(new WT.Sprite(this.sheet, x * this.spriteWidth,
                                           y * this.spriteHeight,
                                           this.spriteWidth, this.spriteHeight));
      }
      this._movementSprites.push(animationFrames);
    }
  }

  constructor(context, position) {
    let movementGraphics = new Map();
    for (let x in Robot.directions) {
      let direction = Robot.directions[x];
      let sprites = Robot._movementSprites[x];
      let graphic = new WT.LoopGraphicComponent(sprites, 166);
      movementGraphics.set(direction, graphic);
    }
    let graphics = new WT.DirectionalGraphicComponent(Robot._staticGraphics,
                                                      movementGraphics);
    super(context, position, Robot.dims, graphics);
    console.log("creating robot of dimensions:", Robot.dims);
    
    this.direction = WT.Direction.South;
    graphics.direction = WT.Direction.South;
    let robot = this;

    this.addEventListener(WT.EntityEvent.FaceDirection, function() {
      graphics.direction = robot.direction;
    });
    this.addEventListener(WT.EntityEvent.Moving, function() {
      graphics.stationary = false;
    });
    this.addEventListener(WT.EntityEvent.EndMove, function() {
      graphics.stationary = true;
    });
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
      robot.action = new WT.MoveForwardsDirection(robot, moveVector, bounds);
    };

    // Choose another direction when it can't move anymore.
    robot.addEventListener(WT.EntityEvent.EndMove, moveRandomDirection);
    // Initialise movement.
    moveRandomDirection();
  }
}
