import { Location,
         Dimensions,
         BoundingCuboid } from "./physics.js"
import { Point,
         GraphicComponent,
         IsometricRenderer } from "./graphics.js"
import { Context } from "./context.js"
import { Action } from "./action.js"

export class Entity {
  private static _ids: number = 0;

  private readonly _id: number;

  protected _hasMoved: boolean = false;
  protected _drawCoord: Point = new Point(0, 0);
  protected _graphicComponents: Array<GraphicComponent>;
  protected _visible: boolean = true;
  protected _bounds: BoundingCuboid;

  constructor(protected _context: Context,
              protected _location: Location,
              protected readonly _dimensions: Dimensions,
              protected readonly _blocking: boolean,
              graphicComponent: GraphicComponent) {
    this._id = Entity._ids;
    Entity._ids++;
    this._graphicComponents = new Array<GraphicComponent>();
    this._graphicComponents.push(graphicComponent);
    let centre = new Location(this.x + Math.floor(this.width / 2),
                              this.y + Math.floor(this.depth / 2),
                              this.z + Math.floor(this.height / 2));
    this._bounds = new BoundingCuboid(centre, _dimensions);
    this._context.addEntity(this);
  }
  
  get x(): number { return this._location.x; }
  get y(): number { return this._location.y; }
  get z(): number { return this._location.z; }
  get width(): number { return this._dimensions.width; }
  get depth(): number { return this._dimensions.depth; }
  get height(): number { return this._dimensions.height; }
  get location(): Location { return this._location; }
  get dimensions(): Dimensions { return this._dimensions; }
  get bounds(): BoundingCuboid { return this._bounds; }
  get centre(): Location { return this._bounds.centre; }
  get blocking(): boolean { return this._blocking; }
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
  set location(location: Location) { this._location = location; }

  addGraphic(graphic: GraphicComponent): void {
    this._graphicComponents.push(graphic);
  }
  heightAt(location: Location): number|null {
    // Given a world location, does this terrain define what the minimum z
    // coordinate?
    // If the locations is outside of the bounding cuboid, just return null.
    if (!this._bounds.contains(location)) {
      return null;
    }
    return this.z + this.height;
  }
}

export enum EntityEvent {
  Move = "move",
  ActionComplete = "actionComplete",
}

export class EventableEntity extends Entity {
  protected _listeners = new Map<EntityEvent, Array<Function>>();
  protected _events = new Array<EntityEvent>();

  constructor(context: Context,
              location: Location,
              dimensions: Dimensions,
              blocking: boolean,
              graphicComponent: GraphicComponent) {
    super(context, location, dimensions, blocking, graphicComponent);
  }

  update(): void { this.serviceEvents(); }

  serviceEvents(): void {
    for (let event of this._events) {
      if (!this._listeners.has(event)) {
        continue;
      }
      let callbacks = this._listeners.get(event)!;
      for (let callback of callbacks) { 
        callback();
      }
    }
    this._events = [];
  }

  addEventListener(event: EntityEvent, callback: Function): void {
    if (!this._listeners.has(event)) {
      this._listeners.set(event, new Array<Function>());
    } else {
      // Check that the callback doesn't already exist.
      let callbacks = this._listeners.get(event)!;
      for (let i in callbacks) {
        if (callbacks[i] === callback) {
          return;
        }
      }
    }
    this._listeners.get(event)!.push(callback);
  }

  removeEventListener(event: EntityEvent, callback: Function): void {
    if (!this._listeners.has(event)) {
      return;
    }
    let callbacks = this._listeners.get(event)!;
    const index = callbacks.indexOf(callback, 0);
    if (index > -1) {
      callbacks.splice(index, 1);
    }
  }
}

export class Actor extends EventableEntity {
  protected readonly _canSwim: boolean = false;
  protected readonly _canFly: boolean = false;
  protected _action: Action;

  constructor(context: Context,
              location: Location,
              dimensions: Dimensions,
              blocking: boolean,
              graphicComponent: GraphicComponent) {
    super(context, location, dimensions, blocking, graphicComponent);
    context.addActor(this);
  }

  update(): void {
    this.serviceEvents();
    if (this._action != undefined && this._action.perform()) {
      this._events.push(EntityEvent.ActionComplete);
    }
  }
}

