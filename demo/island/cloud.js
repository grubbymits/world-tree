import * as WT from "../../dist/world-tree.js";

//let sheet = new WT.SpriteSheet("../../../res/img/cloud");
//let cloudSprite = new WT.Sprite();
//let cloudGraphic = new WT.GraphicComponent();

class Cloud extends WT.Actor {
  constructor(location, dimensions) {
    super(location, dimensions, false, cloudGraphic);
    this._canFly = true;
  }
}

class CloudController extends WT.Controller {
  constructor(context) {
    super();
    this._context = context;
  }

  add(cloud) {
    this._context.addActor(cloud);
    this._actors.push(cloud);

    let bounds = this.context.bounds;
    cloud.addEventListener(WT.EntityEvent.ActionComplete, function() {
      let x = cloud.x;
      let y = cloud.y;
      let z = cloud.z;

      if (cloud.x < bounds.minX) {
        let x = bounds.maxX;
      } else if (cloud.x > bounds.maxX) {
        let x = bounds.minX;
      }
      if (cloud.y < bounds.minY) {
        let y = bounds.maxY;
      } else if (cloud.y > bounds.maxY) {
        let y = bounds.minY;
      }
      if (cloud.z < bounds.minZ) {
        let z = bounds.maxZ;
      } else if (cloud.z > bounds.maxZ) {
        let z = bounds.minZ;
      }
      cloud.location = new WT.Location(x, y, z);
    });
  }

  update() {
    for (let cloud of this._actors) {
      cloud.update();
    }
  }
}
