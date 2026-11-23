#include "terraform.h"

#include <cassert>
#include <cstdint>
#include <numeric>
#include <unordered_map>

using namespace terraform;

float normaliseHeightGrid(HeightGrid& heightGrid, uint8_t numTerraces) {
  // Normalise heights, minimum = 0;
  float minHeight = 0;
  float maxHeight = 0;
  for (uint32_t i = 0; i < heightGrid.height(); i++) {
    const std::vector<float> &row = heightGrid.row(i);
    const float max = *std::max_element(row.begin(), row.end());
    const float min = *std::min_element(row.begin(), row.end());
    minHeight = std::min(minHeight, min);
    maxHeight = std::max(maxHeight, max);
  }
  if (minHeight < 0) {
    minHeight = std::abs(minHeight);
    for (uint32_t i = 0; i < heightGrid.height(); i++) {
      std::vector<float> &row = heightGrid.row(i);
      std::transform(row.begin(), row.end(), row.begin(), [&minHeight]
          (float h) { return h + minHeight; });
    }
    maxHeight += minHeight;
  }
  return maxHeight / numTerraces;
}

TerraceGrid buildTerraceGrid(const HeightGrid& heightGrid,
                             uint32_t terraceSpacing) {
  TerraceGrid terraceGrid(heightGrid.width(), heightGrid.height());

  for (uint32_t i = 0; i < terraceGrid.height(); i++) {
    const std::vector<float> &heightRow = heightGrid.row(i);
    std::vector<uint8_t> &terraceRow = terraceGrid.row(i);
    std::transform(heightRow.begin(), heightRow.end(), terraceRow.begin(),
        [&terraceSpacing](float surfaceHeight) {
          return std::floor(surfaceHeight / terraceSpacing);
        });
  }
  return terraceGrid;
}

EdgeContainer findEdges(TerraceGrid& terraceGrid) {
  const uint32_t maxX = terraceGrid.width();
  const uint32_t maxY = terraceGrid.height();

  EdgeContainer edges;

  for (uint32_t centreY = 0; centreY < maxY; ++centreY) {
    for (uint32_t centreX = 0; centreX < maxX; ++centreX) {
      const uint8_t centreTerrace = terraceGrid.at(centreX, centreY);
      uint8_t centreEdges = edge::u8(edge::Shape::None);
      const Coord centre(centreX, centreY);
      for (uint32_t i = 0; i < 4; ++i) {
        const Coord neighbour = neighbour::get(centre, i);

        if (
          neighbour.x < 0 ||
          neighbour.x >= maxX ||
          neighbour.y < 0 ||
          neighbour.y >= maxY
        ) {
          continue;
        }

        // This assignment defines the values of edge::Shape::
        if (terraceGrid.at(neighbour) < centreTerrace) {
          // north = 1;
          // east = 2;
          // south = 4;
          // west = 8;
          centreEdges |= 1 << i;
        }
      }
      assert(centreEdges < edge::u8(edge::Shape::Max));
      const auto shape = static_cast<edge::Shape>(centreEdges);
      if (shape == edge::Shape::None) {
        continue;
      }
      edges.emplace(Coord(centre.x, centre.y), shape);
    }
  }
  return edges;
}

