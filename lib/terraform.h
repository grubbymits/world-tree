#include <array>
#include <cstdint>
#include <sstream>
#include <unordered_map>
#include <vector>

namespace terraform {

struct Coord {
  // signed to handle offsets.
  int16_t x;
  int16_t y;

  bool operator==(const Coord& other) const {
    return other.x == x && other.y == y;
  }
};

template<typename N>
class Grid {
 public:
  Grid(uint32_t width, uint32_t depth) : _width(width), _depth(depth),
    data(depth, std::vector<N>(width)) { }

  uint32_t width() const { return _width; }
  uint32_t depth() const { return _depth; }
  const std::vector<N>& row(uint32_t i) const { return data[i]; }
  std::vector<N>& row(uint32_t i) { return data[i]; }
  N at(uint32_t x, uint32_t y) const { return data[y][x]; }
  N& at(uint32_t x, uint32_t y) { return data[y][x]; }
  N at(const Coord& coord) const { return data[coord.y][coord.x]; }
  N& at(const Coord& coord) { return data[coord.y][coord.x]; }
  bool inrange(const Coord& coord) const {
    return coord.y >= 0 && coord.y < depth() &&
           coord.x >= 0 && coord.x < width();
  }
  Coord coord(uint32_t id) const {
    const uint32_t depth = depth();
    const uint32_t width = width();
    const uint32_t x = id % width;
    const uint32_t y = (id - x) / depth;
    return new Coord(x, y);
  };
  uint32_t id(Coord coord) const {
    const width = blockingGrid.depth();
    return width * coord.y + coord.x;
  };

 private:
  uint32_t _width = 0;
  uint32_t _depth = 0;
  std::vector<std::vector<N>> data;
};

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

constexpr std::array<Bit> all = {
  North,
  NorthEast,
  East,
  SouthEast,
  South,
  SouthWest,
  West,
  NorthWest,
};

constexpr uint8_t u8(Bit bit) { return static_cast<uint8_t>(bit); }

bool isDiagonal(Bit direction) {
  constexpr uint8_t kDiagonal =
      u8(Bit::NorthEast) |
      u8(Bit::SouthEast) |
      u8(Bit::SouthWest) |
      u8(Bit::NorthWest);
  return (u8(direction) & kDiagonal) != 0;
}

Bit rotateLeft(Bit direction, uint8_t n) {
  return static_cast<Bit>(
      0xff & ((u8(direction) << n) | (u8(direction) >> (8 - n))));
}

Bit rotateRight(Bit direction, uint8_t n) {
  return static_cast<Bit>(
      0xff & ((u8(direction) >> n) | (u8(direction) << (8 - n))));
}

Bit getOpposite(Bit direction) {
  constexpr uint8_t n = 4;
  return rotateLeft(direction, n);
}

} // end direction

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

constexpr uint8_t u8(Shape shape) {
  return static_cast<uint8_t>(shape);
}

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
  {direction::Bit::North, direction::Bit::South, direction::Bit::East,
    direction::Bit::West},
};

Shape addCardinalEdge(Shape shape, Shape cardinal) {
  return static_cast<Shape>(u8(shape) | u8(cardinal));
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

constexpr uint8_t u8(Shape shape) { return static_cast<uint8_t>(shape); }

direction::Bit toDirection(Shape shape) {
  static constexpr std::array directions = {
    direction::Bit::North,
    direction::Bit::East,
    direction::Bit::South,
    direction::Bit::West,
  };
  return directions[u8(shape)];
}

} // end ramp

namespace neighbour {

using Cardinal = ramp::Shape;

constexpr uint8_t u8(Cardinal cardinal) {
  return static_cast<uint8_t>(cardinal);
}

static constexpr auto offsets = std::to_array<Coord>({
  {0, -1}, // N
  {1, 0}, // E
  {0, 1}, // S
  {-1, 0}, // W
});

Coord offset(Cardinal direction) {
  return offsets[neighbour::u8(direction)];
}

Coord get(Coord coord, Cardinal direction) {
  Coord offset = offsets[neighbour::u8(direction)];
  return Coord(coord.x + offset.x, coord.y + offset.y);
}

Coord get(Coord coord, uint8_t direction) {
  Coord offset = offsets[direction];
  return Coord(coord.x + offset.x, coord.y + offset.y);
}

Coord get(Coord coord, direction::Bit direction) {
  static constexpr std::array cardinals = {
    neighbour::u8(Cardinal::North),
    neighbour::u8(Cardinal::North),
    neighbour::u8(Cardinal::East),
    neighbour::u8(Cardinal::East),
    neighbour::u8(Cardinal::South),
    neighbour::u8(Cardinal::South),
    neighbour::u8(Cardinal::West),
    neighbour::u8(Cardinal::West),
  };
  return get(coord, cardinals[direction::u8(direction)]);
}

} // end neighbour

using HeightGrid = Grid<float>;
using TerraceGrid = Grid<uint8_t>;
using BlockingGrid = Grid<uint8_t>;
using EdgeContainer = std::unordered_map<Coord, edge::Shape>;
using RampContainer = std::unordered_map<Coord, ramp::Shape>;

float normaliseHeightGrid(HeightGrid& depthGrid, uint8_t numTerraces);

TerraceGrid buildTerraceGrid(const HeightGrid& depthGrid,
                             uint32_t terraceSpacing);

EdgeContainer findEdges(const TerraceGrid &terraceGrid);

RampContainer findRamps(const TerraceGrid &terraceGrid,
                        EdgeContainer &edges,
                        uint32_t extraDistance = 0);

BlockingGrid buildBlockingGrid(
  TerraceGrid terraceGrid,
  const EdgeContainer& edges,
  const RampContainer& ramps,
  bool blockingRamps = false,
  uint32_t blockingUpHeight = 1,
  uint32_t blockingDownHeight = 1);

std::optional<std::vector<Coord>>
findPath(Coord start, Coord end, BlockingGrid& blockingGrid);

} // end terraform

template<> struct std::hash<terraform::Coord> {
  std::size_t operator()(const terraform::Coord& c) const noexcept {
    basic_stringstream<char> ss;
    ss << c.x << "," << c.y;
    return std::hash<std::string>{}(ss.str());
  }
};

