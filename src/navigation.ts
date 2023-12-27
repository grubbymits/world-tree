import { Point2D, Point3D, Vector2D } from "./geometry.ts";

export enum Direction {
  North,
  NorthEast,
  East,
  SouthEast,
  South,
  SouthWest,
  West,
  NorthWest,
  Max,
}

export class Navigation {
  static getDirectionName(direction: Direction): string {
    switch (direction) {
      default:
        break;
      case Direction.North:
        return "north";
      case Direction.NorthEast:
        return "north east";
      case Direction.East:
        return "east";
      case Direction.SouthEast:
        return "south east";
      case Direction.South:
        return "south";
      case Direction.SouthWest:
        return "south west";
      case Direction.West:
        return "west";
      case Direction.NorthWest:
        return "north west";
    }
    console.error("unhandled direction when getting name:", direction);
    return "error";
  }

  static getVector2D(direction: Direction): Vector2D {
    let xDiff = 0;
    let yDiff = 0;
    switch (direction) {
      default:
        console.error("unhandled direction");
        break;
      case Direction.North:
        yDiff = -1;
        break;
      case Direction.NorthEast:
        xDiff = 1;
        yDiff = -1;
        break;
      case Direction.East:
        xDiff = 1;
        break;
      case Direction.SouthEast:
        xDiff = 1;
        yDiff = 1;
        break;
      case Direction.South:
        yDiff = 1;
        break;
      case Direction.SouthWest:
        xDiff = -1;
        yDiff = 1;
        break;
      case Direction.West:
        xDiff = -1;
        break;
      case Direction.NorthWest:
        xDiff = -1;
        yDiff = -1;
        break;
    }
    return new Vector2D(xDiff, yDiff);
  }

  static getAdjacentCoord(p: Point2D, direction: Direction): Point2D {
    const v = this.getVector2D(direction);
    return p.add(v);
  }

  static getDirectionFromPoints(from: Point2D, to: Point2D): Direction {
    return this.getDirectionFromVector(to.diff(from));
  }

  static getDirectionFromVector(w: Vector2D): Direction {
    const mag = w.mag();
    const u = new Vector2D(0, -mag); // 'north'
    let theta = (180 * u.angle(w)) / Math.PI;
    if (theta < 0) {
      const rotate = 180 + theta;
      theta = 180 + rotate;
    }
    const direction = Math.round(theta / 45);
    return <Direction>direction;
  }

  static getOppositeDirection(direction: Direction): Direction {
    return (direction + Direction.Max / 2) % Direction.Max;
  }

  static readonly neighbourOffsets: Array<Point2D> = [
    new Point2D(-1, -1),
    new Point2D(0, -1),
    new Point2D(1, -1),
    new Point2D(-1, 0),
    new Point2D(1, 0),
    new Point2D(-1, 1),
    new Point2D(0, 1),
    new Point2D(1, 1),
  ];
}
