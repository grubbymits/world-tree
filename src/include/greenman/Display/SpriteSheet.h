#ifndef __SPRITESHEET_H_
#define __SPRITESHEET_H_

namespace greenman {

class TerrainSpriteSheet {

public:
  TerrainSpriteSheet() = delete;
  virtual ~TerrainSpriteSheet() = 0;
  virtual Sprite *getFloor(uint32_t Type) const { return nullptr; }
  virtual Sprite *getFloorBlend(uint32_t Type) const { return nullptr; }
  virtual Sprite *getWall(uint32_t Type) const { return nullptr; }
  virtual Sprite *getWaterEdgeTop(uint32_t Type) const { return nullptr; }
  virtual Sprite *getWaterEdgeBottom(uint32_t Type) const { return nullptr; }
  virtual Sprite *getWaterEdgeRight(uint32_t Type) const { return nullptr; }
  virtual Sprite *getWaterEdgeLeft(uint32_t Type) const { return nullptr; }
  virtual Sprite *getShadowTop() const { return nullptr; }
  virtual Sprite *getShadowBottom() const { return nullptr; }
  virtual Sprite *getShadowRight() const { return nullptr; }
  virtual Sprite *getShadowLeft() const { return nullptr; }
};

} // end namespace greenman

#endif
