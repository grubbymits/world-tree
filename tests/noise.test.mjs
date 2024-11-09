import * as WT from "../dist/world-tree.mjs";

test('gradient lattice', () => {
  const x = 2;
  const y = 2;
  const scale = 3;
  const gradLattice = new WT.GradientLattice(x, y, scale);
  const gradients = gradLattice.gradients;
  const lattice = gradLattice.lattice;
  const noise = gradLattice.noise;

  expect(gradients.length).toBe(2);
  expect(gradients[0].length).toBe(x * 2);
  for (let i = 0; i < y; ++i) {
    for (let j = 0; j < x * 2; ++j) {
      const value = gradients[i][j];
      expect(value).toBeGreaterThanOrEqual(-1);
      expect(value).toBeLessThanOrEqual(1);
    }
  }

  expect(lattice.length).toBe(y * scale);
  expect(lattice[0].length).toBe(x * scale);
  for (let i = 0; i < lattice.length; ++i) {
    for (let j = 0; j < lattice[i].length; ++j) {
      const value = lattice[i][j];
      expect(value).toBeGreaterThanOrEqual(-4/3);
      expect(value).toBeLessThanOrEqual(4/3);
    }
  }

  expect(noise.length).toBe(y * scale);
  expect(noise[0].length).toBe(x * scale);
});
