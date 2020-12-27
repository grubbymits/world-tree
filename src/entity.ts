import { Direction,
         Dimensions,
         BoundingCuboid } from "./physics.js"
import { Point2D,
         Segment2D,
         Point3D,
         Vector3D,
         Geometry,
         CuboidGeometry } from "./geometry.js"
import { GraphicComponent } from "./graphics.js"
import { Context } from "./context.js"
import { Action } from "./action.js"
import { EntityEvent,
         EventHandler } from "./events.js"

export class Entity {
  private static _ids: number = 0;

  private readonly _id: number;

  protected _hasMoved: boolean = false;
  protected _graphicComponents: Array<GraphicComponent> =
    new Array<GraphicComponent>();
  protected _visible: boolean = true;
  protected _geometry: Geometry;
  protected _drawGeometry: boolean = false;

  constructor(protected _context: Context,
              minLocation: Point3D,
              dimensions: Dimensions,
              graphicComponent: GraphicComponent) {
    this._id = Entity._ids;
    Entity._ids++;
    this._graphicComponents.push(graphicComponent);
    let centre = new Point3D(minLocation.x + Math.floor(dimensions.width / 2),
                             minLocation.y + Math.floor(dimensions.depth / 2),
                             minLocation.z + Math.floor(dimensions.height / 2));
    const bounds = new BoundingCuboid(centre, dimensions);
    this._geometry = new CuboidGeometry(bounds);
    this._context.addEntity(this);
  }
  
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
  get hasMoved(): boolean { return this._hasMoved; }
  get visible(): boolean { return this._visible; }
  get graphics(): Array<GraphicComponent> {
    return this._graphicComponents;
  }
  get graphic(): GraphicComponent {
    return this._graphicComponents[0];
  }
  get drawGeometry(): boolean { return this._drawGeometry; }

  set visible(visible: boolean) { this._visible = visible; }

  addGraphic(graphic: GraphicComponent): void {
    this._graphicComponents.push(graphic);
  }

  heightAt(location: Point3D): number|null {
    // Given a world location, does this terrain define what the minimum z
    // coordinate?
    // If the locations is outside of the bounding cuboid, just return null.
    if (!this.bounds.contains(location)) {
      return null;
    }
    return this.z + this.height;
  }

  updatePosition(d: Vector3D): void {
    this.bounds.update(d);
    this.geometry.transform(d);
  }
}

export class EventableEntity extends Entity {
  protected _handler = new EventHandler<EntityEvent>();

  constructor(context: Context,
              location: Point3D,
              dimensions: Dimensions,
              graphicComponent: GraphicComponent) {
    super(context, location, dimensions, graphicComponent);
  }

  addEventListener(event: EntityEvent, callback: Function): void {
    this._handler.addEventListener(event, callback);
  }

  removeEventListener(event: EntityEvent, callback: Function): void {
    this._handler.removeEventListener(event, callback);
  }

  update(): void { this._handler.service(); }
}

export class Actor extends EventableEntity {
  protected readonly _canSwim: boolean = false;
  protected readonly _canFly: boolean = false;
  protected _direction: Direction;
  protected _action: Action|null;
  protected _directionalGraphics =
    new Map<Direction, GraphicComponent>();

  constructor(context: Context,
              location: Point3D,
              dimensions: Dimensions,
              graphicComponent: GraphicComponent) {
    super(context, location, dimensions, graphicComponent);
    context.addActor(this);
  }

  update(): void {
    this._handler.service();
    if (this._action != undefined && this._action.perform()) {
      console.log("completed action");
      this.postEvent(EntityEvent.ActionComplete);
      this._action = null;
    }
  }

  addDirectionalGraphic(direction: Direction, graphic: GraphicComponent): void {
    this._directionalGraphics.set(direction, graphic);
  }

  postEvent(event: EntityEvent): void {
    this._handler.post(event);
  }

  get direction(): Direction { return this._direction; }

  get graphic(): GraphicComponent {
    if (this._directionalGraphics.has(this.direction)) {
      return this._directionalGraphics.get(this.direction)!;
    }
    return super.graphic;
  }

  get graphics(): Array<GraphicComponent> {
    if (this._directionalGraphics.has(this.direction)) {
      return [ this._directionalGraphics.get(this.direction)! ];
    }
    return super.graphics;
  }

  set direction(direction: Direction) {
    this._direction = direction;
  }
  set action(action: Action) {
    this._action = action;
  }
}

