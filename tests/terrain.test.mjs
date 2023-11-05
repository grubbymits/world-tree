import * as WT from "../dist/world-tree.mjs";

test("recognise terrain shapes", () => {
  for (let i = 0; i < WT.TerrainShape.Max; ++i) {
    let res = WT.Terrain.isRamp(i) || WT.Terrain.isFlat(i) || WT.Terrain.isEdge(i);
    expect(res).toBe(true); 
  }
});

test("is flat", () => {
  expect(WT.Terrain.isFlat(WT.TerrainShape.Flat)).toBe(true);
  expect(WT.Terrain.isFlat(WT.TerrainShape.Wall)).toBe(true);
  expect(WT.Terrain.isFlat(WT.TerrainShape.FlatWest)).toBe(true);
  expect(WT.Terrain.isFlat(WT.TerrainShape.FlatEast)).toBe(true);
  expect(WT.Terrain.isFlat(WT.TerrainShape.FlatNorthWest)).toBe(true);
  expect(WT.Terrain.isFlat(WT.TerrainShape.FlatNorth)).toBe(true);
  expect(WT.Terrain.isFlat(WT.TerrainShape.FlatNorthEast)).toBe(true);
  expect(WT.Terrain.isFlat(WT.TerrainShape.FlatSouthWest)).toBe(true);
  expect(WT.Terrain.isFlat(WT.TerrainShape.FlatSouth)).toBe(true);
  expect(WT.Terrain.isFlat(WT.TerrainShape.FlatSouthEast)).toBe(true);
  expect(WT.Terrain.isFlat(WT.TerrainShape.FlatNorthOut)).toBe(true);
  expect(WT.Terrain.isFlat(WT.TerrainShape.FlatEastOut)).toBe(true);
  expect(WT.Terrain.isFlat(WT.TerrainShape.FlatWestOut)).toBe(true);
  expect(WT.Terrain.isFlat(WT.TerrainShape.FlatSouthOut)).toBe(true);
  expect(WT.Terrain.isFlat(WT.TerrainShape.FlatAloneOut)).toBe(true);
  expect(WT.Terrain.isFlat(WT.TerrainShape.FlatNorthSouth)).toBe(true);
  expect(WT.Terrain.isFlat(WT.TerrainShape.FlatEastWest)).toBe(true);
  expect(WT.Terrain.isFlat(WT.TerrainShape.RampUpSouthEdge)).toBe(false);
  expect(WT.Terrain.isFlat(WT.TerrainShape.RampUpWestEdge)).toBe(false);
  expect(WT.Terrain.isFlat(WT.TerrainShape.RampUpEastEdge)).toBe(false);
  expect(WT.Terrain.isFlat(WT.TerrainShape.RampUpNorthEdge)).toBe(false);
  expect(WT.Terrain.isFlat(WT.TerrainShape.RampUpSouth)).toBe(false);
  expect(WT.Terrain.isFlat(WT.TerrainShape.RampUpWest)).toBe(false);
  expect(WT.Terrain.isFlat(WT.TerrainShape.RampUpEast)).toBe(false);
  expect(WT.Terrain.isFlat(WT.TerrainShape.RampUpNorth)).toBe(false);
});

