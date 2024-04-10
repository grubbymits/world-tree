import { Dimensions, BoundingCuboid } from "./physics.ts";
import { Point3D, Vector3D } from "./geometry.ts";

export class EntityBounds {
  private static readonly MAX_ENTITIES = 1024;
  private static readonly NUM_ELEMENTS = 3;
  private static data: Float64Array = new Float64Array(this.MAX_ENTITIES * this.NUM_ELEMENTS * 2);

  static toBoundingCuboid(id: number): BoundingCuboid {
    return new BoundingCuboid(this.centre(id), this.dimensions(id));
  }
  static minStartIdx(id: number): number {
    return id * 2 * this.NUM_ELEMENTS;
  }
  static maxStartIdx(id: number): number {
    return id * 2 * this.NUM_ELEMENTS + this.NUM_ELEMENTS;
  }
  static minLocation(id: number): Point3D {
    return new Point3D(this.minX(id), this.minY(id), this.minZ(id));
  }
  static maxLocation(id: number): Point3D {
    return new Point3D(this.maxX(id), this.maxY(id), this.maxZ(id));
  }
  static centre(id: number): Point3D {
    const dimensions = this.dimensions(id);
    return new Point3D(
      this.minX(id) + dimensions.width * 0.5,
      this.minY(id) + dimensions.depth * 0.5,
      this.minZ(id) + dimensions.height * 0.5
    );
  }
  static bottomCentre(id: number): Point3D {
    const dimensions = this.dimensions(id);
    return new Point3D(
      this.minX(id) + dimensions.width * 0.5,
      this.minY(id) + dimensions.depth * 0.5,
      this.minZ(id)
    );
  }
  static minX(id: number): number {
    return this.data[this.minStartIdx(id)];
  }
  static minY(id: number): number {
    return this.data[this.minStartIdx(id) + 1];
  }
  static minZ(id: number): number {
    return this.data[this.minStartIdx(id) + 2];
  }
  static maxX(id: number): number {
    return this.data[this.maxStartIdx(id)];
  }
  static maxY(id: number): number {
    return this.data[this.maxStartIdx(id) + 1];
  }
  static maxZ(id: number): number {
    return this.data[this.maxStartIdx(id) + 2];
  }
  static centreX(id: number): number {
    return this.minX(id) + this.width(id) * 0.5;
  }
  static centreY(id: number): number {
    return this.minY(id) + this.depth(id) * 0.5;
  }
  static centreZ(id: number): number {
    return this.minZ(id) + this.height(id) * 0.5;
  }
  static width(id: number): number {
    return this.maxX(id) - this.minX(id);
  }
  static depth(id: number): number {
    return this.maxY(id) - this.minY(id);
  }
  static height(id: number): number {
    return this.maxZ(id) - this.minZ(id);
  }
  static dimensions(id: number): Dimensions {
    const width = this.width(id);
    const depth = this.depth(id);
    const height = this.height(id);
    return new Dimensions(width, depth, height);
  }
  static addEntity(id: number, min: Point3D, dims: Dimensions): void {
    const minStart = this.minStartIdx(id);
    const maxStart = this.maxStartIdx(id);
    this.data[minStart] = min.x;
    this.data[minStart+1] = min.y;
    this.data[minStart+2] = min.z;
    this.data[maxStart] = min.x + dims.width;
    this.data[maxStart+1] = min.y + dims.depth;
    this.data[maxStart+2] = min.z + dims.height;
  }
  static update(id: number, d: Vector3D): void {
    const minStart = this.minStartIdx(id);
    const maxStart = this.maxStartIdx(id);
    this.data[minStart] += d.x;
    this.data[minStart+1] += d.y;
    this.data[minStart+2] += d.z;
    this.data[maxStart] += d.x;
    this.data[maxStart+1] += d.y;
    this.data[maxStart+2] += d.z;
  }
  static contains(id: number, p: Point3D): boolean {
    if (
      p.x < this.minX(id) ||
      p.y < this.minY(id) ||
      p.z < this.minZ(id)
    ) {
      return false;
    }

    if (
      p.x > this.maxX(id) ||
      p.y > this.maxY(id) ||
      p.z > this.maxZ(id)
    ) {
      return false;
    }

    return true;
  }
  static intersects(ida: number, idb: number): boolean {
    if (
      this.minX(idb) > this.maxX(ida) ||
      this.maxX(idb) < this.minX(ida)
    ) {
      return false;
    }

    if (
      this.minY(idb) > this.maxY(ida) ||
      this.maxY(idb) < this.minY(ida)
    ) {
      return false;
    }

    if (
      this.minZ(idb) > this.maxZ(ida) ||
      this.maxZ(idb) < this.minZ(ida)
    ) {
      return false;
    }

    return true;
  }
  static intersectsBounds(id: number, min: Point3D, max: Point3D): boolean {
    if (
      min.x > this.maxX(id) ||
      max.x < this.minX(id)
    ) {
      return false;
    }

    if (
      min.y > this.maxY(id) ||
      max.y < this.minY(id)
    ) {
      return false;
    }

    if (
      min.z > this.maxZ(id) ||
      max.z < this.minZ(id)
    ) {
      return false;
    }

    return true;
  }
  static axisOverlapX(ida: number, idb: number): boolean {
    if (
      (this.minX(idb) >= this.minX(ida) &&
        this.minX(idb) <= this.maxX(ida)) ||
      (this.maxX(idb) >= this.minX(ida) &&
        this.maxX(idb) <= this.maxX(ida))
    ) {
      return true;
    }
    return false;
  }

  static axisOverlapY(ida: number, idb: number): boolean {
    if (
      (this.minY(idb) >= this.minY(ida) &&
        this.minY(idb) <= this.maxY(ida)) ||
      (this.maxY(idb) >= this.minY(ida) &&
        this.maxY(idb) <= this.maxY(ida))
    ) {
      return true;
    }
    return false;
  }

  static axisOverlapZ(ida: number, idb: number): boolean {
    if (
      (this.minZ(idb) >= this.minZ(ida) &&
        this.minZ(idb) <= this.maxZ(ida)) ||
      (this.maxZ(idb) >= this.minZ(ida) &&
        this.maxZ(idb) <= this.maxZ(ida))
    ) {
      return true;
    }
    return false;
  }
  static copyData(): ArrayBuffer {
    return this.data.slice();
  }
}
