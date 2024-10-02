import {
  Terrain,
  TerrainShape,
  TerrainType,
} from "./terrain.ts";
import {
  TerrainGridDescriptorImpl,
  TerrainGrid,
} from "./grid.ts";
import { Dimensions } from "./physics.ts";
import { Direction, Navigation } from "./navigation.ts";
import { Point2D } from "./geometry.ts";
import { ContextImpl } from "./context.ts";
import { Biome, BiomeConfig, generateBiomeGrid, getBiomeName, addRain } from "./biomes.ts";
import { Edge, EdgeShape, Ramp, RampShape } from "./terraform.ts";

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

export function normaliseHeightGrid(heightGrid: Array<Array<number>>,
                                    numTerraces: number): number {
  // Normalise heights, minimum = 0;
  const cellsY = heightGrid.length;
  const cellsX = heightGrid[0].length;
  let minHeight = 0;
  let maxHeight = 0;
  for (let y = 0; y < cellsY; y++) {
    const row: Array<number> = heightGrid[y];
    const max = row.reduce(function (a, b) {
      return Math.max(a, b);
    });
    const min = row.reduce(function (a, b) {
      return Math.min(a, b);
    });
    minHeight = Math.min(minHeight, min);
    maxHeight = Math.max(maxHeight, max);
  }
  if (minHeight < 0) {
    minHeight = Math.abs(minHeight);
    for (let y = 0; y < cellsY; y++) {
      for (let x = 0; x < cellsX; x++) {
        heightGrid[y][x] += minHeight;
      }
    }
    maxHeight += minHeight;
  }
  return maxHeight / numTerraces;
}

export function buildTerraceGrid(heightGrid: Array<Array<number>>,
                                 terraceSpacing: number): Array<Uint8Array> {
  const cellsY = heightGrid.length;
  const cellsX = heightGrid[0].length;
  const terraceGrid = new Array<Uint8Array>();
  for (let y = 0; y < cellsY; y++) {
    terraceGrid[y] = new Uint8Array(cellsX);
    for (let x = 0; x < cellsX; x++) {
      const surfaceHeight = heightGrid[y][x];
      terraceGrid[y][x] =
        Math.floor(surfaceHeight / terraceSpacing);
    }
  }
  return terraceGrid;
}

