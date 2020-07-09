import { Dimensions,
         BoundingCuboid } from "./physics.js"
import { Point3D } from "./geometry.js"
import { Point,
         GraphicComponent,
         IsometricRenderer } from "./graphics.js"
import { Context } from "./context.js"
import { Action } from "./action.js"
import { EntityEvent,
         EventHandler } from "./events.js"

export class Entity {
  private static _ids: number = 0;

  private readonly _id: number;

  protected _hasMoved: boolean = false;
  protected _drawCoord: Point = new Point(0, 0);
  protected _graphicComponents: Array<GraphicComponent>;
  protected _visible: boolean = true;
  protected _bounds: BoundingCuboid;
  protected _geometry: Geometry;

  constructor(protected _context: Context,
              location: Point3D,
              dimensions: Dimensions,
              graphicComponent: GraphicComponent) {
    this._id = Entity._ids;
    Entity._ids++;
    this._graphicComponents = new Array<GraphicComponent>();
    this._graphicComponents.push(graphicComponent);
    let centre = new Point3D(location.x + Math.floor(dimensions.width / 2),
                             location.y + Math.floor(dimensions.depth / 2),
                             location.z + Math.floor(dimensions.height / 2));
    this._bounds = new BoundingCuboid(centre, dimensions);
    this._geometry = new NoGeometry(this._bounds);
    this._context.addEntity(this);
  }
  
  get x(): number { return this._bounds.x; }
  get y(): number { return this._bounds.y; }
  get z(): number { return this._bounds.z; }
  get width(): number { return this._bounds.width; }
  get depth(): number { return this._bounds.depth; }
  get height(): number { return this._bounds.height; }
  get location(): Point3D { return this._bounds.minLocation; }
  get dimensions(): Dimensions { return this._bounds.dimensions; }
  get bounds(): BoundingCuboid { return this._bounds; }
  get centre(): Point3D { return this._bounds.centre; }
  get id(): number { return this._id; }
  get hasMoved(): boolean { return this._hasMoved; }
  get drawCoord(): Point { return this._drawCoord; }
  get visible(): boolean { return this._visible; }
  get graphics(): Array<GraphicComponent> {
    return this._graphicComponents;
  }
  get graphic(): GraphicComponent {
    return this._graphicComponents[0];
  }

  set drawCoord(coord: Point) { this._drawCoord = coord; }
  set visible(visible: boolean) { this._visible = visible; }
  set location(location: Point3D) { this._location = location; }

  addGraphic(graphic: GraphicComponent): void {
    this._graphicComponents.push(graphic);
  }
  heightAt(location: Point3D): number|null {
    // Given a world location, does this terrain define what the minimum z
    // coordinate?
    // If the locations is outside of the bounding cuboid, just return null.
    if (!this._bounds.contains(location)) {
      return null;
    }
    return this.z + this.height;
  }
  updateLocation(dx: number, dy: number, dz: number): void {
    this.location.x += dx;
    this.location.y += dy;
    this.location.z += dz;
  }
}

export class EventableEntity extends Entity {
  protected _handler = new EventHandler<EntityEvent>();

  constructor(context: Context,
              location: Point3D,
              dimensions: Dimensions,
              blocking: boolean,
              graphicComponent: GraphicComponent) {
    super(context, location, dimensions, blocking, graphicComponent);
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
  protected _action: Action|null;

  constructor(context: Context,
              location: Point3D,
              dimensions: Dimensions,
              blocking: boolean,
              graphicComponent: GraphicComponent) {
    super(context, location, dimensions, blocking, graphicComponent);
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

  postEvent(event: EntityEvent): void {
    this._handler.post(event);
  }

  set action(action: Action) {
    this._action = action;
  }
}

