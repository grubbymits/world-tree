#include <array>
#include <cstdint>
#include <sstream>
#include <unordered_map>
#include <vector>

namespace terraform {

namespace direction {
enum class Bit : uint8_t {
  North = 1 << 0,
  NorthEast = 1 << 1,
  East = 1 << 2,
  SouthEast = 1 << 3,
  South = 1 << 4,
  SouthWest = 1 << 5,
  West = 1 << 6,
  NorthWest = 1 << 7,
};

constexpr uint8_t cast(Bit bit) { return static_cast<uint8_t>(bit); }

bool isDiagonal(Bit direction) {
  constexpr uint8_t kDiagonal =
      cast(Bit::NorthEast) |
      cast(Bit::SouthEast) |
      cast(Bit::SouthWest) |
      cast(Bit::NorthWest);
  return (cast(direction) & kDiagonal) != 0;
}

Bit rotateLeft(Bit direction, uint8_t n) {
  return static_cast<Bit>(
      0xff & ((cast(direction) << n) | (cast(direction) >> (8 - n))));
}

Bit rotateRight(Bit direction, uint8_t n) {
  return static_cast<Bit>(
      0xff & ((cast(direction) >> n) | (cast(direction) << (8 - n))));
}

Bit getOpposite(Bit direction) {
  constexpr uint8_t n = 4;
  return rotateLeft(direction, n);
}

} // end direction

struct Coord {
  int16_t x;
  int16_t y;

  bool operator==(const Coord& other) const {
    return other.x == x && other.y == y;
  }
};

namespace edge {
// This order is dependent on the loop in findEdges!
enum class Shape : uint8_t {
  None, // 0
  North, // 1
  East, // 2
  NorthEastCorner, // 3
  South, // 4
  EastWestCorridor, // 5
  SouthEastCorner, // 6
  EastPeninsula, // 7
  West, // 8
  NorthWestCorner, // 9
  NorthSouthCorridor, // 10
  NorthPeninsula, // 11
  SouthWestCorner, // 12
  WestPeninsula, // 13
  SouthPeninsula, // 14
  Spire, // 15
  Max,
};

// Also dependent on the above enum ordering.
static std::vector<std::vector<direction::Bit>> blockingCardinals = {
  // None,
  {},
  // North,
  {direction::Bit::North},
  // East,
  {direction::Bit::East},
  // NorthEastCorner,
  {direction::Bit::North, direction::Bit::East},
  // South,
  {direction::Bit::South},
  // EastWestCorridor,
  {direction::Bit::North, direction::Bit::South},
  // SouthEastCorner,
  {direction::Bit::South, direction::Bit::East},
  // EastPeninsula,
  {direction::Bit::North, direction::Bit::South, direction::Bit::East},
  // West,
  {direction::Bit::West},
  // NorthWestCorner,
  {direction::Bit::North, direction::Bit::West},
  // NorthSouthCorridor,
  {direction::Bit::East, direction::Bit::West},
  // NorthPeninsula,
  {direction::Bit::North, direction::Bit::East, direction::Bit::West},
  // SouthWestCorner,
  {direction::Bit::South, direction::Bit::West},
  // WestPeninsula,
  {direction::Bit::North, direction::Bit::South, direction::Bit::West},
  // SouthPeninsula,
  {direction::Bit::South, direction::Bit::East, direction::Bit::West},
  // Spire,
  {direction::Bit::North, direction::Bit::South, direction::Bit::East, direction::Bit::West},
};

Shape addCardinalEdge(Shape shape, Shape cardinal) {
  return static_cast<Shape>(
      static_cast<uint8_t>(shape) | static_cast<uint8_t>(cardinal));
}

} // end edge

namespace ramp {

enum class Shape : uint8_t {
  North,
  East,
  South,
  West,
  Max,
};

} // end ramp

namespace neighbour {

enum class Cardinal : uint8_t {
 North,
 East,
 South,
 West,
};

static constexpr auto offsets = std::to_array<Coord>({
  {0, -1}, // N
  {1, 0}, // E
  {0, 1}, // S
  {-1, 0}, // W
});

Coord offset(Cardinal direction) {
  return offsets[static_cast<uint8_t>(direction)];
}

Coord get(Coord coord, Cardinal direction) {
  Coord offset = offsets[static_cast<uint8_t>(direction)];
  return Coord(coord.x + offset.x, coord.y + offset.y);
}

Coord get(Coord coord, uint8_t direction) {
  Coord offset = offsets[direction];
  return Coord(coord.x + offset.x, coord.y + offset.y);
}

} // end neighbour

using TerraceGrid = std::vector<std::vector<uint8_t>>;

using EdgeContainer = std::unordered_map<Coord, edge::Shape>;
std::unique_ptr<EdgeContainer> findEdges(const TerraceGrid &terraceGrid);

using RampContainer = std::unordered_map<Coord, ramp::Shape>;
std::unique_ptr<RampContainer> findRamps(const TerraceGrid &terraceGrid,
                                         EdgeContainer &edges,
                                         uint32_t extraDistance = 0);

} // end terraform

template<> struct std::hash<terraform::Coord> {
  std::size_t operator()(const terraform::Coord& c) const noexcept {
    basic_stringstream<char> ss;
    ss << c.x << "," << c.y;
    return std::hash<std::string>{}(ss.str());
  }
};

