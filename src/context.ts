import { AudioController } from "./audio.ts";
import {
  BiomeConfig,
  buildBiomes,
} from "./biomes.ts";
import { Camera } from "./camera.ts";
import {
  Actor,
  CuboidEntity,
  MovableEntity,
  PhysicalEntity,
  RampEastEntity,
  RampNorthEntity,
  RampSouthEntity,
  RampWestEntity,
} from "./entity.ts";
import { EntityEvent } from "./events.ts";
import {
  CuboidGeometry,
  Point3D,
} from "./geometry.ts";
import {
  GraphicComponent,
  SpriteSheet
} from "./graphics.ts";
import {
  TerrainGrid,
  TerrainGridDescriptorImpl,
  Tiles,
} from "./grid.ts";
import {
  BoundingCuboid,
  CollisionDetector,
  Dimensions,
  Gravity,
  Octree,
} from "./physics.ts";
import {
  Renderer,
  DummyRenderer,
  OffscreenRenderer,
  OnscreenRenderer,
} from "./render.ts";
import {
  Perspective,
  Scene,
  TwoByOneIsometric,
  getPerspectiveFromString,
  getDimensionsFromPerspective,
} from "./scene.ts";
import {
  buildTerraceGrid,
  buildTerrainShapeGrid,
  buildTerrainTypeGrid,
  findEdges,
  findRamps,
  normaliseHeightGrid,
  TerrainGraphics,
  TerrainType,
  TerrainShape,
  TerrainSpriteDescriptor,
} from "./terraform.ts";

export interface Context {
  update(camera: Camera): void;
  grid: TerrainGrid | null;
  addController(controller: Controller): void;
  createActor(location: Point3D,
              dimensions: Dimensions,
              graphics: GraphicComponent): Actor;
  createMovableEntity(location: Point3D,
                      dimensions: Dimensions,
                      graphics: GraphicComponent): MovableEntity;
  createTerrain(x: number, y: number, z: number,
                terrainType: TerrainType,
                terrainShape: TerrainShape,
                dimension: Dimensions): PhysicalEntity;
  createGraphicalEntity(location: Point3D,
                        dimensions: Dimensions,
                        graphicComponent: GraphicComponent): PhysicalEntity;
  verify(): boolean;
}

export interface Controller {
  update(): void;
}

/** @internal */
export class ContextImpl implements Context {
  private _scene: Scene;
  private _renderer: Renderer;
  private _entities: Array<PhysicalEntity> = new Array<PhysicalEntity>();
  private _updateables: Array<PhysicalEntity> = new Array<PhysicalEntity>();
  private _movables: Array<MovableEntity> = new Array<MovableEntity>();
  private _controllers: Array<Controller> = new Array<Controller>();
  private _spatialGraph: Octree;
  private _totalEntities = 0;
  private _grid: TerrainGrid|null;

  static reset(): void {
    PhysicalEntity.reset();
    TerrainGraphics.reset();
    SpriteSheet.reset();
  }

  constructor(worldDims: Dimensions, perspective: Perspective,
              terrainSpriteWidth: number, terrainSpriteHeight: number) {
    this._spatialGraph = new Octree(worldDims);
    CollisionDetector.init(this._spatialGraph);
    switch (perspective) {
      default:
        console.error("unhandled perspective");
        break;
      case Perspective.TwoByOneIsometric:
        this._scene = new Scene(new TwoByOneIsometric(terrainSpriteWidth, terrainSpriteHeight));
        break;
    }
    this._renderer = new DummyRenderer();
  }

  get scene(): Scene {
    return this._scene;
  }
  get renderer(): Renderer {
    return this._renderer;
  }
  get entities(): Array<PhysicalEntity> {
    return this._entities;
  }
  get movables(): Array<MovableEntity> {
    return this._movables;
  }
  get bounds(): BoundingCuboid {
    return this._spatialGraph.bounds;
  }
  get spatial(): Octree {
    return this._spatialGraph;
  }
  get controllers(): Array<Controller> {
    return this._controllers;
  }
  set grid(g: TerrainGrid|null) {
    this._grid = g;
  }
  get grid(): TerrainGrid | null {
    return this._grid;
  }

