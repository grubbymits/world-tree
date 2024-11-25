import * as WT from "../dist/world-tree.mjs";

function run_test(width, height, scale, factor) {
  const gradLattice = new WT.GradientNoise(width, height, scale, factor);
  const gradients = gradLattice.gradients;
  const lattice = gradLattice.lattice;
  const noise = gradLattice.valueGradientNoise(WT.bilinear);

  expect(noise.length).toBe(height);
  expect(noise[0].length).toBe(width);
  expect(lattice.height).toBe(height + 1);
  expect(lattice.width).toBe(width + 1);
  expect(gradients.height).toBe((lattice.height + scale - 1) / scale);
  expect(gradients.width).toBe(2 * (lattice.width + scale - 1) / scale);

  for (let y = 0; y < gradients.height; ++y) {
    for (let x = 0; x < gradients.width; ++x) {
      const value = gradients.getValue(x, y);
      expect(value).toBeGreaterThanOrEqual(-1);
      expect(value).toBeLessThanOrEqual(1);
    }
  }

  for (let y = 0; y < lattice.height; ++y) {
    for (let x = 0; x < lattice.width; ++x) {
      const value = lattice.getValue(x, y);

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
