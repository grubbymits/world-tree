import * as WT from "../../dist/world-tree.js";

class Robot extends WT.Actor {
  static sheet = new WT.SpriteSheet("../../../res/img/water");
  static sprite = new WT.Sprite(Robot.sheet, 0, 0, 256, 248);
  static graphic = new WT.StaticGraphicComponent(Robot.sprite.id);
  static relativeDims = new WT.Dimensions(3, 3, 2);
  static dims = new WT.IsometricPhysicalDimensions(128, Robot.relativeDims);

  constructor(context, position) {
    super(context, position, Robot.dims, Robot.graphic);
  }
}

export class RobotController extends WT.Controller {
  constructor(context) {
    super();
    this._context = context;
  }

  add(position) {
    console.log("adding robot at (x,y,z):", position.x, position.y, position.z);
    let robot = new Robot(this._context, position);
    this._actors.push(robot);
    let bounds = this._context.bounds;
    let spatialInfo = this._context.spatial;

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
      robot.action = new WT.MoveDirection(robot, moveVector, bounds, spatialInfo);
    };

    // Chose another direction when it can't move anymore.
    robot.addEventListener(WT.EntityEvent.ActionComplete, moveRandomDirection);
    // Initialise movement.
    moveRandomDirection();
  }
}