  verify(): boolean {
    return (
      this.entities.length == PhysicalEntity.getNumEntities() &&
      this.entities.length == this._totalEntities &&
      this.spatial.verify(this.entities) &&
      this.scene.verifyRenderer(this.entities)
    );
  }

  addOnscreenRenderer(canvas: HTMLCanvasElement): void {
    this._renderer = new OnscreenRenderer(canvas);
  }

  addController(controller: Controller): void {
    this._controllers.push(controller);
  }

  createGraphicalEntity(
    location: Point3D,
    dimensions: Dimensions,
    graphicComponent: GraphicComponent
  ): PhysicalEntity {
    const entity = new PhysicalEntity(location, dimensions, CuboidGeometry);
    entity.addGraphic(graphicComponent);
    this.addEntity(entity);
    return entity;
  }

  createTerrain(x: number, y: number, z: number,
                terrainType: TerrainType,
                terrainShape: TerrainShape,
                dimensions: Dimensions): PhysicalEntity {
    console.assert(x >= 0, 'x < 0');
    console.assert(y >= 0, 'y < 0');
    console.assert(z >= 0, 'z < 0');

    let terrain: new (...args: any[]) => PhysicalEntity;
    let isRamp = true;
    switch (terrainShape) {
    default:
      terrain = CuboidEntity;
      isRamp = false;
      break;
    case TerrainShape.RampNorth:
      terrain = RampNorthEntity;
      break;
    case TerrainShape.RampEast:
      terrain = RampEastEntity;
      break;
    case TerrainShape.RampSouth:
      terrain = RampSouthEntity;
      break;
    case TerrainShape.RampWest:
      terrain = RampWestEntity;
      break;
    }

    const gapX = x * TerrainGrid.gap();
    const gapY = y * TerrainGrid.gap();
    const gapZ = z * TerrainGrid.gap();
    const position = new Point3D(
      x * dimensions.width + gapX,
      y * dimensions.depth + gapY,
      z * dimensions.height + gapZ,
    );
    if (!this.bounds.contains(position)) {
      console.error('terrain out-of-bounds:', position);
    }

    const entity = new terrain(
      position,
      dimensions,
    );
    entity.addGraphic(TerrainGraphics.graphics(terrainType, terrainShape));
    Tiles.add(entity.id, x, y, z);
    this.addEntity(entity);
    return entity;
  }

  createActor(location: Point3D,
              dimensions: Dimensions,
              graphics: GraphicComponent): Actor {
    const actor = new Actor(this.grid!, location, dimensions, graphics);
    this._updateables.push(actor);
    this.addEntity(actor);
    this.addMovableEntity(actor);
    return actor;
  }

  createMovableEntity(location: Point3D,
                      dimensions: Dimensions,
                      graphics: GraphicComponent): MovableEntity {
    const movable = new MovableEntity(
      location,
      dimensions,
      graphics,
    );
    this.addEntity(movable);
    this.addMovableEntity(movable);
    return movable;
  }

  addEntity(entity: PhysicalEntity): void {
    if (this.entities.length == 0) {
      if (entity.id != 0) {
        console.error("Adding entity with unexpected id:", entity.id);
      }
    } else if (this.entities.length > 0) {
      if (entity.id != this.entities[this.entities.length - 1].id + 1) {
        console.error("Adding entity with unexpected id:", entity.id);
      }
    }
    this.entities.push(entity);
    this.spatial.insert(entity);

    this.scene.insertEntity(entity);
    this._totalEntities++;
  }

  addMovableEntity(entity: MovableEntity): void {
    this.movables.push(entity);
    entity.addEventListener(EntityEvent.Moving, () => {
      this.spatial.update(entity);
      this.scene.updateEntity(entity);
    });
  }

  update(camera: Camera): void {
    camera.update();
    AudioController.ensureEnabled();
    const elements = this._scene.render(camera, false);
    this.renderer.draw(elements);

    Gravity.update(this.movables);

    this._updateables.forEach((entity) => {
      entity.update();
    });

    this._controllers.forEach((controller) => {
      controller.update();
    });
  }
}

