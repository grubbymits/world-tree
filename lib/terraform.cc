#include "terraform.h"

#include <cassert>
#include <cstdint>
#include <unordered_map>

using namespace terraform;

std::unique_ptr<EdgeContainer> findEdges(TerraceGrid& terraceGrid) {

  const uint32_t maxX = terraceGrid[0].size();
  const uint32_t maxY = terraceGrid.size();

  EdgeContainer* edges = new EdgeContainer();

  for (uint32_t centreY = 0; centreY < maxY; ++centreY) {
    for (uint32_t centreX = 0; centreX < maxX; ++centreX) {
      const uint8_t centreTerrace = terraceGrid[centreY][centreX];
      uint8_t centreEdges = static_cast<uint8_t>(edge::Shape::None);
      for (uint32_t i = 0; i < 4; ++i) {
        const Coord offset = neighbour::offsets[i];
        const uint32_t neighbourX = centreX + offset.x;
        const uint32_t neighbourY = centreY + offset.y;

        if (
          neighbourX < 0 ||
          neighbourX >= maxX ||
          neighbourY < 0 ||
          neighbourY >= maxY
        ) {
          continue;
        }

        // This assignment defines the values of edge::Shape::
        if (terraceGrid[neighbourY][neighbourX] < centreTerrace) {
          // north = 1;
          // east = 2;
          // south = 4;
          // west = 8;
          centreEdges |= 1 << i;
        }
      }
      assert(centreEdges < static_cast<uint8_t>(edge::Shape::Max));
      const auto shape = static_cast<edge::Shape>(centreEdges);
      if (shape == edge::Shape::None) {
        continue;
      }
      edges->emplace(centreX, centreY, shape);
    }
  }
  return std::make_unique<EdgeContainer>(edges);
}

