import { GraphicEvent } from "./world-tree.js"

const ctx = self;
const sprites = new Array();

ctx.addEventListener("message", (e) => {
  console.log("worker msg rx");
  switch (e.data.type) {
    default:
      console.error("unhandled graphic event");
      break;
    case GraphicEvent.AddCanvas:
      console.log(e.data);
      this.width = e.data.width;
      this.height = e.data.height;
      this.offscreen = e.data.offscreen;
      break;
    case GraphicEvent.AddSprite: {
      const id = e.data.id;
      const sprite = e.data.sprite
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
      let nodes = e.data.nodes;
      this.offscreen.clearRect(0, 0, this.width, this.height);
      let i = 0;
      while (i < nodes.length) {
        const spriteId = nodes[i].spriteId;
        const x =  nodes[i+1];
        const y = nodes[i+2];
        this.offscreen.draw(this.sprites[spriteId], x, y);
        i += 3;
      }
      break;
    }
  }
}

export {};
