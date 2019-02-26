#ifndef __PATHFINDER_H_
#define __PATHFINDER_H_

#include <map>
#include <vector>

namespace greenman {

class MNode;
class Map;

using NeighbourMap = std::map<MNode*, std::vector<MNode*>>;

class Graph {
  NeighbourMap Neighbours;
  Map &CurMap;
  std::map<MNode*, MNode*> GoTo;

public:
  Graph(Map &M) : CurMap(M) { }
  float getCost(MNode *From, MNode *To) const;

  std::vector<MNode*>& getNeighbours(MNode *Node) const {
#ifdef DEBUG
    assert(Neighbours.count(Node);
#endif
    return Neighbours[Node];
  }

  bool FindPath(MNode *Start, MNode *Dest, std::vector<MNode*> &Path) const;

  void FindAllPathsTo(MNode *Dest);

  MNode *getNext(MNode *Current, MNode *Dest) const;

};

} // end namespace greenman

#endif
