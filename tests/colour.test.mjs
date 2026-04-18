import * as WT from "../dist/world-tree.mjs";

test("string to rgb", () => {
  const rgb = WT.RGB.fromString("rgb(255, 128, 1)");
  expect(rgb.r).toBe(255);
  expect(rgb.g).toBe(128);
  expect(rgb.b).toBe(1);
});

test("hex to rgb", () => {
  const rgb = WT.RGB.fromHex("#708090");
  expect(rgb.r).toBe(112);
  expect(rgb.g).toBe(128);
  expect(rgb.b).toBe(144);
});

test("hex to rgb", () => {
  const rgb = new WT.RGB(1, 2, 3).toString();
  expect(rgb).toBe("rgb(1,2,3)");
});

test("rgb to hsl", () => {
  const rgb = new WT.RGB(50, 75, 140);
  const hsl = rgb.toHSL();
  expect(hsl.h).toBe(223);
  expect(hsl.s).toBe(47.4);
  expect(hsl.l).toBe(37.3);
});

test("hsl to string", () => {
  const hsl = new WT.HSL(100, 32.9, 67.8);
  const hsl_string = hsl.toString();
  expect(hsl_string).toBe("hsl(100,32.9%,67.8%)");
  const hsl_again = WT.HSL.fromString(hsl_string);
  expect(hsl.h).toBe(hsl_again.h);
  expect(hsl.s).toBe(hsl_again.s);
  expect(hsl.l).toBe(hsl_again.l);
});

test("hsl to rgb", () => {
  const hsl = new WT.HSL(223, 47.4, 37.3);
  const rgb = hsl.toRGB();
  expect(rgb.r).toBe(50);
  expect(rgb.g).toBe(76);
  expect(rgb.b).toBe(140);
});
