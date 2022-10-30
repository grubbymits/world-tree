import { EntityEvent } from "./events.js";
import { CollisionDetector } from "./physics.js";
function getAllSegments(node) {
    let allSegments = new Array();
    node.topSegments.forEach(segment => allSegments.push(segment));
    node.baseSegments.forEach(segment => allSegments.push(segment));
    node.sideSegments.forEach(segment => allSegments.push(segment));
    return allSegments;
}
export class MovableEntityDebug {
    constructor(movable, camera, debugCollision) {
        if (debugCollision) {
            this.debugCollision(movable, camera);
        }
    }
    debugCollision(movable, camera) {
        const context = movable.context;
        movable.addEventListener(EntityEvent.Moving, function () {
            if (!CollisionDetector.hasMissInfo(movable)) {
                return;
            }
            let missedEntities = CollisionDetector.getMissInfo(movable);
            let scene = context.scene;
            const start = Date.now();
            scene.addTimedEvent(function () {
                if (scene.ctx != null) {
                    scene.ctx.strokeStyle = "Green";
                    for (let entity of missedEntities) {
                        let sceneNode = scene.getNode(entity.id);
                        for (const segment of getAllSegments(sceneNode)) {
                            scene.ctx.beginPath();
                            let drawP0 = camera.getDrawCoord(segment.p0);
                            let drawP1 = camera.getDrawCoord(segment.p1);
                            scene.ctx.moveTo(drawP0.x, drawP0.y);
                            scene.ctx.lineTo(drawP1.x, drawP1.y);
                            scene.ctx.stroke();
                        }
                    }
                }
                return Date.now() > start + 1000;
            });
        });
        movable.addEventListener(EntityEvent.Collision, function () {
            console.log("collision detected");
            if (!CollisionDetector.hasCollideInfo(movable)) {
                console.log("but no info available");
                return;
            }
            const collisionInfo = CollisionDetector.getCollideInfo(movable);
            const intersectInfo = collisionInfo.intersectInfo;
            const collidedEntity = collisionInfo.entity;
            const collidedFace = intersectInfo.face;
            let scene = context.scene;
            const start = Date.now();
            scene.addTimedEvent(function () {
                if (scene.ctx != null) {
                    let ctx = scene.ctx;
                    ctx.strokeStyle = "Green";
                    for (const segment of getAllSegments(scene.getNode(movable.id))) {
                        ctx.beginPath();
                        let drawP0 = camera.getDrawCoord(segment.p0);
                        let drawP1 = camera.getDrawCoord(segment.p1);
                        ctx.moveTo(drawP0.x, drawP0.y);
                        ctx.lineTo(drawP1.x, drawP1.y);
                        ctx.stroke();
                    }
                    ctx.strokeStyle = "Orange";
                    for (const segment of getAllSegments(scene.getNode(collidedEntity.id))) {
                        ctx.beginPath();
                        let drawP0 = camera.getDrawCoord(segment.p0);
                        let drawP1 = camera.getDrawCoord(segment.p1);
                        ctx.moveTo(drawP0.x, drawP0.y);
                        ctx.lineTo(drawP1.x, drawP1.y);
                        ctx.stroke();
                    }
                    ctx.strokeStyle = "Red";
                    ctx.fillStyle = "Red";
                    for (let vertex of collidedFace.vertices()) {
                        ctx.beginPath();
                        let p0 = camera.getDrawCoord(scene.graph.getDrawCoord(vertex.point));
                        let p1 = camera.getDrawCoord(scene.graph.getDrawCoord(vertex.point.add(vertex.u)));
                        let p2 = camera.getDrawCoord(scene.graph.getDrawCoord(vertex.point.add(vertex.v)));
                        ctx.beginPath();
                        ctx.moveTo(p0.x, p0.y);
                        ctx.lineTo(p1.x, p1.y);
                        ctx.lineTo(p2.x, p2.y);
                        ctx.closePath();
                        ctx.stroke();
                        ctx.fill();
                    }
                }
                return Date.now() > start + 1000;
            });
            CollisionDetector.removeInfo(movable);
        });
    }
}
