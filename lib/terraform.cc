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
        if (terraceGrid[neighbour.y][neighbour.x] < centreTerrace) {
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
      edges->emplace(Coord(centre.x, centre.y), shape);
    }
  }
  return std::make_unique<EdgeContainer>(*edges);
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
    const Coord offset = neighbour::offset(direction);
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
    const Coord offset = neighbour::offset(direction);
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
          ramps->emplace(Coord(x, y), ramp::Shape::South);
        }
        break;
      case edge::Shape::South:
      case edge::Shape::SouthPeninsula:
        if (
          areNeighbourTerracesLower(x, y, Cardinal::South) &&
          areNeighbourTerracesEqual(x, y, Cardinal::North)
        ) {
          ramps->emplace(Coord(x, y), ramp::Shape::North);
        }
        break;
      case edge::Shape::East:
      case edge::Shape::EastPeninsula:
        if (
          areNeighbourTerracesLower(x, y, Cardinal::East) &&
          areNeighbourTerracesEqual(x, y, Cardinal::West)
        ) {
          ramps->emplace(Coord(x, y), ramp::Shape::West);
        }
        break;
      case edge::Shape::West:
      case edge::Shape::WestPeninsula:
        if (
          areNeighbourTerracesLower(x, y, Cardinal::West) &&
          areNeighbourTerracesEqual(x, y, Cardinal::East)
        ) {
          ramps->emplace(Coord(x, y), ramp::Shape::East);
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
  return std::make_unique<RampContainer>(*ramps);
}

std::unique<BlockingGrid> buildBlockingGrid(
  TerraceGrid terraceGrid,
  const EdgeContainer& edges,
  const RampContainer& ramps,
  bool blockingRamps = false,
  uint32_t blockingUpHeight = 1,
  uint32_t blockingDownHeight = 1) {
  // Initialise new grid
  const blockingGrid = new Array<Uint8Array>();
  for (let i = 0; i < terraceGrid.length; ++i) {
    blockingGrid.push(new Uint8Array(terraceGrid[i].length));
  }

  // Top edge
  for (let x = 0; x < blockingGrid[0].length; ++x) {
    blockingGrid[0][x] |=
      DirectionBit.North | DirectionBit.NorthWest | DirectionBit.NorthEast;
  }
  // Bottom edge
  for (let x = 0; x < blockingGrid[blockingGrid.length - 1].length; ++x) {
    const y = blockingGrid.length - 1;
    blockingGrid[y][x] |=
      DirectionBit.South | DirectionBit.SouthWest | DirectionBit.SouthEast;
  }
  // Left edge
  for (let y = 0; y < blockingGrid.length; ++y) {
    blockingGrid[y][0] |=
      DirectionBit.West | DirectionBit.NorthWest | DirectionBit.SouthWest;
  }
  // Right edge
  for (let y = 0; y < blockingGrid.length; ++y) {
    const x = blockingGrid[y].length - 1;
    blockingGrid[y][x] |=
      DirectionBit.East | DirectionBit.NorthEast | DirectionBit.SouthEast;
  }

  // Nothing to do.
  if (blockingUpHeight < 1 && blockingDownHeight < 1) {
    return blockingGrid;
  }

  for (let edge of edges) {
    for (let cardinalDirection of blockingCardinals[edge.shape]) {
      const cardinalNeighbour: Coord = getNeighbourCoord(
        edge.x,
        edge.y,
        cardinalDirection
      );
      const edgeHeight = terraceGrid[edge.y][edge.x];
      console.assert(terraceGrid.length > cardinalNeighbour.y);
      console.assert(
        terraceGrid[cardinalNeighbour.y].length > cardinalNeighbour.x
      );
      const neighbourHeight =
        terraceGrid[cardinalNeighbour.y][cardinalNeighbour.x];
      const heightDiff = edgeHeight - neighbourHeight;

      const otherDirections = [
        rotateRight(cardinalDirection, 1),
        rotateLeft(cardinalDirection, 1),
      ];
      const allDirections = [
        rotateRight(cardinalDirection, 1),
        cardinalDirection,
        rotateLeft(cardinalDirection, 1),
      ];

      if (heightDiff >= blockingUpHeight) {
        // Block the cardinal neighbour by all directions.
        for (let d of allDirections) {
          const fromDirectionBit = getOpposite(d);
          // block the cardinal neighbour
          blockingGrid[cardinalNeighbour.y][cardinalNeighbour.x] |=
            fromDirectionBit;

          // block the neighbours of the cardinal neighbour, including this edge.
          const neighbour = getNeighbourCoord(
            cardinalNeighbour.x,
            cardinalNeighbour.y,
            fromDirectionBit
          );
          if (inrange(neighbour, blockingGrid)) {
            blockingGrid[neighbour.y][neighbour.x] |= d;
          }
        }
        // Block the other, diagonal, neighbours too.
        for (let d of otherDirections) {
          const fromDirectionBit = getOpposite(d);
          const neighbour: Coord = getNeighbourCoord(edge.x, edge.y, d);
          if (inrange(neighbour, terraceGrid)) {
            blockingGrid[neighbour.y][neighbour.x] |= fromDirectionBit;
          }
        }
      }
    }
  }

  // Some edges will be ramps, so undo some of the blocking.
  const rampDirections = new Map<RampShape, DirectionBit>([
    [RampShape.North, DirectionBit.North],
    [RampShape.East, DirectionBit.East],
    [RampShape.South, DirectionBit.South],
    [RampShape.West, DirectionBit.West],
  ]);

  for (let ramp of ramps) {
    const direction = rampDirections.get(ramp.shape)!;
    const oppositeDirection = getOpposite(direction);

    // The edge unblocks itself in one direction.
    blockingGrid[ramp.y][ramp.x] &= ~oppositeDirection;

    // Two of its cardinal neighbours are then also unblocked.
    let neighbour = getNeighbourCoord(ramp.x, ramp.y, direction);
    blockingGrid[neighbour.y][neighbour.x] &= ~oppositeDirection;
    neighbour = getNeighbourCoord(ramp.x, ramp.y, oppositeDirection);
    blockingGrid[neighbour.y][neighbour.x] &= ~direction;
  }

  return blockingGrid;
}
