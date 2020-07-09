import * as WT from "../../dist/world-tree.js";

const sheet = new WT.SpriteSheet("../../../res/img/cloud");
const cloudSprite = new WT.Sprite(sheet, 0, 0, 218, 152);
const cloudGraphic = new WT.StaticGraphicComponent(cloudSprite.id);
let relativeDims = new WT.Dimensions(1, 1, 1);
let cloudDims = new WT.IsometricPhysicalDimensions(218, relativeDims);

class Cloud extends WT.Actor {
  constructor(context, location) {
    super(context, location, cloudDims, cloudGraphic);
    this._canFly = true;
  }
}

export class CloudController extends WT.Controller {
  constructor(context, dims) {
    super();
    this._context = context;
    this._worldDims = dims;
    this.moveVector = new WT.Vector3D(0, -1, 0);
  }

  add(cloud) {
    this._context.addActor(cloud);
    this._actors.push(cloud);

    let bounds = this._context.bounds;
    let moveVector = this.moveVector;
    cloud.addEventListener(WT.EntityEvent.ActionComplete, function() {
      let x = cloud.x;
      let y = cloud.y;
      let z = cloud.z;

      if (cloud.x < bounds.minX) {
        x = bounds.maxX;
      } else if (cloud.x > bounds.maxX) {
        x = bounds.minX;
      }
      if (cloud.y < bounds.minY) {
        y = bounds.maxY;
      } else if (cloud.y > bounds.maxY) {
        y = bounds.minY;
      }
      if (cloud.z < bounds.minZ) {
        z = bounds.maxZ;
      } else if (cloud.z > bounds.maxZ) {
        z = bounds.minZ;
      }
      cloud.bounds.centre = new WT.Point3D(x, y, z);
      cloud.action = new WT.MoveDirection(cloud, moveVector, bounds);
    });
  }

  addClouds(total) {
    let maxX = this._worldDims.width - cloudDims.width;
    let maxY = this._worldDims.depth - cloudDims.depth;
    let z = this._worldDims.height - cloudDims.height;

    for (let i = 0; i < total; i++) {
      let x = Math.floor(Math.random() * Math.floor(maxX));
      let y = Math.floor(Math.random() * Math.floor(maxY));
      let randLocation = new WT.Point3D(x, y, z);
      let cloud = new Cloud(this._context, randLocation);
      // dy == -1 == northwards.
      cloud.action = new WT.MoveDirection(cloud, this.moveVector, this._context.bounds);
      this.add(cloud);
    }
  }

  update() {
    for (let cloud of this._actors) {
      cloud.update();
    }
  }
}
