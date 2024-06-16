import { Point2D, Point3D, Vector2D, Vector3D } from "./geometry.ts";

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

  static getDirectionVector(direction: Direction): Vector3D {
    switch (direction) {
      default:
        break;
      case Direction.North:
        return new Vector3D(0, -1, 0);
      case Direction.NorthEast:
        return new Vector3D(1, -1, 0); 
      case Direction.East:
        return new Vector3D(1, 0, 0);
      case Direction.SouthEast:
        return new Vector3D(1, 1, 0);
      case Direction.South:
        return new Vector3D(0, 1, 0);
      case Direction.SouthWest:
        return new Vector3D(-1, 1, 0);
      case Direction.West:
        return new Vector3D(-1, 0, 0);
      case Direction.NorthWest:
        return new Vector3D(-1, -1, 0);
    }
    console.error("unhandled direction:", direction);
    return new Vector3D(0, 0, 0);
  }

  static getAdjacentCoord(p: Point2D, direction: Direction): Point2D {
    const v = this.neighbourOffsets.get(direction)!;
    return p.add(v);
  }

  static getDirectionFromPoints(from: Point2D, to: Point2D): Direction {
    return this.getDirectionFromVector(to.diff(from));
  }

  static getDirectionFromVector(w: Vector2D): Direction {
    const mag = w.mag();
    const u = new Vector2D(0, -mag); // 'north'
    // Add 22.5 to allow north to cover -22.5 - 22.5 deg.
    let theta = ((180 * u.angle(w)) / Math.PI) + 22.5;
    if (theta < 0) {
      const rotate = 180 + theta;
      theta = 180 + rotate;
    }
    const direction = Math.floor(theta / 45);
    return <Direction>direction;
  }

  static getOppositeDirection(direction: Direction): Direction {
    return (direction + Direction.Max / 2) % Direction.Max;
  }

  static getAdjacentDirections(direction: Direction): Array<Direction> {
    const anticlockwise = (direction + Direction.Max - 1) % Direction.Max;
    const clockwise = (direction + 1) % Direction.Max;
    return [ anticlockwise, clockwise ];
  }

  static readonly neighbourOffsets: Map<Direction, Vector2D> = new Map([
    [ Direction.North, new Vector2D(0, -1) ],
    [ Direction.East, new Vector2D(1, 0) ],
    [ Direction.South, new Vector2D(0, 1) ],
    [ Direction.West, new Vector2D(-1, 0) ],
    [ Direction.NorthWest, new Vector2D(-1, -1) ],
    [ Direction.NorthEast, new Vector2D(1, -1) ],
    [ Direction.SouthEast, new Vector2D(1, 1) ],
    [ Direction.SouthWest, new Vector2D(-1, 1) ],
  ]);
}