std::unique_ptr<RampContainer> findRamps(const TerraceGrid terraceGrid,
                                         EdgeContainer &edges,
                                         uint32_t extraDistance) {
  using namespace neighbour;
  // Minimum distance to consider, past the centre position, is two blocks:
  //
  //  ----->
  //    _ _ _
  // _ | | | |
  //     _ _
  //    /   \

  const uint32_t minDistance = 1;
  const uint32_t distance = minDistance + extraDistance;
  const uint32_t minX = distance;
  const uint32_t minY = distance;
  const uint32_t maxX = terraceGrid[0].size() - distance;
  const uint32_t maxY = terraceGrid.size() - distance;
  RampContainer *ramps = new RampContainer();

  auto avoidEdgeAt = [&edges](uint32_t x, uint32_t y) {
    constexpr std::array<edge::Shape, 8> edgesToAvoid = {
      edge::Shape::North,
      edge::Shape::East,
      edge::Shape::South,
      edge::Shape::West,
      edge::Shape::NorthPeninsula,
      edge::Shape::EastPeninsula,
      edge::Shape::SouthPeninsula,
      edge::Shape::WestPeninsula,
    };

    if (const auto shape = edges.find(Coord(x, y)); shape != edges.end()) {
      return std::any_of(edgesToAvoid.begin(), edgesToAvoid.end(),
          [&shape](edge::Shape avoid) { return avoid == shape->second; });
    }
    return false;
  };

  auto areNeighbourTerracesEqual = [&avoidEdgeAt, &distance, &terraceGrid](
      uint32_t x, uint32_t y, neighbour::Cardinal direction) {
    const Coord offset = neighbour::offsets[static_cast<uint8_t>(direction)];
    const uint32_t closestNeighbourX = x + offset.x;
    const uint32_t closestNeighbourY = y + offset.y;
    if (avoidEdgeAt(closestNeighbourX, closestNeighbourY)) {
      return false;
    }
    const uint32_t centreTerrace = terraceGrid[y][x];
    for (uint32_t i = 1; i <= distance; ++i) {
      const uint32_t neighbourY = y + i * offset.y;
      const uint32_t neighbourX = x + i * offset.x;
      const uint32_t neighbourTerrace = terraceGrid[neighbourY][neighbourX];
      if (neighbourTerrace != centreTerrace) {
        return false;
      }
    }
    return true;
  };

  auto areNeighbourTerracesLower = [&avoidEdgeAt, &distance, &terraceGrid](
      uint32_t x, uint32_t y, neighbour::Cardinal direction) {
    const Coord offset = neighbour::offsets[static_cast<uint8_t>(direction)];
    const uint32_t closestNeighbourX = x + offset.x;
    const uint32_t closestNeighbourY = y + offset.y;
    if (avoidEdgeAt(closestNeighbourX, closestNeighbourY)) {
      return false;
    }
    const uint32_t centreTerrace = terraceGrid[y][x];
    for (uint32_t i = 1; i <= distance; ++i) {
      const uint32_t neighbourY = y + i * offset.y;
      const uint32_t neighbourX = x + i * offset.x;
      const uint32_t neighbourTerrace = terraceGrid[neighbourY][neighbourX];
      if (neighbourTerrace != centreTerrace - 1) {
        return false;
      }
    }
    return true;
  };

  for (const auto& [coord, shape] : edges) {
    const uint32_t x = coord.x;
    const uint32_t y = coord.y;
    if (x < minX || x >= maxX || y < minY || y >= maxY) {
      continue;
    }
    switch (shape) {
      default:
        break;
      case edge::Shape::North:
      case edge::Shape::NorthPeninsula:
        if (
          areNeighbourTerracesLower(x, y, Cardinal::North) &&
          areNeighbourTerracesEqual(x, y, Cardinal::South)
        ) {
          ramps->emplace(x, y, ramp::Shape::South);
        }
        break;
      case edge::Shape::South:
      case edge::Shape::SouthPeninsula:
        if (
          areNeighbourTerracesLower(x, y, Cardinal::South) &&
          areNeighbourTerracesEqual(x, y, Cardinal::North)
        ) {
          ramps->emplace(x, y, ramp::Shape::North);
        }
        break;
      case edge::Shape::East:
      case edge::Shape::EastPeninsula:
        if (
          areNeighbourTerracesLower(x, y, Cardinal::East) &&
          areNeighbourTerracesEqual(x, y, Cardinal::West)
        ) {
          ramps->emplace(x, y, ramp::Shape::West);
        }
        break;
      case edge::Shape::West:
      case edge::Shape::WestPeninsula:
        if (
          areNeighbourTerracesLower(x, y, Cardinal::West) &&
          areNeighbourTerracesEqual(x, y, Cardinal::East)
        ) {
          ramps->emplace(x, y, ramp::Shape::East);
        }
        break;
    }
  }

  // Adding ramps will create more edges...
  auto addEdge = [&edges, &ramps](Coord neighbour, edge::Shape edgeShape) {
    if (ramps->count(neighbour)) {
      return;
    }
    if (auto shape = edges.find(neighbour); shape != edges.end()) {
      shape->second = addCardinalEdge(shape->second, edgeShape);
    } else {
      edges.emplace(neighbour, edgeShape);
    }
  };

  for (const auto &[coord, shape ] : *ramps) {
    const uint32_t x = coord.x;
    const uint32_t y = coord.y;
    switch (shape) {
      case ramp::Shape::North:
      case ramp::Shape::South:
        addEdge(getNeighbour(coord, Cardinal::East), edge::Shape::West);
        addEdge(getNeighbour(coord, Cardinal::West), edge::Shape::East);
        break;
      case ramp::Shape::East:
      case ramp::Shape::West:
        addEdge(getNeighbour(coord, Cardinal::North), edge::Shape::South);
        addEdge(getNeighbour(coord, Cardinal::South), edge::Shape::North);
        break;
    }
  }
  return std::make_unique<RampContainer>(ramps);
}
