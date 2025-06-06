import { Direction, Navigation } from "./navigation.ts"
import { Point2D } from "./geometry.ts";

export const enum Biome {
  Water,
  Desert,
  Savanna,
  Woodland,
  Rainforest,
  AlpineDesert,
  AlpineTundra,
  Steppe,
  SubalpineForest,
}

export function getBiomeName(biome: Biome): string {
  switch (biome) {
    default:
      console.error("unhandled biome type:", biome);
      return "invalid biome";
    case Biome.Water:
      return "water";
    case Biome.Desert:
      return "desert";
    case Biome.Savanna:
      return "savanna";
    case Biome.Woodland:
      return "woodland";
    case Biome.Rainforest:
      return "rain forest";
    case Biome.AlpineDesert:
      return "alpine desert";
    case Biome.AlpineTundra:
      return "alpine tundra";
    case Biome.Steppe:
      return "steppe";
    case Biome.SubalpineForest:
      return "subalpine forest";
  }
}

export class BiomeConfig {
  constructor(private readonly _waterLine: number,
              private readonly _uplandThreshold: number,
              private readonly _rainfall: number,
              private readonly _rainDirection: Direction) { }

  get waterLine(): number { return this._waterLine; }
  get uplandThreshold(): number { return this._uplandThreshold; }
  get rainfall(): number { return this._rainfall; }
  get rainDirection(): Direction { return this._rainDirection; }
}

export function generateBiomeGrid(config: BiomeConfig,
                                  heightGrid: Array<Array<number>>,
                                  moistureGrid: Array<Array<number>>): Array<Uint8Array> {
  const cellsX = heightGrid[0].length;
  const cellsY = heightGrid.length;
  const moistureRange = 6;
  const biomeGrid: Array<Uint8Array> = new Array<Uint8Array>();
  for (let y = 0; y < cellsY; y++) {
    biomeGrid[y] = new Uint8Array(cellsX);
    for (let x = 0; x < cellsX; x++) {
      let biome: Biome = Biome.Water;
      const moisture = moistureGrid[y][x];
      const moisturePercent = Math.min(1, moisture / moistureRange);
      // Split into four biomes based on moisture.
      const moistureScaled = Math.floor(3 * moisturePercent);
      const surfaceHeight = heightGrid[y][x];

      if (surfaceHeight <= config.waterLine) {
        biome = Biome.Water;
      } else if (surfaceHeight >= config.uplandThreshold) {
        switch (moistureScaled) {
          default:
            console.error("unhandled moisture scale:", moistureScaled);
            break;
          case 0:
            biome = Biome.AlpineDesert;
            break;
          case 1:
            biome = Biome.AlpineTundra;
            break;
          case 2:
            biome = Biome.Steppe;
            break;
          case 3:
            biome = Biome.SubalpineForest;
            break;
        }
      } else {
        switch (moistureScaled) {
          default:
            console.error("unhandled moisture scale:", moistureScaled);
            break;
          case 0:
            biome = Biome.Desert;
            break;
          case 1:
            biome = Biome.Savanna;
            break;
          case 2:
            biome = Biome.Woodland;
            break;
          case 3:
            biome = Biome.Rainforest;
            break;
        }
      }
      biomeGrid[y][x] = biome;
    }
  }
  return biomeGrid;
}

class Cloud {
  constructor(
    private _pos: Point2D,
    private _moisture: number,
    private readonly _direction: Direction,
    private _rain: Rain
  ) {}

  get x(): number {
    return this._pos.x;
  }
  get y(): number {
    return this._pos.y;
  }
  get pos(): Point2D {
    return this._pos;
  }
  set pos(p: Point2D) {
    this._pos = p;
  }
  get moisture(): number {
    return this._moisture;
  }
  set moisture(m: number) {
    this._moisture = m;
  }
  get rain(): Rain {
    return this._rain;
  }
  get minHeight(): number {
    return this.rain.minHeight;
  }
  get direction(): Direction {
    return this._direction;
  }
  get moistureGrid(): Array<Array<number>> {
    return this.rain.moistureGrid;
  }

  dropMoisture(multiplier: number): void {
    // Default to 10%
    const moisture = this.moisture * 0.1 * multiplier;
    this.moisture -= moisture;
    this.rain.addMoistureAt(this.pos, moisture);
  }

