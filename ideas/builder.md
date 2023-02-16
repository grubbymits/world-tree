<!-- deno-fmt-ignore-file -->

Current difficulties

- Need more variation in ground colour to differentiate between areas.
- Higher elevation biomes would generally be different colors to lower.
- Higher elevation biomes are less varied.
- Having a matrix that covers both elevation and moisture is surprisingly difficult.

The moisture supplied to the map, via rain, is dictated by the terrain and wind direction. Given that, the elevation, will greatly control the amount of moisture dropped, we could stop using it as a separate characteristic when calculating the biome. But, if we want different colours for lower and higher elevations, we probably couldn't just rely on moisture. So, one way around this would be to use elevation, but in a very course manner, such as splitting into two areas, i.e. lowlands and uplands.

Height    = [ low, high ]
Moisture  = [ 0, 1, 2, 3, 4, 5 ]

So, for the various relative moisture levels in each course elevation area:
- Lowlands
-- desert              0
-- grassland,          1
-- shrubland,          2
-- moist forest,       3
-- wet forest,         4
-- rainforest,         5

- Uplands
-- alpine tundra       0 
-- grassland           1
-- alpine meadow       2
-- sub-alpine forest   3
-- taiga               4

Areas around rivers and lakes could be given a marsh biome for both the low- and uplands.

There is a tendency to combine higher elevations with areas of higher latitude, as they can share charateristics. Maybe temperature could be considered later.
