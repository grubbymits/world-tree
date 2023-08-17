class WorldTreeConfig {
  private readonly _dimensions: Array<number>;
  private readonly _heightMap: Array<Array<number>>;
  private readonly _projection: Projection;
  private readonly _defaultFoor: TerrainType;
  private readonly _defaultWall: TerrainType;
  private readonly _terrainSpriteWidth: number,
  private readonly _terrainSpriteHeight: number,
  private readonly _terrainSpriteSheetPath: string,
  private readonly _spriteSheetColumns: Array<TerrainType>;
  private readonly _spriteSheetRows: Array<TerrainType>;
};

const desc = {
  'dimensions' : [9, 9, 2],
  'heightMap' : [
    [2, 2, 2, 2, 2, 2, 2, 2, 2],
    [2, 2, 1, 1, 1, 2, 1, 1, 2],
    [2, 1, 1, 1, 1, 2, 1, 1, 2],
    [2, 1, 1, 1, 1, 1, 1, 1, 2],
    [2, 1, 1, 2, 1, 1, 1, 2, 2],
    [2, 1, 2, 1, 1, 1, 1, 1, 2],
    [2, 1, 1, 1, 2, 1, 1, 1, 2],
    [2, 2, 1, 1, 1, 1, 2, 1, 2],
    [2, 2, 2, 2, 2, 2, 2, 2, 2],
  ],
  'projection' : 'Projection.TwoByOneIsometric',
  'defaultFloor' : 'TerrainType.Upland0',
  'defaultWall' : 'TerrainType.Upland1',
  'terrainSpriteWidth' : 322,
  'terrainSpriteHeight' : 270,
  'terrainSpriteSheet' : spriteSheet,
  'spriteSheetColumns' : [ ],
  'spriteSheetRows' : [ TerrainType.Upland5,
                        TerrainType.Upland4,
                        TerrainType.Upland3,
                        TerrainType.Upland2,
                        TerrainType.Upland1,
                        TerrainType.Upland0 ],
};

const context = WT.createContext(desc);

