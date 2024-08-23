//deno-lint-ignore-file no-explicit-any

import { Compass, Direction } from "./utils/navigation.ts";
import { BoundingCuboid, Dimensions } from "./physics.ts";
import { Vector2D } from "./utils/geometry2d.ts";
import {
  Point3D,
  Vector3D,
  Geometry,
  CuboidGeometry,
  RampUpNorthGeometry,
  RampUpEastGeometry,
  RampUpSouthGeometry,
  RampUpWestGeometry,
} from "./utils/geometry3d.ts";
import { GraphicComponent } from "./graphics.ts";
import { ContextImpl } from "./context.ts";
import { Action } from "./action.ts";
import { EntityEvent, EventHandler } from "./events.ts";
import { EntityBounds } from "./bounds.ts";

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

  constructor(
    protected _context: ContextImpl,
    minLocation: Point3D,
    dimensions: Dimensions,
    geometry: new (...args: any[]) => Geometry
  ) {
    this._id = PhysicalEntity._ids;
    PhysicalEntity._ids++;
    const centre = new Point3D(
      minLocation.x + dimensions.width / 2,
      minLocation.y + dimensions.depth / 2,
      minLocation.z + dimensions.height / 2
    );
    this._geometry = new geometry(this.id);
    EntityBounds.addEntity(this.id, minLocation, dimensions);
    this._context.addEntity(this);
  }

  get context(): ContextImpl {
    return this._context;
  }
  get geometry(): Geometry {
    return this._geometry;
  }
  set geometry(g: Geometry) {
    this._geometry = g;
  }
  get dimensions(): Dimensions {
    return EntityBounds.dimensions(this.id);
  }
  get x(): number {
    return EntityBounds.minX(this.id);
  }
  get y(): number {
    return EntityBounds.minY(this.id);
  }
  get z(): number {
    return EntityBounds.minZ(this.id);
  }
  get width(): number {
    return EntityBounds.width(this.id);
  }
  get depth(): number {
    return EntityBounds.depth(this.id);
  }
  get height(): number {
    return EntityBounds.height(this.id);
  }
  get centre(): Point3D {
    return EntityBounds.centre(this.id);
  }
  get id(): number {
    return this._id;
  }
  get visible(): boolean {
    return this._visible;
  }
  set visible(visible: boolean) {
    this._visible = visible;
  }
  get drawable(): boolean {
    return this._drawable;
  }
  get drawGeometry(): boolean {
    return this._drawGeometry;
  }
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
    EntityBounds.translate(this.id, d);
    this.geometry.translate(d);
  }

  quarterTurn(): void {
    EntityBounds.quarterTurn(this.id);
    this.geometry.resetWorld();
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

  update(): void {
    this._handler.service();
  }
}

export class CuboidEntity extends PhysicalEntity {
  constructor(
    context: ContextImpl,
    minLocation: Point3D,
    dimensions: Dimensions
  ) {
    super(context, minLocation, dimensions, CuboidGeometry);
  }
}

export class RampNorthEntity extends PhysicalEntity {
  constructor(
    context: ContextImpl,
    minLocation: Point3D,
    dimensions: Dimensions
  ) {
    super(context, minLocation, dimensions, RampUpNorthGeometry);
  }
}

export class RampEastEntity extends PhysicalEntity {
  constructor(
    context: ContextImpl,
    minLocation: Point3D,
    dimensions: Dimensions
  ) {
    super(context, minLocation, dimensions, RampUpEastGeometry);
  }
}

export class RampSouthEntity extends PhysicalEntity {
  constructor(
    context: ContextImpl,
    minLocation: Point3D,
    dimensions: Dimensions
  ) {
    super(context, minLocation, dimensions, RampUpSouthGeometry);
  }
}

export class RampWestEntity extends PhysicalEntity {
  constructor(
    context: ContextImpl,
    minLocation: Point3D,
    dimensions: Dimensions
  ) {
    super(context, minLocation, dimensions, RampUpWestGeometry);
  }
}

export class MovableEntity extends CuboidEntity {
  protected _gravitySpeed = 0;
  protected readonly _canSwim = false;
  protected _direction: Direction;
  protected _velocity: Vector3D = new Vector3D(0, 0, 0);

  constructor(context: ContextImpl, location: Point3D, dimensions: Dimensions,
              graphics: GraphicComponent) {
    super(context, location, dimensions);
    this.addGraphic(graphics);
    context.addMovableEntity(this);
  }

  updatePosition(d: Vector3D): void {
    EntityBounds.translate(this.id, d);
    this.geometry.translate(d);
    this.postEvent(EntityEvent.Moving);
    const direction = Compass.getFromVector(new Vector2D(d.x, d.y));
    this.direction = direction;
  }

  updatePositionNotDirection(d: Vector3D): void {
    EntityBounds.translate(this.id, d);
    this.geometry.translate(d);
    this.postEvent(EntityEvent.Moving);
  }

  get gravitySpeed(): number {
    return this._gravitySpeed;
  }
  set gravitySpeed(s: number) {
    this._gravitySpeed = s;
  }
  get direction(): Direction {
    return this._direction;
  }
  set direction(direction: Direction) {
    this._direction = direction;
    this.postEvent(EntityEvent.FaceDirection);
  }
  get velocity(): Vector3D {
    return this._velocity;
  }
  set velocity(v: Vector3D) {
    this._velocity = v;
  }
}

export class Actor extends MovableEntity {
  protected _action: Action | null;

  constructor(context: ContextImpl, location: Point3D, dimensions: Dimensions,
              graphics: GraphicComponent) {
    super(context, location, dimensions, graphics);
    context.addUpdateableEntity(this);
  }

  update(): void {
    super.update();
    if (this._action != undefined && this._action.perform()) {
      this._action = null;
    }
  }

  get action(): Action {
    return this._action!;
  }
  set action(action: Action) {
    this._action = action;
  }
}

export function createGraphicalEntity(
  context: ContextImpl,
  location: Point3D,
  dimensions: Dimensions,
  graphicComponent: GraphicComponent
) {
  const entity = new PhysicalEntity(context, location, dimensions, CuboidGeometry);
  entity.addGraphic(graphicComponent);
  return entity;
}
