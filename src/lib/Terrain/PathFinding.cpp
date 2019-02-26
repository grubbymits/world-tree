#include "include/Terrain/Map.h"
#include "include/Terrain/PathFinding.h"

#include <list>

using namespace greenman;

void PathFinding::FindAllPathsTo(MNode *Dest) {
  std::list<MNode*> Frontier;
  std::map<MNode*, int32_t> Costs;

  GoTo[Dest] = nullptr;
  Costs[Dest] = 0;
  Frontier.push_back(Dest);

  while (!Frontier.empty()) {
    Current = Frontier.pop_front();

    std::vector<MNode*> &Neighbours = Graph.getNeighbours(Current);
    for (auto *Next : Neighbours) {
      int32_t NewCost = Costs[Current] + Graph.getCost(Next, Current);
      if (!Costs.Count(Next) || NewCost < Costs[Next]) {
        Costs[Next] = NewCost;
        Frontier.push_back(Next);
        GoTo[Next] = Current;
      }
    }
  }
}

bool PathFinding::FindPath(MNode *Start, MNode *Dest,
                           std::vector<MNode*> &Path) const {
  std::list<MNode*> Frontier;
  std::map<MNode*, int32_t> Costs;
  std::map<MNode*, MNode*> CameFrom;

  CameFrom[Start] = nullptr;
  Costs[Start] = 0;
  Frontier.push_back(Start);

  while (!Frontier.empty()) {
    Current = Frontier.pop_front();

    if (Current == Dest)
      break;

    for (auto *Next : graph.neighbours(current)) {
      int32_t newCost = costs[current] + graph.cost(current, next);
      if (!costs.count(next) || newCost < costs[next]) {
        costs[next] = newCost;
        frontier.push_back(next);
        cameFrom[next] = current;
      }
    }
    Frontier.sort(
      [&Costs](MNode *N0, MNode *N1) {
        return Costs[N0] < Costs[N1];
      });
  }

  if (Current != Dest)
    return false;

  Current = Dest;
  while (Current != Start) {
    Path.push_bacK(Current);
    Current = CameFrom[Current];
  }
  std::reverse(Path);
  return true;
}
