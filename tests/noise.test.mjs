import * as WT from "../dist/world-tree.mjs";

function run_test(width, height, scale, factor) {
  const gradLattice = new WT.LatticeNoise(width, height, scale, factor);
  const gradients = gradLattice.gradients;
  const lattice = gradLattice.lattice;
  const noise = gradLattice.valueGradient;

  expect(noise.length).toBe(height);
  expect(noise[0].length).toBe(width);
  expect(lattice.length).toBe(height + 1);
  expect(lattice[0].length).toBe(width + 1);
  expect(gradients.length).toBe((lattice.length + scale - 1) / scale);
  expect(gradients[0].length).toBe(2 * (lattice[0].length + scale - 1) / scale);

  for (let y = 0; y < gradients.length; ++y) {
    for (let x = 0; x < gradients[y].length; ++x) {
      const value = gradients[y][x];
      expect(value).toBeGreaterThanOrEqual(-1);
      expect(value).toBeLessThanOrEqual(1);
    }
  }

  for (let y = 0; y < lattice.length; ++y) {
    for (let x = 0; x < lattice[y].length; ++x) {
      const value = lattice[y][x];

      if (x % scale == 0 && y % scale == 0) {
        expect(Math.abs(value)).toBe(0);
      } else {
        expect(value).toBeGreaterThanOrEqual(-4/3);
        expect(value).toBeLessThanOrEqual(4/3);
      }
    }
  }

  for (let y = 0; y < noise.length; ++y) {
    for (let x = 0; x < noise[y].length; ++x) {
      const value = noise[y][x];
      expect(value).toBeGreaterThanOrEqual(-factor);
      expect(value).toBeLessThanOrEqual(factor);
    }
  }
}

test('2x2x2x1', () => {
  const width = 2;
  const height = 2;
  const scale = 2;
  const factor = 1;
  run_test(width, height, scale, factor);
});

test('3x3x3x2', () => {
  const width = 6;
  const height = 6;
  const scale = 3;
  const factor = 2;
  run_test(width, height, scale, factor);
});

test('6x4x5', () => {
  const width = 6;
  const height = 4;
  const scale = 2;
  const factor = 5;
  run_test(width, height, scale, factor);
});
