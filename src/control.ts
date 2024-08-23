import { Actor } from "./entity.ts";
import { Jump, MoveDirection, Navigate } from "./action.ts";
import { ContextImpl } from "./context.ts";
import { Camera } from "./camera.ts";
import { Point3D, Vector3D } from "./utils/geometry3d.ts";
import { BlockingGrid, Direction, Compass } from "./utils/navigation.ts";

export function TouchOrClickNav(context: ContextImpl,
                                canvas: HTMLCanvasElement,
                                camera: Camera,
                                actor: Actor,
                                blockingGrid: BlockingGrid,
                                speed: number): void {
  canvas.addEventListener("mousedown", (e) => {
    if (e.button == 0) {
      const destination = context.scene.getLocationAt(e.offsetX, e.offsetY, camera);
      if (destination) {
        actor.action = new Navigate(actor, speed, destination!, blockingGrid);
      }
    }
  });
  canvas.addEventListener("touchstart", (e) => {
    const touch = e.touches[0];
    const destination = context.scene.getLocationAt(touch.pageX, touch.pageY, camera);
    if (destination) {
      actor.action = new Navigate(actor, speed, destination!, blockingGrid);
    }
  });
}

const activeArrowKeys = new Set<Direction>();
export function ArrowKeyMovement(canvas: HTMLCanvasElement,
                                 actor: Actor,
                                 speed: number): void {

  const actionFromKeys = (actor: Actor) => {
    let d = new Vector3D(0, 0, 0);
    for (let direction of activeArrowKeys) {
      d = d.add(Compass.getVector3D(direction));
    }
    if (!d.zero) {
      actor.action = new MoveDirection(actor, d.norm().scale(speed));
    } else {
      actor.action = new MoveDirection(actor, d);
    }
  };

  canvas.addEventListener('keydown', (e) => {
    switch (e.key) {
    default: return;
    case 'ArrowUp':
      activeArrowKeys.add(Direction.North);
      break;
    case 'ArrowDown':
      activeArrowKeys.add(Direction.South);
      break;
    case 'ArrowLeft':
      activeArrowKeys.add(Direction.West);
      break;
    case 'ArrowRight':
      activeArrowKeys.add(Direction.East);
      break;
    }
    actionFromKeys(actor);
  });
  canvas.addEventListener('keyup', (e) => {
    switch (e.key) {
    default: return;
    case 'ArrowUp':
      activeArrowKeys.delete(Direction.North);
      break;
    case 'ArrowDown':
      activeArrowKeys.delete(Direction.South);
      break;
    case 'ArrowLeft':
      activeArrowKeys.delete(Direction.West);
      break;
    case 'ArrowRight':
      activeArrowKeys.delete(Direction.East);
      break;
    }
    actionFromKeys(actor);
  });
}

export function SpaceJump(canvas: HTMLCanvasElement,
                          actor: Actor,
                          speed: number): void {
  canvas.addEventListener('keydown', (e) => {
    if (e.key == ' ') {
      let d = new Vector3D(0, 0, speed);
      for (let direction of activeArrowKeys) {
        d = d.add(Compass.getVector3D(direction));
      }
      actor.action = new Jump(actor, d);
    }
  });
}
