import { Point2D } from "./geometry.ts"
import { DrawElement, GraphicEvent } from "./graphics.ts"

const ctx: Worker = self as any;
const sprites = new Array<ImageBitmap>();

ctx.addEventListener("message", (event) => {
  switch (e.data.type) {
    default:
      console.error("unhandled graphic event");
      break;
    case GraphicEvent.AddCanvas:
      this.width = event.data.width;
      this.height = event.data.height;
      this.offscreen = Offscreenevent.data.offscreen;
      break;
    case GraphicEvent.AddSprite: {
      const id = event.data.id;
      const sprite = event.data.sprite
      if (id == this.sprites.length) {
        this.sprites.push(sprite);
      } else if (id < this.sprites.length) {
        this.sprites[id] = sprite;
      } else {
        for (let i = this.sprites.length; i < id; ++i) {
          this.sprites.push({});
        }
        this.sprites.push(sprite);
      }
      break;
    }
    case GraphicEvent.Draw: {
      let nodes = event.data.nodes;
      this.offscreen!.clearRect(0, 0, this.width, this.height);
      for (let i in nodes) {
        const spriteId: number = nodes[i].spriteId;
        const coord: Point2D = nodes[i].coord;
        this.offscreen.draw(this.sprites[spriteId], coord.x, coord.y);
      }
      break;
    }
  }
}

export {};
