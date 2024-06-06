/**
 * Given a number `initialCount` and a number `delta`
 * adjust `delta` to get a rounded total.
 * see unit tests for examples
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
