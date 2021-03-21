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
import { ContextImpl } from "./context.js"
import { Action } from "./action.js"
import { EntityEvent,
         EventHandler } from "./events.js"

export class Entity {
  private static _ids: number = 0;

  private readonly _id: number;

  protected _graphicComponents: Array<GraphicComponent> =
    new Array<GraphicComponent>();
  protected _visible: boolean = true;
  protected _geometry: Geometry;
  protected _drawGeometry: boolean = false;

  constructor(protected _context: ContextImpl,
              minLocation: Point3D,
              dimensions: Dimensions,
              graphicComponent: GraphicComponent) {
    this._id = Entity._ids;
    Entity._ids++;
    this._graphicComponents.push(graphicComponent);
    let centre = new Point3D(minLocation.x + (dimensions.width / 2),
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
}

export class EventableEntity extends Entity {
  protected _handler = new EventHandler<EntityEvent>();

  constructor(context: ContextImpl,
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

  postEvent(event: EntityEvent): void {
    this._handler.post(event);
  }

  update(): void { this._handler.service(); }
}

export class MovableEntity extends EventableEntity {
  protected readonly _lift: number = 0;
  protected readonly _canSwim: boolean = false;
  protected _direction: Direction;

  constructor(context: ContextImpl,
              location: Point3D,
              dimensions: Dimensions,
              graphicComponent: GraphicComponent) {
    super(context, location, dimensions, graphicComponent);
    context.addMovableEntity(this);
  }

  updatePosition(d: Vector3D): void {
    this.bounds.update(d);
    this.geometry.transform(d);
  }

  get lift(): number { return this._lift; }
  get direction(): Direction { return this._direction; }
  set direction(direction: Direction) {
    this._direction = direction;
  }
}

export class Actor extends MovableEntity {
  protected _action: Action|null;

  constructor(context: ContextImpl,
              location: Point3D,
              dimensions: Dimensions,
              graphicComponent: GraphicComponent) {
    super(context, location, dimensions, graphicComponent);
  }

  update(): void {
    this._handler.service();
    if (this._action != undefined && this._action.perform()) {
      console.log("completed action");
      //this.postEvent(EntityEvent.ActionComplete);
      this._action = null;
    }
  }

  set action(action: Action) {
    this._action = action;
  }
}

