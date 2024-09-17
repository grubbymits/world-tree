import * as WT from "../dist/world-tree.mjs";

test("is edge", () => {
  const edges = new Set([
    WT.TerrainShape.Wall,
    WT.TerrainShape.NorthEdge,
    WT.TerrainShape.EastEdge,
    WT.TerrainShape.NorthEastCorner,
    WT.TerrainShape.SouthEdge,
    WT.TerrainShape.NorthSouthCorridor,
    WT.TerrainShape.SouthEastCorner,
    WT.TerrainShape.EastPeninsula,
    WT.TerrainShape.WestEdge,
    WT.TerrainShape.NorthWestCorner,
    WT.TerrainShape.EastWestCorridor,
    WT.TerrainShape.NorthPeninsula,
    WT.TerrainShape.SouthWestCorner,
    WT.TerrainShape.WestPeninsula,
    WT.TerrainShape.SouthPeninsula,
    WT.TerrainShape.Spire,
  ]);
  for (let shape = WT.TerrainShape.Flat; shape < WT.TerrainShape.Max; ++shape) {
    const expected = edges.has(shape);
    expect(WT.Terrain.isEdge(shape)).toBe(expected);
  }
});

test("is ramp", () => {
  const ramps = new Set([
    WT.TerrainShape.RampNorth,
    WT.TerrainShape.RampEast,
    WT.TerrainShape.RampSouth,
    WT.TerrainShape.RampWest,
  ]);
  for (let shape = WT.TerrainShape.Flat; shape < WT.TerrainShape.Max; ++shape) {
    const expected = ramps.has(shape);
    expect(WT.Terrain.isRamp(shape)).toBe(expected);
  }
});