RampContainer findRamps(const TerraceGrid& terraceGrid,
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
  const uint32_t maxX = terraceGrid.width() - distance;
  const uint32_t maxY = terraceGrid.height() - distance;
  RampContainer ramps;

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
    const Coord offset = neighbour::offset(direction);
    const uint32_t closestNeighbourX = x + offset.x;
    const uint32_t closestNeighbourY = y + offset.y;
    if (avoidEdgeAt(closestNeighbourX, closestNeighbourY)) {
      return false;
    }
    const uint32_t centreTerrace = terraceGrid.at(x, y);
    for (uint32_t i = 1; i <= distance; ++i) {
      const uint32_t neighbourY = y + i * offset.y;
      const uint32_t neighbourX = x + i * offset.x;
      const uint32_t neighbourTerrace = terraceGrid.at(neighbourX, neighbourY);
      if (neighbourTerrace != centreTerrace) {
        return false;
      }
    }
    return true;
  };

  auto areNeighbourTerracesLower = [&avoidEdgeAt, &distance, &terraceGrid](
      uint32_t x, uint32_t y, neighbour::Cardinal direction) {
    const Coord offset = neighbour::offset(direction);
    const uint32_t closestNeighbourX = x + offset.x;
    const uint32_t closestNeighbourY = y + offset.y;
    if (avoidEdgeAt(closestNeighbourX, closestNeighbourY)) {
      return false;
    }
    const uint32_t centreTerrace = terraceGrid.at(x, y);
    for (uint32_t i = 1; i <= distance; ++i) {
      const uint32_t neighbourY = y + i * offset.y;
      const uint32_t neighbourX = x + i * offset.x;
      const uint32_t neighbourTerrace = terraceGrid.at(neighbourX, neighbourY);
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
          ramps.emplace(Coord(x, y), ramp::Shape::South);
        }
        break;
      case edge::Shape::South:
      case edge::Shape::SouthPeninsula:
        if (
          areNeighbourTerracesLower(x, y, Cardinal::South) &&
          areNeighbourTerracesEqual(x, y, Cardinal::North)
        ) {
          ramps.emplace(Coord(x, y), ramp::Shape::North);
        }
        break;
      case edge::Shape::East:
      case edge::Shape::EastPeninsula:
        if (
          areNeighbourTerracesLower(x, y, Cardinal::East) &&
          areNeighbourTerracesEqual(x, y, Cardinal::West)
        ) {
          ramps.emplace(Coord(x, y), ramp::Shape::West);
        }
        break;
      case edge::Shape::West:
      case edge::Shape::WestPeninsula:
        if (
          areNeighbourTerracesLower(x, y, Cardinal::West) &&
          areNeighbourTerracesEqual(x, y, Cardinal::East)
        ) {
          ramps.emplace(Coord(x, y), ramp::Shape::East);
        }
        break;
    }
  }

  // Adding ramps will create more edges...
  auto addEdge = [&edges, &ramps](Coord neighbour, edge::Shape edgeShape) {
    if (ramps.count(neighbour)) {
      return;
    }
    if (auto shape = edges.find(neighbour); shape != edges.end()) {
      shape->second = addCardinalEdge(shape->second, edgeShape);
    } else {
      edges.emplace(neighbour, edgeShape);
    }
  };

  for (const auto &[coord, shape ] : ramps) {
    const uint32_t x = coord.x;
    const uint32_t y = coord.y;
    switch (shape) {
      case ramp::Shape::Max: break;
      case ramp::Shape::North:
      case ramp::Shape::South:
        addEdge(neighbour::get(coord, Cardinal::East), edge::Shape::West);
        addEdge(neighbour::get(coord, Cardinal::West), edge::Shape::East);
        break;
      case ramp::Shape::East:
      case ramp::Shape::West:
        addEdge(neighbour::get(coord, Cardinal::North), edge::Shape::South);
        addEdge(neighbour::get(coord, Cardinal::South), edge::Shape::North);
        break;
    }
  }
  return ramps;
}

