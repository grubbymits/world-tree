#ifndef __PATHFINDER_H_
#define __PATHFINDER_H_

namespace Eden {

class MNode;
class Map;

using NeighbourMap = std::map<MNode*, std::vector<MNode*>>;
using Path = std::vector<MNode*>;
using PathsToFrom = std::map<MNode*, std::map<MNode*, Path>>;

class Graph {
  NeighbourMap Neighbours;
  PathsToFrom AllPaths;
  Map &CurMap;

public:
  Graph(Map &M) : CurMap(M) { }
  float getCost(MNode *Current, MNode *Next) const;

  const std::vector<MNode*>& getNeighbours(MNode *Node) const {
#ifdef DEBUG
    assert(Neighbours.count(Node);
#endif
    return Neighbours[Node];
  }

  void CalcNewPath(MNode *From, MNode *To) const;

  void CalcAllPathsTo(MNode *To) const;

  MNode *getNext(MNode *Current, MNode *Dest) const;

};

} // end namespace Eden

#endif
