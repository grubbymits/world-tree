import * as WT from '../dist/world-tree.js';

class WorldConfig {
  constructor() {
    this._cellsX = 20;
    this._cellsY = 30;
    this._numTerraces = 5;
    this._terraceMap = [ [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 ],
                         [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 ],
                         [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 ],
                         [ 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 ],
                         [ 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 ],
                         [ 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 ],
                         [ 0, 1, 2, 2, 2, 2, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0 ],
                         [ 0, 1, 1, 2, 2, 2, 2, 2, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0 ],
                         [ 0, 1, 2, 3, 3, 4, 3, 2, 2, 2, 2, 1, 0, 0, 0, 0, 0, 0, 0, 0 ],
                         [ 0, 1, 2, 3, 4, 5, 4, 3, 3, 2, 2, 1, 1, 0, 0, 0, 0, 0, 0, 0 ],
                         [ 0, 1, 2, 3, 4, 4, 3, 3, 3, 2, 2, 1, 1, 1, 0, 0, 0, 0, 0, 0 ],
                         [ 0, 1, 2, 3, 3, 3, 3, 3, 2, 2, 2, 1, 1, 1, 1, 0, 0, 0, 0, 0 ],
                         [ 0, 1, 1, 2, 2, 2, 3, 2, 1, 2, 2, 1, 1, 1, 1, 0, 0, 0, 0, 0 ],
                         [ 0, 1, 1, 1, 2, 2, 2, 1, 1, 2, 2, 1, 1, 1, 0, 0, 0, 0, 0, 0 ],
                         [ 0, 1, 1, 1, 2, 2, 2, 2, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0 ],
                         [ 0, 1, 1, 1, 2, 2, 2, 2, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0 ],
                         [ 0, 1, 2, 2, 2, 3, 3, 2, 2, 2, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0 ],
                         [ 0, 1, 1, 2, 2, 3, 3, 2, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0 ],
                         [ 0, 1, 2, 3, 3, 4, 3, 2, 2, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0 ],
                         [ 0, 1, 2, 3, 4, 5, 4, 2, 2, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0 ],
                         [ 0, 1, 2, 3, 4, 4, 3, 2, 2, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0 ],
                         [ 0, 1, 2, 3, 3, 2, 2, 2, 2, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0 ],
                         [ 0, 1, 1, 2, 2, 2, 2, 2, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0 ],
                         [ 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 0, 0, 0, 0, 0, 0, 0, 0 ],
                         [ 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0 ],
                         [ 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0 ],
                         [ 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 1, 0, 0, 0, 0, 0, 0, 0 ],
                         [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 ],
                         [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 ],
                         [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 ] ];
    this._tileDims = new WT.Dimensions(12, 12, 12);
    this._worldDims = new WT.Dimensions(this._tileDims.width * this._cellsX,
                                        this._tileDims.depth * this._cellsY,
                                        this._tileDims.height * (this._numTerraces + 1));
    this._entities = new Array();
    this._context = WT.createTestContext(this._worldDims);
    for (let y = 0; y < this._cellsY; ++y) {
      for (let x = 0; x < this._cellsX; ++x) {
        let terrace = this._terraceMap[y][x];
        for (let z = 0; z < terrace + 1; ++z) {
          const minLocation = new WT.Point3D(this._tileDims.width * x,
                                             this._tileDims.depth * y,
                                             this._tileDims.height * terrace);
          this._entities.push(new WT.PhysicalEntity(this._context, minLocation, this._tileDims));
        }
      }
    }
    this._nodes = new Array();
    this._scene = new WT.TwoByOneIsometric();
    for (let entity of this._entities) {
      this._nodes.push(new WT.SceneNode(entity, this._scene.getDrawCoord(entity.bounds.minLocation)));
    }
  }
}


export function benchmark_draw_coords() {
  let totalTime = 0;
  let world = new WorldConfig();
  for (let node of world._nodes) {
    const startTime = performance.now();
    world._scene.setDrawCoords(node);
    const endTime = performance.now();
    totalTime += endTime - startTime;
  }
  return totalTime;
}

export function benchmark_build_levels() { 
  let world = new WorldConfig();
  world._nodes.sort((a, b) => {
                if (a.minZ < b.minZ)
                  return WT.RenderOrder.Before;
                if (a.minZ > b.minZ)
                  return WT.RenderOrder.After;
                return WT.RenderOrder.Any;
             });
  world._nodes.forEach((node) => world._scene.insertIntoLevel(node));
  const startTime = performance.now();
  world._scene.buildLevels();
  const endTime = performance.now();
  let totalTime = endTime - startTime;
  return totalTime;
}

