import { AudioController } from "./audio.ts";
import { MovableEntity, PhysicalEntity } from "./entity.ts";
import { Terrain, TerrainType, TerrainSpriteDescriptor } from "./terrain.ts";
import { EntityEvent } from "./events.ts";
import { TerrainBuilder } from "./terrain/builder.ts";
import { BiomeConfig } from "./terrain/biomes.ts";
import {
  Perspective,
  Scene,
  TrueIsometric,
  TwoByOneIsometric,
  getPerspectiveFromString,
  getDimensionsFromPerspective,
} from "./scene.ts";
import {
  Renderer,
  DummyRenderer,
  OffscreenRenderer,
  OnscreenRenderer,
} from "./render.ts";
import { SpriteSheet } from "./graphics.ts";
import { Camera } from "./camera.ts";
import {
  BoundingCuboid,
  CollisionDetector,
  Dimensions,
  Gravity,
  Octree,
} from "./physics.ts";
import { Point3D } from './utils/geometry3d.ts';

export interface Context {
  update(camera: Camera): void;
  addController(controller: Controller): void;
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

  static reset(): void {
    PhysicalEntity.reset();
    Terrain.reset();
    SpriteSheet.reset();
  }

  constructor(
    private readonly _tileDims: Dimensions,
    worldDims: Dimensions,
    perspective: Perspective) {
    this._spatialGraph = new Octree(worldDims);
    CollisionDetector.init(this._spatialGraph);
    switch (perspective) {
      default:
        console.error("unhandled perspective");
        break;
      case Perspective.TrueIsometric:
        this._scene = new Scene(new TrueIsometric());
        break;
      case Perspective.TwoByOneIsometric:
        this._scene = new Scene(new TwoByOneIsometric());
        break;
    }
    this._renderer = new DummyRenderer();
  }

  get tileDims(): Dimensions {
    return this._tileDims;
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

  addUpdateableEntity(entity: PhysicalEntity): void {
    this._updateables.push(entity);
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

  scaleGridToWorld(x: number, y: number, z: number): Point3D {
    const gap = 0.001;
    const gapX = x * gap;
    const gapY = y * gap;
    const gapZ = z * gap;
    return new Point3D(x * this.tileDims.width + gapX,
                       y * this.tileDims.depth + gapY,
                       z * this.tileDims.height + gapZ);
  }

  scaleWorldToGrid(loc: Point3D): Point3D {
    // round down
    const width = this.bounds.width;
    const depth = this.bounds.depth;
    const height = this.bounds.height;
    const x = loc.x - (loc.x % width);
    const y = loc.y - (loc.y % depth);
    const z = loc.z - (loc.z % height);
    // then scale to grid
    return new Point3D(
      Math.floor(x / width),
      Math.floor(y / depth),
      Math.floor(z / height)
    );
  }
}

export function createContext(
  canvas: HTMLCanvasElement,
  tileDims: Dimensions,
  worldDims: Dimensions,
  perspective: Perspective
): ContextImpl {
  ContextImpl.reset();
  const context = new ContextImpl(tileDims, worldDims, perspective);
  context.addOnscreenRenderer(canvas);
  return context;
}

export function createTestContext(
  tileDims: Dimensions,
  worldDims: Dimensions,
  perspective: Perspective
): ContextImpl {
  ContextImpl.reset();
  const context = new ContextImpl(tileDims, worldDims, perspective);
  return context;
}

export interface WorldDescriptor {
  canvasName: string;
  projection: string;
  heightMap: Array<Array<number>>;
  numTerraces: number;
  floor: TerrainType,
  wall: TerrainType,
  biomeConfig: BiomeConfig;
  terrainSpriteDescriptor: TerrainSpriteDescriptor;
};

export async function createWorld(worldDesc: WorldDescriptor): Promise<ContextImpl>{
  const terrainSpriteDesc = worldDesc.terrainSpriteDescriptor;
  const spriteWidth = terrainSpriteDesc.spriteWidth;
  const spriteHeight = terrainSpriteDesc.spriteHeight;
  const perspective = getPerspectiveFromString(worldDesc.projection);
  const tileDims = getDimensionsFromPerspective(spriteWidth, spriteHeight, perspective);
  console.log('tile dimensions:', tileDims);
  const cellsY = worldDesc.heightMap.length;
  const cellsX = worldDesc.heightMap[0].length;
  const cellsZ = 1 + worldDesc.numTerraces;
  const worldDims = new Dimensions(
    tileDims.width * cellsX,
    tileDims.depth * cellsY,
    tileDims.height * cellsZ
  );
  const canvas = <HTMLCanvasElement>document.getElementById(worldDesc.canvasName)!;
  const context = createContext(
    canvas,
    tileDims,
    worldDims,
    perspective,
  );
  await Terrain.generateSprites(terrainSpriteDesc, context).then(() => {
    const builder = new TerrainBuilder(
      worldDesc.heightMap,
      worldDesc.numTerraces,
      worldDesc.floor,
      worldDesc.wall,
      tileDims, 
    );
    if (Object.hasOwn(worldDesc, 'biomeConfig')) {
      builder.generateBiomes(worldDesc.biomeConfig);
    }
    builder.generateMap(context);
  });
  return context;
}