test("is edge", () => {
  expect(WT.Terrain.isEdge(WT.TerrainShape.Flat)).toBe(false);
  expect(WT.Terrain.isEdge(WT.TerrainShape.Wall)).toBe(true);
  expect(WT.Terrain.isEdge(WT.TerrainShape.FlatWest)).toBe(true);
  expect(WT.Terrain.isEdge(WT.TerrainShape.FlatEast)).toBe(true);
  expect(WT.Terrain.isEdge(WT.TerrainShape.FlatNorthWest)).toBe(true);
  expect(WT.Terrain.isEdge(WT.TerrainShape.FlatNorth)).toBe(true);
  expect(WT.Terrain.isEdge(WT.TerrainShape.FlatNorthEast)).toBe(true);
  expect(WT.Terrain.isEdge(WT.TerrainShape.FlatSouthWest)).toBe(true);
  expect(WT.Terrain.isEdge(WT.TerrainShape.FlatSouth)).toBe(true);
  expect(WT.Terrain.isEdge(WT.TerrainShape.FlatSouthEast)).toBe(true);
  expect(WT.Terrain.isEdge(WT.TerrainShape.FlatNorthOut)).toBe(true);
  expect(WT.Terrain.isEdge(WT.TerrainShape.FlatEastOut)).toBe(true);
  expect(WT.Terrain.isEdge(WT.TerrainShape.FlatWestOut)).toBe(true);
  expect(WT.Terrain.isEdge(WT.TerrainShape.FlatSouthOut)).toBe(true);
  expect(WT.Terrain.isEdge(WT.TerrainShape.FlatAloneOut)).toBe(true);
  expect(WT.Terrain.isEdge(WT.TerrainShape.FlatNorthSouth)).toBe(true);
  expect(WT.Terrain.isEdge(WT.TerrainShape.FlatEastWest)).toBe(true);
  expect(WT.Terrain.isEdge(WT.TerrainShape.RampUpSouthEdge)).toBe(true);
  expect(WT.Terrain.isEdge(WT.TerrainShape.RampUpWestEdge)).toBe(true);
  expect(WT.Terrain.isEdge(WT.TerrainShape.RampUpEastEdge)).toBe(true);
  expect(WT.Terrain.isEdge(WT.TerrainShape.RampUpNorthEdge)).toBe(true);
  expect(WT.Terrain.isEdge(WT.TerrainShape.RampUpSouth)).toBe(false);
  expect(WT.Terrain.isEdge(WT.TerrainShape.RampUpWest)).toBe(false);
  expect(WT.Terrain.isEdge(WT.TerrainShape.RampUpEast)).toBe(false);
  expect(WT.Terrain.isEdge(WT.TerrainShape.RampUpNorth)).toBe(false);
});

test("is ramp", () => {
  expect(WT.Terrain.isRamp(WT.TerrainShape.Flat)).toBe(false);
  expect(WT.Terrain.isRamp(WT.TerrainShape.Wall)).toBe(false);
  expect(WT.Terrain.isRamp(WT.TerrainShape.FlatWest)).toBe(false);
  expect(WT.Terrain.isRamp(WT.TerrainShape.FlatEast)).toBe(false);
  expect(WT.Terrain.isRamp(WT.TerrainShape.FlatNorthWest)).toBe(false);
  expect(WT.Terrain.isRamp(WT.TerrainShape.FlatNorth)).toBe(false);
  expect(WT.Terrain.isRamp(WT.TerrainShape.FlatNorthEast)).toBe(false);
  expect(WT.Terrain.isRamp(WT.TerrainShape.FlatSouthWest)).toBe(false);
  expect(WT.Terrain.isRamp(WT.TerrainShape.FlatSouth)).toBe(false);
  expect(WT.Terrain.isRamp(WT.TerrainShape.FlatSouthEast)).toBe(false);
  expect(WT.Terrain.isRamp(WT.TerrainShape.FlatNorthOut)).toBe(false);
  expect(WT.Terrain.isRamp(WT.TerrainShape.FlatEastOut)).toBe(false);
  expect(WT.Terrain.isRamp(WT.TerrainShape.FlatWestOut)).toBe(false);
  expect(WT.Terrain.isRamp(WT.TerrainShape.FlatSouthOut)).toBe(false);
  expect(WT.Terrain.isRamp(WT.TerrainShape.FlatAloneOut)).toBe(false);
  expect(WT.Terrain.isRamp(WT.TerrainShape.FlatNorthSouth)).toBe(false);
  expect(WT.Terrain.isRamp(WT.TerrainShape.FlatEastWest)).toBe(false);
  expect(WT.Terrain.isRamp(WT.TerrainShape.RampUpSouthEdge)).toBe(true);
  expect(WT.Terrain.isRamp(WT.TerrainShape.RampUpWestEdge)).toBe(true);
  expect(WT.Terrain.isRamp(WT.TerrainShape.RampUpEastEdge)).toBe(true);
  expect(WT.Terrain.isRamp(WT.TerrainShape.RampUpNorthEdge)).toBe(true);
  expect(WT.Terrain.isRamp(WT.TerrainShape.RampUpSouth)).toBe(true);
  expect(WT.Terrain.isRamp(WT.TerrainShape.RampUpWest)).toBe(true);
  expect(WT.Terrain.isRamp(WT.TerrainShape.RampUpEast)).toBe(true);
  expect(WT.Terrain.isRamp(WT.TerrainShape.RampUpNorth)).toBe(true);
});

