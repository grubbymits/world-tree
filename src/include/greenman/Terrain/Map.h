#ifndef __MAP_H_
#define __MAP_H_

namespace greenman {

class MNode {
  float Height = 1.0;
  float Moisture 1.0;
  float Temperature = 1.0;
  int32_t Terrace = 0;
  bool IsSnow = false;
  bool IsWater = false;
  bool IsSand = false;
  bool IsMud = false;
  bool IsGrass = false;
  bool IsRock = false;
  bool IsBlocked = false;

public:
  MNode();
};

class Map {
  const unsigned Width;
  const unsigned Height;
  MNode **Grid = nullptr;

public:
  Map(unsigned W, unsigned H) : Width(W), Height(H) { }
  void Init();
  void setLocation(unsigned x, unsigned y, MNode *N) {
#ifdef DEBUG
    assert((x < Width) && (y < Height));
#endif
    Grid[x][y] = *N;
  }
  MNode *getLocation(unsigned x, unsigned y) {
#ifdef DEBUG
    assert((x < Width) && (y < Height));
#endif
    return Grid[x][y];
  }
};

} // end namespace greenman

#endif
