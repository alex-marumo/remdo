import { it, expect } from "vitest";

/**
 * Given a number `initialCount` and a number `delta`
 * adjust `delta` to get a rounded total.
 */
export function adjustDeltaToGetRoundedTotal(
  initialCount: number,
  delta: number
) {
  function countTrailingZeroes(n: number) {
    for (let count = 0; ; n = Math.floor(n / 10), count++) {
      if (n % 10 !== 0 || n === 0) {
        return count;
      }
    }
  }

  if (delta <= 0) {
    throw new Error("delta must be positive");
  }

  const trailingZeroes = countTrailingZeroes(delta);
  const initialTotal = initialCount + delta;
  const magnitudeFactor = Math.pow(10, trailingZeroes);
  const roundedTotal =
    Math.round(initialTotal / magnitudeFactor) * magnitudeFactor;

  return roundedTotal - initialCount;
}

it("base cases", () => {
  expect(adjustDeltaToGetRoundedTotal(100, 10)).toBe(10);
  expect(adjustDeltaToGetRoundedTotal(101, 10)).toBe(9);
  expect(adjustDeltaToGetRoundedTotal(104, 10)).toBe(6);
  expect(adjustDeltaToGetRoundedTotal(105, 10)).toBe(15);
  expect(adjustDeltaToGetRoundedTotal(109, 10)).toBe(11);
});

it("small initial count", () => {
  expect(adjustDeltaToGetRoundedTotal(0, 10)).toBe(10);
  expect(adjustDeltaToGetRoundedTotal(0, 100)).toBe(100);
  expect(adjustDeltaToGetRoundedTotal(1, 10)).toBe(9);
  expect(adjustDeltaToGetRoundedTotal(1, 100)).toBe(99);
});

it("various magnitudes", () => {
  expect(adjustDeltaToGetRoundedTotal(10000, 10)).toBe(10);
  expect(adjustDeltaToGetRoundedTotal(10, 1000)).toBe(990);
  expect(adjustDeltaToGetRoundedTotal(999, 1000)).toBe(1001);
  expect(adjustDeltaToGetRoundedTotal(1001, 1000)).toBe(999);
});

it("corner cases", () => {
  expect(() => adjustDeltaToGetRoundedTotal(0, 0)).toThrow();
  expect(() => adjustDeltaToGetRoundedTotal(10, 0)).toThrow();
  expect(adjustDeltaToGetRoundedTotal(0, 9)).toBe(9);
  expect(adjustDeltaToGetRoundedTotal(-100, 9)).toBe(9);
  expect(() => adjustDeltaToGetRoundedTotal(100, -9)).toThrow();
});
