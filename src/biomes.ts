import { Direction } from "./navigation.ts"

export enum Biome {
  Water,
  Desert,
  Grassland,
  Shrubland,
  MoistForest,
  WetForest,
  RainForest,
  Rock,
  Tundra,
  AlpineGrassland,
  AlpineMeadow,
  AlpineForest,
  Taiga,
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
    case Biome.Grassland:
      return "grassland";
    case Biome.Shrubland:
      return "shrubland";
    case Biome.MoistForest:
      return "moist forest";
    case Biome.WetForest:
      return "wet forest";
    case Biome.RainForest:
      return "rain forest";
    case Biome.Tundra:
      return "tundra";
    case Biome.AlpineGrassland:
      return "alpine grassland";
    case Biome.AlpineMeadow:
      return "alpine meadow";
    case Biome.AlpineForest:
      return "alpine forest";
    case Biome.Taiga:
      return "taiga";
  }
}

export class BiomeConfig {
  constructor(private readonly _waterLine: number,
              private readonly _wetLimit: number,
              private readonly _dryLimit: number,
              private readonly _uplandThreshold: number,
              private readonly _rainfall: number,
              private readonly _rainDirection: Direction) { }

  get waterLine(): number { return this._waterLine; }
  get wetLimit(): number { return this._wetLimit; }
  get dryLimit(): number { return this._dryLimit; }
  get uplandThreshold(): number { return this._uplandThreshold; }
  get rainfall(): number { return this._rainfall; }
  get rainDirection(): Direction { return this._rainDirection; }
}

export function generateBiomeGrid(config: BiomeConfig,
                                  heightGrid: Array<Array<number>>,
                                  moistureGrid: Array<Array<number>>): Array<Array<Biome>> {
  const cellsX = heightGrid[0].length;
  const cellsY = heightGrid.length;
  const moistureRange = 6;
  let biomeGrid: Array<Array<Biome>> = new Array<Array<Biome>>();
  for (let y = 0; y < cellsY; y++) {
    biomeGrid[y] = new Array<Biome>();
    for (let x = 0; x < cellsX; x++) {
      let biome: Biome = Biome.Water;
      const moisture = moistureGrid[y][x];
      const moisturePercent = Math.min(1, moisture / moistureRange);
      // Split into six biomes based on moisture.
      const moistureScaled = Math.floor(5 * moisturePercent);
      const surfaceHeight = heightGrid[y][x];

      if (surfaceHeight <= config.waterLine) {
        biome = Biome.Water;
      } else if (surfaceHeight >= config.uplandThreshold) {
        switch (moistureScaled) {
          default:
            console.error("unhandled moisture scale");
            break;
          case 0:
            biome = Biome.Rock;
            break;
          case 1:
            biome = Biome.Tundra;
            break;
          case 2:
            biome = Biome.AlpineGrassland;
            break;
          case 3:
            biome = Biome.AlpineMeadow;
            break;
          case 4:
            biome = Biome.AlpineForest;
            break;
          case 5:
            biome = Biome.Taiga;
            break;
        }
      } else {
        switch (moistureScaled) {
          default:
            console.error("unhandled moisture scale");
            break;
          case 0:
            biome = Biome.Desert;
            break;
          case 1:
            biome = Biome.Grassland;
            break;
          case 2:
            biome = Biome.Shrubland;
            break;
          case 3:
            biome = Biome.MoistForest;
            break;
          case 4:
            biome = Biome.WetForest;
            break;
          case 5:
            biome = Biome.RainForest;
            break;
        }
      }
      biomeGrid[y][x] = biome;
    }
  }
  return biomeGrid;
}
