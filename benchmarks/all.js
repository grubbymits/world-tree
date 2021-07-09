import * as WT from '../dist/world-tree.js';

function benchmark_scene() {
  const cellsX = 20;
  const cellsY = 20;
  const numTerraces = 5;
  const terraceMap = [ [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 ],
                       [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 ],
                       [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 ],
                       [ 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 ],
                       [ 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 ],
                       [ 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 ],
                       [ 0, 1, 2, 2, 2, 2, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 ],
                       [ 0, 1, 1, 2, 2, 2, 2, 2, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 ],
                       [ 0, 1, 2, 3, 3, 4, 3, 2, 2, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 ],
                       [ 0, 1, 2, 3, 4, 5, 4, 2, 2, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 ],
                       [ 0, 1, 2, 3, 4, 4, 3, 2, 2, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 ],
                       [ 0, 1, 2, 3, 3, 2, 2, 2, 2, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 ],
                       [ 0, 1, 1, 2, 2, 2, 2, 2, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 ],
                       [ 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 ],
                       [ 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 ],
                       [ 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 ],
                       [ 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 ],
                       [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 ],
                       [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 ],
                       [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 ] ];
  
  const tileDims = new WT.Dimensions(12, 12, 12);
  const worldDims = new WT.Dimensions(tileDims.width * cellsX,
                                      tileDims.depth * cellsY,
                                      tileDims.height * (numTerraces + 1));
  console.log("Benchmark: scene graph of size", cellsX * cellsY);
  let entities = new Array();

  let context = WT.createTestContext(worldDims);
  for (let y = 0; y < cellsY; ++y) {
    for (let x = 0; x < cellsX; ++x) {
      const minLocation = new WT.Point3D(tileDims.width * x,
                                         tileDims.depth * y,
                                         tileDims.height * terraceMap[y][x]); 
      entities.push(new WT.PhysicalEntity(context, minLocation, tileDims));
    }
  }
  let totalTime = 0;
  let nodes = new Array();
  let scene = new WT.TwoByOneIsometric();
  for (let entity of entities) {
    let node = new WT.SceneNode(entity, scene.getDrawCoord(entity.bounds.minLocation));
    nodes.push(node);
    const startTime = performance.now();
    scene.setDrawCoords(node);
    const endTime = performance.now();
    totalTime += endTime - startTime;
  }
  console.log("total time (ms) to set draw coords:", totalTime);
  
  nodes.sort((a, b) => {
                if (a.minZ < b.minZ)
                  return WT.RenderOrder.Before;
                if (a.minZ > b.minZ)
                  return WT.RenderOrder.After;
                return WT.RenderOrder.Any;
             });
  nodes.forEach((node) => scene.insertIntoLevel(node));
  const startBuildTime = performance.now();
  scene.buildLevels();
  const endBuildTime = performance.now();
  console.log("total time (ms) to build initial graphs:", endBuildTime - startBuildTime);

  const startUpdateTime = performance.now();
  for (let node of nodes) {
    scene.updateNode(node);
  }
  const endUpdateTime = performance.now();
  console.log("total time (ms) to update all nodes:", endUpdateTime - startUpdateTime);
}

function benchmark_collision() {
  const cellsX = 20;
  const cellsY = 20;
  const numTerraces = 1;
  const terraceMap = [ [ 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1 ],
                       [ 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1 ],
                       [ 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1 ],
                       [ 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1 ],
                       [ 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1 ],
                       [ 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1 ],
                       [ 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1 ],
                       [ 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1 ],
                       [ 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1 ],
                       [ 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1 ],
                       [ 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1 ],
                       [ 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1 ],
                       [ 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1 ],
                       [ 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1 ],
                       [ 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1 ],
                       [ 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1 ],
                       [ 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1 ],
                       [ 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1 ],
                       [ 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1 ],
                       [ 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1 ] ];
  const tileDims = new WT.Dimensions(12, 12, 12);
  const worldDims = new WT.Dimensions(tileDims.width * cellsX,
                                      tileDims.depth * cellsY,
                                      tileDims.height * (numTerraces + 1));
  let context = WT.createTestContext(worldDims);
  let entities = new Array();
  for (let y = 0; y < cellsY; ++y) {
    for (let x = 0; x < cellsX; ++x) {
      const minLocation = new WT.Point3D(tileDims.width * x,
                                         tileDims.depth * y,
                                         tileDims.height * terraceMap[y][x]); 
      entities.push(new WT.PhysicalEntity(context, minLocation, tileDims));
    }
  }
  const actorDims = new WT.Dimensions(5, 5, 7);
  const maxAngle = new WT.Vector3D(0, 0, 0);
  const moveVectors = [ new WT.Vector3D(0, 1, 0),
                        new WT.Vector3D(1, 0, 0),
                        new WT.Vector3D(-1, 0, 0),
                        new WT.Vector3D(0, -1, 0),
                      ];
  let actors = new Array();
  for (let i = 0; i < 10; ++i) {
    let position = new WT.Point3D(tileDims.width + (actorDims.width * i * 4),
                                  tileDims.depth + (actorDims.depth * i * 4),
                                  tileDims.height + 1);
    let actor = new WT.Actor(context, position, actorDims);
    actor.addEventListener(WT.EntityEvent.EndMove, function() {
      let moveVector = moveVectors[i % moveVectors.length];
      actor.action = new WT.MoveDirection(actor, moveVector, maxAngle, context.bounds);
    });
    let moveVector = moveVectors[i % moveVectors.length];
    actor.action = new WT.MoveDirection(actor, moveVector, maxAngle, context.bounds);
    actors.push(actor);
  }

  console.log("Benchmark: collision between actors", actors.length);
  const startTime = performance.now();
  for (let i = 0; i < 1000; ++i) {
    actors.forEach(actor => { actor.update(); });
  }
  const endTime = performance.now();
  console.log("total time (ms) to run 1000 frames:", endTime - startTime);
}

benchmark_scene();
benchmark_collision();
