// Reserve space for surrounding wall tiles:
// - one row at top
// - one row at bottom
// - one columnn on both right and left

// Divide the remaining space into a grid that is comprised of squares that are
// MIN_TILES wide and MIN_TILES tall. MIN_TILES includes the tiles that are
// needed to wall off an individual room, 5x5 is the default.

// Different styles:
// Linear - place a series of rooms close to each other, with a single path
// connecting all the rooms. Each room has a maximum of two entry/exits.
// Complex - choose a percentage of grids will become rooms and then reserve
// those as rooms, with adjacent grids becoming larger rooms.

bool DungeonGenerator::Init() {
#ifdef DEBUG
  std::cerr << "DungeonGen: Init\n";
  if (!Width || !Height || !RoomDims) {
    std::cerr << "width, height and room dimensions need to be set.\n";
    return false;
  }

  if ((Width < RoomDims) || (Height < RoomDims)) {
    std::cerr << "DungeonGen: width and/or height smaller than room size.\n";
    return false;
  }

  if ((RoomDims < 3) || (RoomDims % 2 == 0))
    std::cerr << "DungeonGen: Invalid room dimensions.\n";
    return false;
  }
#endif

  Columns = (Width - 2) / RoomDims;
  Rows = (Height - 2) / RoomDims;

#ifdef DEBUG
  if (!Columns || !Rows) {
    std::cerr << "DungeonGen: Need at least one column and row.\n");
    return false;
  }

  return true;
}
