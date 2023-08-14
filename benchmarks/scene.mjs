import * as WT from "../dist/world-tree.mjs";

class WorldConfig {
  constructor() {
    this._cellsX = 20;
    this._cellsY = 30;
    this._numTerraces = 5;
    this._terraceMap = [
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 1, 2, 2, 2, 2, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 1, 1, 2, 2, 2, 2, 2, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 1, 2, 3, 3, 4, 3, 2, 2, 2, 2, 1, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 1, 2, 3, 4, 5, 4, 3, 3, 2, 2, 1, 1, 0, 0, 0, 0, 0, 0, 0],
      [0, 1, 2, 3, 4, 4, 3, 3, 3, 2, 2, 1, 1, 1, 0, 0, 0, 0, 0, 0],
      [0, 1, 2, 3, 3, 3, 3, 3, 2, 2, 2, 1, 1, 1, 1, 0, 0, 0, 0, 0],
      [0, 1, 1, 2, 2, 2, 3, 2, 1, 2, 2, 1, 1, 1, 1, 0, 0, 0, 0, 0],
      [0, 1, 1, 1, 2, 2, 2, 1, 1, 2, 2, 1, 1, 1, 0, 0, 0, 0, 0, 0],
      [0, 1, 1, 1, 2, 2, 2, 2, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0],
      [0, 1, 1, 1, 2, 2, 2, 2, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0],
      [0, 1, 2, 2, 2, 3, 3, 2, 2, 2, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0],
      [0, 1, 1, 2, 2, 3, 3, 2, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 1, 2, 3, 3, 4, 3, 2, 2, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 1, 2, 3, 4, 5, 4, 2, 2, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 1, 2, 3, 4, 4, 3, 2, 2, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 1, 2, 3, 3, 2, 2, 2, 2, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 1, 1, 2, 2, 2, 2, 2, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0],
      [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 1, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    ];
    this._tileDims = new WT.Dimensions(12, 12, 12);
    this._worldDims = new WT.Dimensions(
      this._tileDims.width * this._cellsX,
      this._tileDims.depth * this._cellsY,
      this._tileDims.height * (this._numTerraces + 1),
    );
    this._context = WT.createTestContext(
      this._worldDims,
      WT.Perspective.TwoByOneIsometric,
    );
    this._camera = new WT.Camera(this.scene, 1024, 1024);
    this._camera.location = new WT.Point3D(0, 0, 0);
    this._entities = new Array();

    for (let y = 0; y < this._cellsY; ++y) {
      for (let x = 0; x < this._cellsX; ++x) {
        let terrace = this._terraceMap[y][x];
        for (let z = 0; z < terrace + 1; ++z) {
          const minLocation = new WT.Point3D(
            this._tileDims.width * x,
            this._tileDims.depth * y,
            this._tileDims.height * terrace,
          );
          this._entities.push(
            new WT.PhysicalEntity(this._context, minLocation, this._tileDims),
          );
        }
      }
    }
  }
  get scene() {
    return this._context.scene;
  }
  get camera() {
    return this._camera;
  }
  get entities() {
    return this._entities;
  }
}

export function benchmark_draw_coords() {
  let totalTime = 0;
  let world = new WorldConfig();
  const startTime = performance.now();
  for (let node of world.scene.nodes.values()) {
    world.scene.graph.setDrawOutline(node);
  }
  const endTime = performance.now();
  return endTime - startTime;
}

export function benchmark_build_levels() {
  let world = new WorldConfig();
  const startTime = performance.now();
  const force = true;
  // Run 20 times to amortise the cost of graph initialisation.
  const N = 20;
  for (let i = 0; i < N; i++) {
    world.scene.render(world.camera, force);
  }
  const endTime = performance.now();
  return (endTime - startTime) / N;
}

export function benchmark_update_everything() {
  let world = new WorldConfig();
  const force = true;
  const startTime = performance.now();
  world.entities.forEach((entity) => world.scene.updateEntity(entity));
  world.scene.render(world.camera, force);
  const endTime = performance.now();
  return (endTime - startTime);
}
