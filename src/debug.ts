import { ContextImpl } from "./context.ts";
import { MovableEntity, PhysicalEntity } from "./entity.ts";
import { EntityEvent } from "./events.ts";
import { CollisionDetector, CollisionInfo } from "./physics.ts";
import { Face3D, IntersectInfo, Point2D } from "./geometry.ts";
import { Camera } from "./camera.ts";
import { SceneNode, Scene } from "./scene.ts";

export class MovableEntityDebug {
  constructor(movable: MovableEntity, camera: Camera, debugCollision: boolean) {
    if (debugCollision) {
      this.debugCollision(movable, camera);
    }
  }

  private debugCollision(movable: MovableEntity, camera: Camera): void {
    const context: ContextImpl = movable.context;

    movable.addEventListener(EntityEvent.Moving, function () {
      if (!CollisionDetector.hasMissInfo(movable)) {
        return;
      }
      const missedEntities: Array<PhysicalEntity> =
        CollisionDetector.getMissInfo(movable);
      const scene: Scene = context.scene;
      const start = Date.now();

      scene.addTimedEvent(function () {
        if (scene.ctx != null) {
          // outline the movable in green
          scene.ctx!.strokeStyle = "Green";
          for (const entity of missedEntities) {
            const sceneNode = scene.getNode(entity.id);
            scene.ctx!.beginPath();
            scene.ctx!.moveTo(sceneNode.top2D.x, sceneNode.top2D.y);
            scene.ctx!.lineTo(sceneNode.max2D.x, sceneNode.max2D.y);
            scene.ctx!.lineTo(sceneNode.bottom2D.x, sceneNode.bottom2D.y);
            scene.ctx!.lineTo(sceneNode.min2D.x, sceneNode.min2D.y);
            scene.ctx!.lineTo(sceneNode.top2D.x, sceneNode.top2D.y);
            scene.ctx!.stroke();
          }
        }
        // Draw for ~1 second.
        return Date.now() > start + 1000;
      });
    });

    movable.addEventListener(EntityEvent.Collision, function () {
      console.log("collision detected");

      if (!CollisionDetector.hasCollideInfo(movable)) {
        console.log("but no info available");
        return;
      }

      const collisionInfo: CollisionInfo =
        CollisionDetector.getCollideInfo(movable);
      const intersectInfo: IntersectInfo = collisionInfo.intersectInfo;
      const collidedEntity: PhysicalEntity = collisionInfo.entity;
      const collidedFace: Face3D = intersectInfo.face;
      const scene = context.scene;
      const start = Date.now();

      scene.addTimedEvent(function () {
        if (scene.ctx != null) {
          // outline the movable in green
          const ctx = scene.ctx!;
          ctx.strokeStyle = "Green";
          let sceneNode = scene.getNode(movable.id);
          ctx.beginPath();
          ctx.moveTo(sceneNode.top2D.x, sceneNode.top2D.y);
          ctx.lineTo(sceneNode.max2D.x, sceneNode.max2D.y);
          ctx.lineTo(sceneNode.bottom2D.x, sceneNode.bottom2D.y);
          ctx.lineTo(sceneNode.min2D.x, sceneNode.min2D.y);
          ctx.lineTo(sceneNode.top2D.x, sceneNode.top2D.y);
          ctx.stroke();

          // outline the entity that it collided with in orange.
          ctx.strokeStyle = "Orange";
          sceneNode = scene.getNode(collidedEntity.id);
          ctx.beginPath();
          ctx.moveTo(sceneNode.top2D.x, sceneNode.top2D.y);
          ctx.lineTo(sceneNode.max2D.x, sceneNode.max2D.y);
          ctx.lineTo(sceneNode.bottom2D.x, sceneNode.bottom2D.y);
          ctx.lineTo(sceneNode.min2D.x, sceneNode.min2D.y);
          ctx.lineTo(sceneNode.top2D.x, sceneNode.top2D.y);
          ctx.stroke();

          // draw the collided face red and the other faces orange.
          ctx.strokeStyle = "Red";
          ctx.fillStyle = "Red";
          for (const vertex of collidedFace.vertices()) {
            ctx.beginPath();
            const p0: Point2D = camera.getDrawCoord(
              scene.graph.getDrawCoord(vertex.point)
            );
            const p1: Point2D = camera.getDrawCoord(
              scene.graph.getDrawCoord(vertex.point.add(vertex.u))
            );
            const p2: Point2D = camera.getDrawCoord(
              scene.graph.getDrawCoord(vertex.point.add(vertex.v))
            );
            ctx.beginPath();
            ctx.moveTo(p0.x, p0.y);
            ctx.lineTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.closePath();
            ctx.stroke();
            ctx.fill();
          }
        }

        // Draw for ~1 second.
        return Date.now() > start + 1000;
      });

      CollisionDetector.removeInfo(movable);
    });
  }
}
