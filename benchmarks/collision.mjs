import * as WT from "../dist/world-tree.mjs";

export function benchmark_collision() {
  const cellsX = 20;
  const cellsY = 20;
  const numTerraces = 1;
  const terraceMap = [
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  ];
  const tileDims = new WT.Dimensions(12, 12, 12);
  const worldDims = new WT.Dimensions(
    tileDims.width * cellsX,
    tileDims.depth * cellsY,
    tileDims.height * (numTerraces + 1),
  );
  let context = WT.createTestContext(
    worldDims,
    WT.Perspective.TwoByOneIsometric,
  );
  for (let y = 0; y < cellsY; ++y) {
    for (let x = 0; x < cellsX; ++x) {
      const minLocation = new WT.Point3D(
        tileDims.width * x,
        tileDims.depth * y,
        tileDims.height * terraceMap[y][x],
      );
      new WT.PhysicalEntity(context, minLocation, tileDims);
    }
  }
  const actorDims = new WT.Dimensions(5, 5, 7);
  const maxAngle = new WT.Vector3D(0, 0, 0);
  const moveVectors = [
    new WT.Vector3D(0, 1, 0),
    new WT.Vector3D(1, 0, 0),
    new WT.Vector3D(-1, 0, 0),
    new WT.Vector3D(0, -1, 0),
  ];
  let actors = new Array();
  for (let i = 0; i < 10; ++i) {
    let position = new WT.Point3D(
      tileDims.width + (actorDims.width * i * 4),
      tileDims.depth + (actorDims.depth * i * 4),
      tileDims.height + 1,
    );
    let actor = new WT.Actor(context, position, actorDims);
    actor.addEventListener(WT.EntityEvent.EndMove, function () {
      let moveVector = moveVectors[i % moveVectors.length];
      actor.action = new WT.MoveDirection(
        actor,
        moveVector,
        maxAngle
      );
    });
    let moveVector = moveVectors[i % moveVectors.length];
    actor.action = new WT.MoveDirection(
      actor,
      moveVector,
      maxAngle
    );
    actors.push(actor);
  }

  const startTime = performance.now();
  const n = 1000;
  for (let i = 0; i < n; ++i) {
    actors.forEach((actor) => {
      actor.update();
    });
  }
  const endTime = performance.now();
  return (endTime - startTime) / n;
}
