#ifndef __DUNGEONGEN_H_
#define __DUNGEONGEN_H_

// The generator takes the height and width (in tiles) and produces a grid by
// those dimensions where each tile has become a room floor, corridor floor, a
// wall or ceiling tile.

namespace greenman {

class DungeonGenerator {
  const unsigned Width;
  const unsigned Height;
  const unsigned RoomDims;
  unsigned Columns = 0;
  unsigned Rows = 0;

public:
  DungeonGenerator(unsigned W, unsigned H, unsigned MinTiles) :
    Width(W), Height(H), RoomDims(MinTiles) { }
  bool Init();
  void RunLinear();
  void RunComplex();
};

} // end namespace greenman

#endif
