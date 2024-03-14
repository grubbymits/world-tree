import { Dimensions, BoundingCuboid } from "./physics.ts";\
import { Point3D, Vector3D } from "./geometry.ts";

class EntityBounds {
  private static readonly MAX_ENTITIES = 1024;
  private static readonly NUM_ELEMENTS=3;
  private static data: Float64Array(this.MAX_ENTITIES * this.NUM_ELEMENTS * 2);

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
    const start = this.minStartIdx(id);
    return new Point3D(this.data[start], this.data[start+1], this.data[start+2]); 
  }
  static maxLocation(id: number): Point3D {
    const start = this.maxStartIdx(id);
    return new Point3D(this.data[start], this.data[start+1], this.data[start+2]); 
  }
  static centre(id: number): Point3D {
    const dimensions = this.dimensions(id);
    return new Point3D(
      this.minX + dimensions.width / 2,
      this.minY + dimensions.depth / 2,
      this.minZ + dimensions.height / 2
    );                
  }
  static minX(): number {
    return this.minLocation.x;
  }
  static minY(): number {
    return this.minLocation.y;
  }
  static minZ(): number {
    return this.minLocation.z;
  }
  static maxX(): number {
    return this.maxLocation.x;
  }
  static maxY(): number {
    return this.maxLocation.y;
  }
  static maxZ(): number {
    return this.maxLocation.z;
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
    return new Dimension(width, depth, height);
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
  static copyData(): ArrayBuffer {
    return this.data.splice();
  }
}
