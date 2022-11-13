//deno-lint-ignore-file no-explicit-any

import { Direction } from "./navigation.ts"
import { Dimensions,
         BoundingCuboid } from "./physics.ts"
import { Point3D,
         Vector3D,
         Geometry,
         CuboidGeometry } from "./geometry.ts"
import { GraphicComponent } from "./graphics.ts"
import { ContextImpl } from "./context.ts"
import { Action } from "./action.ts"
import { EntityEvent,
         EventHandler } from "./events.ts"

export class PhysicalEntity {
  private static _ids = 0;

  protected readonly _id: number;

  protected _visible = true;
  protected _drawable = false;
  protected _geometry: Geometry;
  protected _drawGeometry = false;
  protected _handler = new EventHandler<EntityEvent>();
  protected _graphicComponents: Array<GraphicComponent> =
    new Array<GraphicComponent>();

  static reset(): void {
    this._ids = 0;
  }

  static getNumEntities(): number {
    return this._ids;
  }

  constructor(protected _context: ContextImpl,
              minLocation: Point3D,
              dimensions: Dimensions) {
    this._id = PhysicalEntity._ids;
    PhysicalEntity._ids++;
    const centre = new Point3D(minLocation.x + (dimensions.width / 2),
                               minLocation.y + (dimensions.depth / 2),
                               minLocation.z + (dimensions.height / 2));
    const bounds = new BoundingCuboid(centre, dimensions);
    this._geometry = new CuboidGeometry(bounds);
    this._context.addEntity(this);
  }

  get context(): ContextImpl { return this._context; }  
  get geometry(): Geometry { return this._geometry; }
  get bounds(): BoundingCuboid { return this._geometry.bounds; }
  get dimensions(): Dimensions { return this.bounds.dimensions; }
  get x(): number { return this.bounds.minX; }
  get y(): number { return this.bounds.minY; }
  get z(): number { return this.bounds.minZ; }
  get width(): number { return this.bounds.width; }
  get depth(): number { return this.bounds.depth; }
  get height(): number { return this.bounds.height; }
  get centre(): Point3D { return this.bounds.centre; }
  get id(): number { return this._id; }
  get visible(): boolean { return this._visible; }
  set visible(visible: boolean) { this._visible = visible; }
  get drawable(): boolean { return this._drawable; }
  get drawGeometry(): boolean { return this._drawGeometry; }
  get graphics(): Array<GraphicComponent> {
    return this._graphicComponents;
  }
  get graphic(): GraphicComponent {
    return this._graphicComponents[0];
  }

  addGraphic(graphic: GraphicComponent): void {
    this._drawable = true;
    this._graphicComponents.push(graphic);
  }

  updatePosition(d: Vector3D): void {
    this.bounds.update(d);
    this.geometry.transform(d);
  }

  addEventListener(event: EntityEvent, callback: any): void {
    this._handler.addEventListener(event, callback);
  }

  removeEventListener(event: EntityEvent, callback: any): void {
    this._handler.removeEventListener(event, callback);
  }

  postEvent(event: EntityEvent): void {
    this._handler.post(event);
  }

  update(): void { this._handler.service(); }
}

export class MovableEntity extends PhysicalEntity {
  protected readonly _lift = 0;
  protected readonly _canSwim = false;
  protected _direction: Direction;

  constructor(context: ContextImpl,
              location: Point3D,
              dimensions: Dimensions) {
    super(context, location, dimensions);
    context.addMovableEntity(this);
  }

  updatePosition(d: Vector3D): void {
    this.bounds.update(d);
    this.geometry.transform(d);
    this.postEvent(EntityEvent.Moving);
  }

  get lift(): number { return this._lift; }
  get direction(): Direction { return this._direction; }
  set direction(direction: Direction) {
    this._direction = direction;
    this.postEvent(EntityEvent.FaceDirection);
  }
}

export class Actor extends MovableEntity {
  protected _action: Action|null;

  constructor(context: ContextImpl,
              location: Point3D,
              dimensions: Dimensions) {
    super(context, location, dimensions);
    context.addUpdateableEntity(this);
  }

  update(): void {
    super.update();
    if (this._action != undefined && this._action.perform()) {
      this._action = null;
    }
  }

  set action(action: Action) {
    this._action = action;
  }
}

export function createGraphicalEntity(context: ContextImpl,
                                      location: Point3D,
                                      dimensions: Dimensions,
                                      graphicComponent: GraphicComponent) {
  const entity = new PhysicalEntity(context, location, dimensions);
  entity.addGraphic(graphicComponent);
  return entity;
}

export function createGraphicalMovableEntity(context: ContextImpl,
                                             location: Point3D,
                                             dimensions: Dimensions,
                                             graphicComponent: GraphicComponent) {
  const entity = new MovableEntity(context, location, dimensions);
  entity.addGraphic(graphicComponent);
  return entity;
}

export function createGraphicalActor(context: ContextImpl,
                                     location: Point3D,
                                     dimensions: Dimensions,
                                     graphicComponent: GraphicComponent) {
  const actor = new Actor(context, location, dimensions);
  actor.addGraphic(graphicComponent);
  return actor;
}
