#ifndef __TERRAIN_H_
#define __TERRAIN_H_

namespace greenman {

class Location {
  Sprite *Img = nullptr;
};

class Feature {
protected:
  bool IsBlocking = false;
  Sprite *Img = nullptr;
  uint32_t Width = 0;
  uint32_t Height = 0;
};

class TerrainDescriptor {
public:
  TerrainDescriptor(bool Outdoors) : IsOutdoors(Outdoors) { }

protected:
  bool IsOutdoors = false;
  bool HasWalls = false;
  bool HasWater = false;
  bool HasDoors = false;
  uint32_t NumTerraces = 1;
  std::vector<unique_ptr<Location>> Locations;
};

class OutdoorTerrain : public TerrainDescriptor {
  std::vector<unique_ptr<Feature>> Trees;
  std::vector<unique_ptr<Feature>> Rocks;
  std::vector<unique_ptr<Feature>> Plants;

public:
  OutdoorTerrain() : TerrainDescriptor(true) { }
  ~OutdoorTerrain() = 0;
  virtual void Init() = 0;
  virtual const Location *getOcean() const { return nullptr; }
  virtual const Location *getBeach() const { return nullptr; }
  virtual const Location *getRiver() const { return nullptr; }
  virtual const Location *getSwamp() const { return nullptr; }
  virtual const Location *getMud() const { return nullptr; }
  virtual const Location *getCliff() const { return nullptr; }
  virtual const Location *getGrassland() const { return nullptr; }
  virtual const Location *getHeathland() const { return nullptr; }
  virtual const Location *getWoodland() const { return nullptr; }
  virtual const Location *getForest() const { return nullptr; }
  virtual const Location *getTundra() const { return nullptr; }
  virtual const Tree *getMoistTree(bool Large) const { return nullptr; }
  virtual const Tree *getDryTree(bool Large) const { return nullptr; }
  virtual const Tree *getWarmTree(bool Large) const { return nullptr; }
  virtual const Tree *getColdTree(bool Large) const { return nullptr; }
};

} // end namespace greenman

#endif
