
void Map::calcPaths() {
  std::list<MNode*> frontier;
  std::map<MNode*, int32_t> costs;
  std::map<MNode*, MNode*> cameFrom;

  cameFrom[start] = nullptr;
  costs[start] = 0;
  frontier.push_back(start);

  while (!frontier.empty()) {
    current = frontier.pop_front();

    for (auto *next : graph.neighbours(current)) {
      int32_t newCost = costs[current] + graph.cost(current, next);
      if (!costs.count(next) || newCost < costs[next]) {
        costs[next] = newCost;
        frontier.push_back(next);
        cameFrom[next] = current;
      }
    }
    frontier.sort(
      [&costs](MNode *n0, MNode *n1) {
        return costs[n0] < costs[n1];
      });
  }
}