  terraceAt(x: number, y: number): number {
    return this.rain.terraceGrid[y][x];
  }

  heightAt(x: number, y: number): number {
    return this.rain.heightGrid[y][x];
  }

  inbounds(pos: Point2D): boolean {
    return (pos.x >= 0 && pos.x < this.rain.cellsX &&
            pos.y >= 0 && pos.y < this.rain.cellsY);
  }

  move(): void {
    // Cloud may have left the map.
    while (this.inbounds(this.pos)) {
      const nextCoord = Navigation.getAdjacentCoord(this.pos, this.direction);
      if (!this.inbounds(nextCoord)) {
        this.dropMoisture(1);
        return;
      }

      // Don't start raining until we've reached land, and not on a beach.
      if (this.heightAt(this.x, this.y) <= this.minHeight || this.terraceAt(this.x, this.y) < 1) {
        this.pos = nextCoord;
        continue;
      }

      const multiplier =
        this.terraceAt(nextCoord.x, nextCoord.y) > this.terraceAt(this.x, this.y)
        ? 1.5 : 1;
      this.dropMoisture(multiplier);
      this.pos = nextCoord;
    }
  }
}

export class Rain {
  private _clouds = Array<Cloud>();
  private _totalClouds = 0;
  private _moistureGrid: Array<Array<number>> = new Array<Array<number>>();

  constructor(
    private readonly _cellsX: number,
    private readonly _cellsY: number,
    private readonly _heightGrid: Array<Array<number>>,
    private readonly _terraceGrid: Array<Uint8Array>,
    private readonly _minHeight: number,
    moisture: number,
    direction: Direction
  ) {
    for (let y = 0; y < this.cellsY; y++) {
      this._moistureGrid.push(new Array<number>(this.cellsX).fill(0));
    }

    switch (direction) {
      default:
        console.error("unhandled direction");
        break;
      case Direction.North: {
        const y = this.cellsY - 1;
        for (let x = 0; x < this.cellsX; x++) {
          this.addCloud(new Point2D(x, y), moisture, direction);
        }
        break;
      }
      case Direction.East: {
        const x = 0;
        for (let y = 0; y < this.cellsY; y++) {
          this.addCloud(new Point2D(x, y), moisture, direction);
        }
        break;
      }
      case Direction.South: {
        const y = 0;
        for (let x = 0; x < this.cellsX; x++) {
          this.addCloud(new Point2D(x, y), moisture, direction);
        }
        break;
      }
      case Direction.West: {
        const x = this.cellsX - 1;
        for (let y = 0; y < this.cellsY; y++) {
          this.addCloud(new Point2D(x, y), moisture, direction);
        }
        break;
      }
    }
  }

  get cellsX(): number {
    return this._cellsX;
  }
  get cellsY(): number {
    return this._cellsY;
  }
  get clouds(): Array<Cloud> {
    return this._clouds;
  }
  get totalClouds(): number {
    return this._totalClouds;
  }
  get minHeight(): number {
    return this._minHeight;
  }
  get moistureGrid(): Array<Array<number>> {
    return this._moistureGrid;
  }
  get heightGrid(): Array<Array<number>> {
    return this._heightGrid;
  }
  get terraceGrid(): Array<Uint8Array> {
    return this._terraceGrid;
  }
  moistureAt(x: number, y: number): number {
    return this._moistureGrid[y][x];
  }

  addMoistureAt(pos: Point2D, moisture: number): void {
    this.moistureGrid[pos.y][pos.x] += moisture;
  }

  addCloud(pos: Point2D, moisture: number, direction: Direction): void {
    this.clouds.push(new Cloud(pos, moisture, direction, this));
    this._totalClouds++;
  }

  run(): void {
    while (this.clouds.length != 0) {
      const cloud = this.clouds[this.clouds.length - 1];
      this.clouds.pop();
      cloud.move();
    }
  }
}

function mean(grid: Array<Array<number>>): number {
  let total = 0;
  let numElements = 0;
  for (const row of grid) {
    const acc = row.reduce(function (acc: number, value: number) {
      return acc + value;
    }, 0);
    total += acc;
    numElements += row.length;
  }
  return total / numElements;
}

function meanWindow(
  grid: Array<Array<number>>,
  centreX: number,
  centreY: number,
  offsets: Array<number>
): number {
  let total = 0;
  const numElements = offsets.length * offsets.length;
  for (const dy in offsets) {
    const y = centreY + offsets[dy];
    for (const dx in offsets) {
      const x = centreX + offsets[dx];
      total += grid[y][x];
    }
  }
  return total / numElements;
}

