import { Context } from "./context.js"
import { PhysicalEntity,
         Actor } from "./entity.js"
import { EntityEvent } from "./events.js"
import { CollisionDetector,
         CollisionInfo } from "./physics.js"
import { Point2D,
         Vertex3D,
         Face3D,
         IntersectInfo } from "./geometry.js"
import { Camera } from "./camera.js"
import { SceneGraph } from "./scene.js"

export class ActorDebug {
  constructor(actor: Actor,
              camera: Camera,
              debugCollision: boolean) {
    if (debugCollision) {
      this.debugCollision(actor, camera);
    }
  }

  private debugCollision(actor: Actor, camera: Camera): void {
    const context: Context = actor.context;

    actor.addEventListener(EntityEvent.Moving, function() {
      if (!CollisionDetector.hasMissInfo(actor)) {
        return;
      }
      let missedEntities: Array<PhysicalEntity> = CollisionDetector.getMissInfo(actor);
      let scene: SceneGraph = context.scene;
      const start = Date.now();

      scene.addTimedEvent(function() {
        // outline the actor in green
        scene.ctx.strokeStyle = "Green";
        for (let entity of missedEntities) {
          for (const segment of scene.getNode(entity.id).allSegments) {
            scene.ctx.beginPath();
            let drawP0 = camera.getDrawCoord(segment.p0);
            let drawP1 = camera.getDrawCoord(segment.p1);
            scene.ctx.moveTo(drawP0.x, drawP0.y);
            scene.ctx.lineTo(drawP1.x, drawP1.y);
            scene.ctx.stroke();
          }
        }
        // Draw for ~1 second.
        return Date.now() > start + 1000;
      });
    });

    actor.addEventListener(EntityEvent.Collision, function() {
      console.log("collision detected");

      if (!CollisionDetector.hasCollideInfo(actor)) {
        console.log("but no info available");
        return;
      }

      const collisionInfo: CollisionInfo = CollisionDetector.getCollideInfo(actor);
      const intersectInfo: IntersectInfo = collisionInfo.intersectInfo;
      const collidedEntity: PhysicalEntity = collisionInfo.entity;
      const collidedFace: Face3D = intersectInfo.face 
      let scene = context.scene;
      const start = Date.now();

      scene.addTimedEvent(function() {
        // outline the actor in green
        scene.ctx.strokeStyle = "Green";
        for (const segment of scene.getNode(actor.id).allSegments) {
          scene.ctx.beginPath();
          let drawP0 = camera.getDrawCoord(segment.p0);
          let drawP1 = camera.getDrawCoord(segment.p1);
          scene.ctx.moveTo(drawP0.x, drawP0.y);
          scene.ctx.lineTo(drawP1.x, drawP1.y);
          scene.ctx.stroke();
        }

        // outline the entity that it collided with in orange.
        scene.ctx.strokeStyle = "Orange";
        for (const segment of scene.getNode(collidedEntity.id).allSegments) {
          scene.ctx.beginPath();
          let drawP0 = camera.getDrawCoord(segment.p0);
          let drawP1 = camera.getDrawCoord(segment.p1);
          scene.ctx.moveTo(drawP0.x, drawP0.y);
          scene.ctx.lineTo(drawP1.x, drawP1.y);
          scene.ctx.stroke();
        }
        
        // draw the collided face red and the other faces orange.
        scene.ctx.strokeStyle = "Red";
        scene.ctx.fillStyle = "Red";
        for (let vertex of collidedFace.vertices()) {
          scene.ctx.beginPath();
          let p0: Point2D =
            camera.getDrawCoord(scene.getDrawCoord(vertex.point));
          let p1: Point2D =
            camera.getDrawCoord(scene.getDrawCoord(vertex.point.add(vertex.u)));
          let p2: Point2D =
            camera.getDrawCoord(scene.getDrawCoord(vertex.point.add(vertex.v)));
          scene.ctx.beginPath();
          scene.ctx.moveTo(p0.x, p0.y);
          scene.ctx.lineTo(p1.x, p1.y);
          scene.ctx.lineTo(p2.x, p2.y);
          scene.ctx.closePath();
          scene.ctx.stroke();
          scene.ctx.fill();
        }

        // Draw for ~1 second.
        return Date.now() > start + 1000;
      });

      CollisionDetector.removeInfo(actor);
    });
  }
}