export function buildTerrainShapeGrid(terraceGrid: Array<Uint8Array>,
                                      edges: Array<Edge>,
                                      ramps: Array<Ramp>): Array<Uint8Array> {

  const cellsY = terraceGrid.length;
  const cellsX = terraceGrid[0].length;
  const terrainShapes = new Array<Uint8Array>();
  for (let y = 0; y < cellsY; ++y) {
    terrainShapes[y] = new Uint8Array(cellsX).fill(TerrainShape.Flat);
  }

  const edgeToShape = new Map<EdgeShape, Uint8Array>([
    [ EdgeShape.None,
      new Uint8Array([ TerrainShape.Flat ])
    ],
    [ EdgeShape.North,
      new Uint8Array([ TerrainShape.NorthEdge ])
    ],
    [ EdgeShape.East,
      new Uint8Array([ TerrainShape.EastEdge ])
    ],
    [ EdgeShape.NorthEastCorner,
      new Uint8Array([ TerrainShape.NorthEastCorner,
                       TerrainShape.EastEdge,
                       TerrainShape.NorthEdge ])
    ],
    [ EdgeShape.South,
      new Uint8Array([ TerrainShape.SouthEdge ])
    ],
    [ EdgeShape.NorthSouthCorridor,
      new Uint8Array([ TerrainShape.NorthSouthCorridor,
                       TerrainShape.EastEdge ])
    ],
    [ EdgeShape.SouthEastCorner,
      new Uint8Array([ TerrainShape.SouthEastCorner,
                       TerrainShape.EastEdge,
                       TerrainShape.SouthEdge ])
    ],
    [ EdgeShape.EastPeninsula,
      new Uint8Array([ TerrainShape.EastPeninsula,
                       TerrainShape.NorthEastCorner,
                       TerrainShape.SouthEastCorner,
                       TerrainShape.EastEdge,
                       TerrainShape.NorthEdge,
                       TerrainShape.SouthEdge ])
    ],
    [ EdgeShape.West,
      new Uint8Array([ TerrainShape.WestEdge ])
    ],
    [ EdgeShape.NorthWestCorner,
      new Uint8Array([ TerrainShape.NorthWestCorner,
                       TerrainShape.NorthEdge,
                       TerrainShape.WestEdge ])
    ],
    [ EdgeShape.EastWestCorridor,
      new Uint8Array([ TerrainShape.EastWestCorridor,
                       TerrainShape.NorthEdge,
                       TerrainShape.SouthEdge ])
    ],
    [ EdgeShape.NorthPeninsula,
      new Uint8Array([ TerrainShape.NorthPeninsula,
                       TerrainShape.NorthEastCorner,
                       TerrainShape.NorthWestCorner,
                       TerrainShape.EastEdge,
                       TerrainShape.NorthEdge,
                       TerrainShape.WestEdge ])
    ],
    [ EdgeShape.SouthWestCorner,
      new Uint8Array([ TerrainShape.SouthWestCorner,
                       TerrainShape.SouthEdge,
                       TerrainShape.WestEdge ])
    ],
    [ EdgeShape.WestPeninsula,
      new Uint8Array([ TerrainShape.WestPeninsula,
                       TerrainShape.NorthWestCorner,
                       TerrainShape.NorthEdge,
                       TerrainShape.SouthEdge,
                       TerrainShape.WestEdge ])
    ],
    [ EdgeShape.SouthPeninsula,
      new Uint8Array([ TerrainShape.SouthPeninsula,
                       TerrainShape.SouthEastCorner,
                       TerrainShape.SouthWestCorner,
                       TerrainShape.EastEdge,
                       TerrainShape.NorthEdge,
                       TerrainShape.WestEdge ])
    ],
    [ EdgeShape.Spire,
      new Uint8Array([ TerrainShape.Spire,
                       TerrainShape.EastPeninsula,
                       TerrainShape.NorthPeninsula,
                       TerrainShape.NorthEastCorner,
                       TerrainShape.EastEdge,
                       TerrainShape.NorthEdge,
                       TerrainShape.SouthEdge,
                       TerrainShape.WestEdge ])
    ],
  ]);

  const foundSupported = (edge: Edge) => {
    console.assert(edgeToShape.has(edge.shape));
    const shapes = edgeToShape.get(edge.shape)!;
    for (const shape of shapes) {
      if (Terrain.isSupportedShape(shape)) {
        terrainShapes[edge.y][edge.x] = shape;
        return true;
      }
    }
    return false;
  };

  const defaultWall = Terrain.isSupportedShape(TerrainShape.Wall)
                    ? TerrainShape.Wall
                    : TerrainShape.Flat;
  for (let edge of edges) {
    if (!foundSupported(edge)) {
      terrainShapes[edge.y][edge.x] = defaultWall;
    }
  }

  // If ramps are requested, all ramps are supported.
  const rampToShape = new Map<RampShape, TerrainShape>([
    [ RampShape.North,  TerrainShape.RampNorth ],
    [ RampShape.East,   TerrainShape.RampEast ],
    [ RampShape.South,  TerrainShape.RampSouth ],
    [ RampShape.West,   TerrainShape.RampWest ],
  ]);
  for (let ramp of ramps) {
    terrainShapes[ramp.y][ramp.x] = rampToShape.get(ramp.shape)!;
  }

  return terrainShapes;
}

export function buildTerrainTypeGrid(biomeGrid: Array<Uint8Array>,
                                     defaultTerrainType: TerrainType): Array<Uint8Array> {
  const cellsY = biomeGrid.length;
  const cellsX = biomeGrid[0].length;
  const typeGrid = new Array<Uint8Array>();
  for (let y = 0; y < cellsY; y++) {
    typeGrid[y] = new Uint8Array(cellsX).fill(defaultTerrainType);
    for (let x = 0; x < cellsX; x++) {
      const biome = biomeGrid[y][x];
      let terrain = defaultTerrainType;
      switch (biome) {
        default:
          console.error("unhandled biome:", getBiomeName(biome));
          break;
        case Biome.Water:
          terrain = TerrainType.Water;
          break;
        case Biome.Desert:
          terrain = TerrainType.Sand;
          break;
        case Biome.Savanna:
        case Biome.Steppe:
          terrain = TerrainType.DryGrass;
          break;
        case Biome.Woodland:
          terrain = TerrainType.WetGrass;
          break;
        case Biome.Rainforest:
          terrain = TerrainType.Mud;
          break;
        case Biome.AlpineDesert:
          terrain = TerrainType.Snow;
          break;
        case Biome.AlpineTundra:
        case Biome.SubalpineForest:
          terrain = TerrainType.Rock;
          break;
      }
      // Only change the type if it's supported.
      if (Terrain.isSupportedType(terrain)) {
        typeGrid[y][x] = terrain;
      } else {
        console.log(
          "unsupported biome terrain type:",
          Terrain.getTypeName(terrain)
        );
      }
    }
  }
  return typeGrid;
}