function standardDevWindow(
  grid: Array<Array<number>>,
  centreX: number,
  centreY: number,
  offsets: Array<number>
): number {
  const avg: number = meanWindow(grid, centreX, centreY, offsets);
  if (avg == 0) {
    return 0;
  }
  const diffsSquared = new Array<Array<number>>();
  const size = offsets.length;

  for (const dy in offsets) {
    const y = centreY + offsets[dy];
    const row = new Array<number>(size);
    let wx = 0;
    for (const dx in offsets) {
      const x = centreX + offsets[dx];
      const diff = grid[y][x] - avg;
      row[wx] = diff * diff;
      wx++;
    }
    diffsSquared.push(row);
  }
  return Math.sqrt(mean(diffsSquared));
}

function gaussianBlur(
  grid: Array<Array<number>>,
  width: number,
  depth: number
): Array<Array<number>> {
  const filterSize = 5;
  const halfSize = Math.floor(filterSize / 2);
  const offsets: Array<number> = [-2, -1, 0, 1, 2];
  const distancesSquared: Array<number> = [4, 1, 0, 1, 4];

  const result = new Array<Array<number>>();
  // Just copy the two left columns
  for (let y = 0; y < halfSize; y++) {
    result[y] = grid[y];
  }
  // Just copy the two right columns.
  for (let y = depth - halfSize; y < depth; y++) {
    result[y] = grid[y];
  }

  const filter = new Array<number>(filterSize);
  for (let y = halfSize; y < depth - halfSize; y++) {
    result[y] = new Array<number>(width);

    // Just copy the edge values.
    for (let x = 0; x < halfSize; x++) {
      result[y][x] = grid[y][x];
    }
    for (let x = width - halfSize; x < width; x++) {
      result[y][x] = grid[y][x];
    }

    for (let x = halfSize; x < width - halfSize; x++) {
      const sigma = standardDevWindow(grid, x, y, offsets);
      if (sigma == 0) {
        continue;
      }

      const sigmaSquared = sigma * sigma;
      const denominator: number = Math.sqrt(2 * Math.PI * sigmaSquared);

      let sum = 0;
      for (const i in distancesSquared) {
        const numerator = Math.exp(-(distancesSquared[i] / (2 * sigmaSquared)));
        filter[i] = numerator / denominator;
        sum += filter[i];
      }
      for (let coeff of filter) {
        coeff /= sum;
      }

      let blurred = 0;
      for (const i in offsets) {
        const dx = offsets[i];
        blurred += grid[y][x + dx] * filter[i];
      }

      for (const i in offsets) {
        const dy = offsets[i];
        blurred += grid[y + dy][x] * filter[i];
      }
      result[y][x] = blurred; //Math.floor(blurred);
    }
  }

  return result;
}

// Take a height map and return a moisture map.
export function addRain(heightGrid: Array<Array<number>>,
                        terraceGrid: Array<Uint8Array>,
                        towards: Direction, water: number, waterLine: number):
                        Array<Array<number>> {
  const cellsX = heightGrid[0].length;
  const cellsY = heightGrid.length;
  const rain = new Rain(cellsX, cellsY, heightGrid, terraceGrid, waterLine, water, towards);
  rain.run();
  const moisture = gaussianBlur(
    rain.moistureGrid,
    cellsX,
    cellsY
  );
  return moisture;
}

export function buildBiomes(biomeConfig: BiomeConfig,
                            heightGrid: Array<Array<number>>,
                            terraceGrid: Array<Uint8Array>): Array<Uint8Array> {
  let moistureGrid = new Array<Array<number>>();
  if (biomeConfig.rainfall > 0) {
    moistureGrid = addRain(
      heightGrid,
      terraceGrid,
      biomeConfig.rainDirection,
      biomeConfig.rainfall,
      biomeConfig.waterLine
    );
  } else {
    const cellsY = heightGrid.length;
    const cellsX = heightGrid[0].length;
    for (let y = 0; y < cellsY; ++y) {
      moistureGrid[y] = new Array<number>(cellsX).fill(0);
    }
  }
  return generateBiomeGrid(biomeConfig, heightGrid, moistureGrid);
}