BlockingGrid buildBlockingGrid(
  TerraceGrid terraceGrid,
  const EdgeContainer& edges,
  const RampContainer& ramps,
  bool blockingRamps,
  uint32_t blockingUpHeight,
  uint32_t blockingDownHeight) {
  // Initialise new grid
  BlockingGrid blockingGrid(terraceGrid.width(), terraceGrid.height());

  // Top edge
  for (uint32_t x = 0; x < blockingGrid.width(); ++x) {
    blockingGrid.at(x, 0) |=
      direction::u8(direction::Bit::North) |
      direction::u8(direction::Bit::NorthWest) |
      direction::u8(direction::Bit::NorthEast);
  }
  // Bottom edge
  for (uint32_t x = 0; x < blockingGrid.width(); ++x) {
    uint32_t y = blockingGrid.height() - 1;
    blockingGrid.at(x, y) |=
      direction::u8(direction::Bit::South) |
      direction::u8(direction::Bit::SouthWest) |
      direction::u8(direction::Bit::SouthEast);
  }
  // Left edge
  for (uint32_t y = 0; y < blockingGrid.height(); ++y) {
    blockingGrid.at(0, y) |=
      direction::u8(direction::Bit::West) |
      direction::u8(direction::Bit::NorthWest) |
      direction::u8(direction::Bit::SouthWest);
  }
  // Right edge
  for (uint32_t y = 0; y < blockingGrid.height(); ++y) {
    uint32_t x = blockingGrid.width() - 1;
    blockingGrid.at(x, y) |=
      direction::u8(direction::Bit::East) |
      direction::u8(direction::Bit::NorthEast) |
      direction::u8(direction::Bit::SouthEast);
  }

  // Nothing to do.
  if (blockingUpHeight < 1 && blockingDownHeight < 1) {
    return blockingGrid;
  }

  for (const auto& [coord, shape] : edges) {
    for (direction::Bit cardinal :
            edge::blockingCardinals[edge::u8(shape)]) {
      Coord cardinalNeighbour = neighbour::get(coord, cardinal);
      uint32_t edgeHeight = terraceGrid.at(coord);
      assert(terraceGrid.height() > cardinalNeighbour.y);
      assert(terraceGrid.width() > cardinalNeighbour.x);
      uint32_t neighbourHeight = terraceGrid.at(cardinalNeighbour);
      int32_t heightDiff = edgeHeight - neighbourHeight;

      const std::array otherDirections = {
        direction::rotateRight(cardinal, 1),
        direction::rotateLeft(cardinal, 1),
      };
      const std::array allDirections = {
        direction::rotateRight(cardinal, 1),
        cardinal,
        direction::rotateLeft(cardinal, 1),
      };

      if (heightDiff >= blockingUpHeight) {
        // Block the cardinal neighbour by all directions.
        for (direction::Bit d : allDirections) {
          const direction::Bit fromDirection = direction::getOpposite(d);
          // block the cardinal neighbour
          blockingGrid.at(cardinalNeighbour) |= direction::u8(fromDirection);

          // block the neighbours of the cardinal neighbour, including this
          // edge.
          const Coord neighbour =
              neighbour::get(cardinalNeighbour, fromDirection);
          if (blockingGrid.inrange(neighbour)) {
            blockingGrid.at(neighbour) |= direction::u8(d);
          }
        }
        // Block the other, diagonal, neighbours too.
        for (direction::Bit otherDirection : otherDirections) {
          const direction::Bit fromDirection =
              direction::getOpposite(otherDirection);
          const Coord neighbour = neighbour::get(coord, otherDirection);
          if (blockingGrid.inrange(neighbour)) {
            blockingGrid.at(neighbour) |= direction::u8(fromDirection);
          }
        }
      }
    }
  }

  // Some edges will be ramps, so undo some of the blocking.
  for (const auto& [coord, shape] : ramps) {
    const auto direction = ramp::toDirection(shape);
    const direction::Bit oppositeDirection = direction::getOpposite(direction);

    // The edge unblocks itself in one direction.
    blockingGrid.at(coord) &= ~direction::u8(oppositeDirection);

    // Two of its cardinal neighbours are then also unblocked.
    Coord neighbour = neighbour::get(coord, direction);
    blockingGrid.at(neighbour) &= ~direction::u8(oppositeDirection);
    neighbour = neighbour::get(coord, oppositeDirection);
    blockingGrid.at(neighbour) &= ~direction::u8(direction);
  }

  return blockingGrid;
}
