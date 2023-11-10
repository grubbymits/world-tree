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
              private readonly _heightGrid: Array<Array<number>>,
              private readonly _moistureGrid: Array<Array<number>>) { }

  get waterLine(): number { return this._waterLine; }
  get wetLimit(): number { return this._wetLimit; }
  get dryLimit(): number { return this._dryLimit; }
  get uplandThreshold(): number { return this._uplandThreshold; }
  get heightGrid(): Array<Array<number>> { return this._heightGrid; }
  get moistureGrid(): Array<Array<number>> { return this._moistureGrid; }

  moistureAt(x: number, y: number) { return this.moistureGrid[y][x]; }
  heightAt(x: number, y: number) { return this._heightGrid[y][x]; }
}

export function generateBiomeGrid(config: BiomeConfig,
                                  cellsX: number, cellsY: number): Array<Array<Biome>> {
  const moistureRange = 6;
  let biomeGrid: Array<Array<Biome>> = new Array<Array<Biome>>();
  for (let y = 0; y < cellsY; y++) {
    biomeGrid[y] = new Array<Biome>();
    for (let x = 0; x < cellsX; x++) {
      let biome: Biome = Biome.Water;
      const moisture = config.moistureAt(x, y);
      const moisturePercent = Math.min(1, moisture / moistureRange);
      // Split into six biomes based on moisture.
      const moistureScaled = Math.floor(5 * moisturePercent);
      const surfaceHeight = config.heightAt(x, y);

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