test("terrain sprites", () => {
  const spriteConfig = {
    spriteSheet: WT.DummySpriteSheet,
    spriteWidth: 161,
    spriteHeight: 125,
    tileRows: [
      WT.TerrainType.Lowland0,
    ],
    tileColumns: [
      WT.TerrainShape.Flat,
      WT.TerrainShape.FlatWest,
      WT.TerrainShape.FlatNorth,
      WT.TerrainShape.FlatEast,
      WT.TerrainShape.FlatSouth,
      WT.TerrainShape.FlatNorthWest,
      WT.TerrainShape.FlatNorthEast,
      WT.TerrainShape.FlatSouthEast,
      WT.TerrainShape.FlatSouthWest,
      WT.TerrainShape.FlatWestOut,
      WT.TerrainShape.FlatNorthOut,
      WT.TerrainShape.FlatEastOut,
      WT.TerrainShape.FlatSouthOut,
      WT.TerrainShape.FlatAloneOut,
      WT.TerrainShape.FlatNorthSouth,
      WT.TerrainShape.FlatEastWest,
      WT.TerrainShape.RampUpSouth,
      WT.TerrainShape.RampUpWest,
      WT.TerrainShape.RampUpEast,
      WT.TerrainShape.RampUpNorth,
    ]
  };
  WT.Terrain.generateSprites(spriteConfig);
  expect(WT.Terrain.isSupportedShape(WT.TerrainType.Lowland0, WT.TerrainShape.Flat)).toBe(true);
  expect(WT.Terrain.isSupportedShape(WT.TerrainType.Lowland0, WT.TerrainShape.FlatWest)).toBe(true);
  expect(WT.Terrain.isSupportedShape(WT.TerrainType.Lowland0, WT.TerrainShape.FlatNorth)).toBe(true);
  expect(WT.Terrain.isSupportedShape(WT.TerrainType.Lowland0, WT.TerrainShape.FlatEast)).toBe(true);
  expect(WT.Terrain.isSupportedShape(WT.TerrainType.Lowland0, WT.TerrainShape.FlatSouth)).toBe(true);
  expect(WT.Terrain.isSupportedShape(WT.TerrainType.Lowland0, WT.TerrainShape.FlatNorthWest)).toBe(true);
  expect(WT.Terrain.isSupportedShape(WT.TerrainType.Lowland0, WT.TerrainShape.FlatNorthEast)).toBe(true);
  expect(WT.Terrain.isSupportedShape(WT.TerrainType.Lowland0, WT.TerrainShape.FlatSouthEast)).toBe(true);
  expect(WT.Terrain.isSupportedShape(WT.TerrainType.Lowland0, WT.TerrainShape.FlatSouthWest)).toBe(true);
  expect(WT.Terrain.isSupportedShape(WT.TerrainType.Lowland0, WT.TerrainShape.FlatWestOut)).toBe(true);
  expect(WT.Terrain.isSupportedShape(WT.TerrainType.Lowland0, WT.TerrainShape.FlatNorthOut)).toBe(true);
  expect(WT.Terrain.isSupportedShape(WT.TerrainType.Lowland0, WT.TerrainShape.FlatEastOut)).toBe(true);
  expect(WT.Terrain.isSupportedShape(WT.TerrainType.Lowland0, WT.TerrainShape.FlatSouthOut)).toBe(true);
  expect(WT.Terrain.isSupportedShape(WT.TerrainType.Lowland0, WT.TerrainShape.FlatAloneOut)).toBe(true);
  expect(WT.Terrain.isSupportedShape(WT.TerrainType.Lowland0, WT.TerrainShape.FlatNorthSouth)).toBe(true);
  expect(WT.Terrain.isSupportedShape(WT.TerrainType.Lowland0, WT.TerrainShape.FlatEastWest)).toBe(true);
  expect(WT.Terrain.isSupportedShape(WT.TerrainType.Lowland0, WT.TerrainShape.RampUpSouth)).toBe(true);
  expect(WT.Terrain.isSupportedShape(WT.TerrainType.Lowland0, WT.TerrainShape.RampUpWest)).toBe(true);
  expect(WT.Terrain.isSupportedShape(WT.TerrainType.Lowland0, WT.TerrainShape.RampUpEast)).toBe(true);
  expect(WT.Terrain.isSupportedShape(WT.TerrainType.Lowland0, WT.TerrainShape.RampUpNorth)).toBe(true);
});