export function createContext(
  canvas: HTMLCanvasElement,
  worldDims: Dimensions,
  perspective: Perspective,
  terrainSpriteWidth: number,
  terrainSpriteHeight: number
): ContextImpl {
  ContextImpl.reset();
  const context = new ContextImpl(
    worldDims,
    perspective,
    terrainSpriteWidth,
    terrainSpriteHeight
  );
  context.addOnscreenRenderer(canvas);
  return context;
}

export function createTestContext(
  worldDims: Dimensions,
  perspective: Perspective,
  terrainSpriteWidth: number,
  terrainSpriteHeight: number
): ContextImpl {
  ContextImpl.reset();
  const context = new ContextImpl(
    worldDims,
    perspective,
    terrainSpriteWidth,
    terrainSpriteHeight
  );
  return context;
}

export interface WorldDescriptor {
  canvasName: string;
  projection: string;
  heightMap: Array<Array<number>>;
  numTerraces: number;
  hasRamps: boolean;
  defaultTerrainType: TerrainType,
  biomeConfig: BiomeConfig;
  terrainSpriteDescriptor: TerrainSpriteDescriptor;
};

export async function createWorld(worldDesc: WorldDescriptor): Promise<ContextImpl>{
  const startTime = performance.now();
  const terrainSpriteDesc = worldDesc.terrainSpriteDescriptor;
  const spriteWidth = terrainSpriteDesc.spriteWidth;
  const spriteHeight = terrainSpriteDesc.spriteHeight;
  const perspective = getPerspectiveFromString(worldDesc.projection);
  const physicalDims = getDimensionsFromPerspective(
    spriteWidth,
    spriteHeight,
    perspective
  );
  const cellsY = worldDesc.heightMap.length;
  const cellsX = worldDesc.heightMap[0].length;
  const cellsZ = 1 + worldDesc.numTerraces;
  const worldDims = new Dimensions(
    physicalDims.width * cellsX,
    physicalDims.depth * cellsY,
    physicalDims.height * cellsZ
  );
  const canvas = <HTMLCanvasElement>document.getElementById(worldDesc.canvasName)!;
  const context = createContext(
    canvas,
    worldDims,
    perspective,
    spriteWidth,
    spriteHeight
  );
  await TerrainGraphics.generateSprites(terrainSpriteDesc, context).then(() => {
    const terraceSpacing = normaliseHeightGrid(
      worldDesc.heightMap, 
      worldDesc.numTerraces
    );
    const terraceGrid = buildTerraceGrid(
      worldDesc.heightMap,
      terraceSpacing 
    );
    const edges = findEdges(terraceGrid);
    const ramps = worldDesc.hasRamps 
                ? findRamps(terraceGrid, edges)
                : [];
    const shapeGrid = buildTerrainShapeGrid(
      terraceGrid,
      edges,
      ramps
    );
    let typeGrid = new Array<Uint8Array>();
    let biomeGrid = new Array<Uint8Array>();
    if (Object.hasOwn(worldDesc, 'biomeConfig')) {
      biomeGrid = buildBiomes(
        worldDesc.biomeConfig,
        worldDesc.heightMap,
        terraceGrid
      );
      typeGrid = buildTerrainTypeGrid(biomeGrid, worldDesc.defaultTerrainType);
    } else {
      for (let y = 0; y < cellsY; ++y) {
        typeGrid[y] = new Uint8Array(cellsX).fill(worldDesc.defaultTerrainType);
      }
    }

    const terrainGridDescriptor = new TerrainGridDescriptorImpl(
      terraceGrid,
      typeGrid,
      shapeGrid,
      biomeGrid,
      physicalDims,
      cellsX,
      cellsY,
      cellsZ,
      spriteWidth,
      spriteHeight,
    );
    const grid = new TerrainGrid(context, terrainGridDescriptor);
  });
  const endTime = performance.now();
  console.log('world generated in (msec):', endTime - startTime);
  return context;
}
