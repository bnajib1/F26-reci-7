import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { mergeIntervals, type Interval } from '../src/intervals';

// Recitation Part 2 (groups) and problem set Task 2.
// Read the spec in src/intervals/mergeIntervals.ts, then check your progress
// with `npm run mutants:intervals`.
//
// Label every property with its pattern, on the line above its `it(`:
//   // Pattern: invariant. The output is sorted.
// (invariant, algebraic, metamorphic, differential, or conditional)

// A first attempt at a generator. It has a problem: run the tests and read
// the counterexample.
const point = fc.integer({ min: -20, max: 20 });
const interval: fc.Arbitrary<Interval> = fc
  .tuple(point, point)
  .map(([a, b]): Interval => [Math.min(a, b), Math.max(a, b)]);
const intervalList = fc.array(interval);

const disjointList = fc.array(fc.tuple(fc.nat(10), fc.integer({ min: 1, max: 10 }))).map(parts => {
  let end = 0;
  return parts.map(([len, gap]): Interval => {
    const start = end + gap;
    end = start + len;
    return [start, end];
  });
});

const covers = (xs: readonly Interval[], p: number) => xs.some(([s, e]) => s <= p && p <= e);

describe('mergeIntervals', () => {
  // Pattern: invariant. Every input interval lies inside some output interval.
  it('every input interval lies inside some output interval', () => {
    fc.assert(
      fc.property(intervalList, xs => {
        const out = mergeIntervals(xs);
        const uncovered = xs.filter(([s, e]) => !out.some(([a, b]) => a <= s && e <= b));
        expect(uncovered).toEqual([]);
      }),
    );
  });

  // Pattern: invariant. Consecutive output intervals neither overlap nor touch.
  it('consecutive output intervals neither overlap nor touch', () => {
    fc.assert(
      fc.property(intervalList, xs => {
        const out = mergeIntervals(xs);
        for (let i = 0; i + 1 < out.length; i++) expect(out[i][1]).toBeLessThan(out[i + 1][0]);
      }),
    );
  });

  // Pattern: differential. Input and output cover the same points.
  it('input and output cover the same points', () => {
    fc.assert(
      fc.property(intervalList, xs => {
        const out = mergeIntervals(xs);
        for (const p of [...xs, ...out].flat().flatMap(x => [x - 0.5, x, x + 0.5])) {
          expect(covers(out, p)).toBe(covers(xs, p));
        }
      }),
    );
  });

  // Pattern: metamorphic. Reversing the input does not change the output.
  it('reversing the input does not change the output', () => {
    fc.assert(
      fc.property(intervalList, xs => {
        expect(mergeIntervals([...xs].reverse())).toEqual(mergeIntervals(xs));
      }),
    );
  });

  // Pattern: algebraic. Merging twice is the same as merging once.
  it('merging twice is the same as merging once', () => {
    fc.assert(
      fc.property(intervalList, xs => {
        const once = mergeIntervals(xs);
        expect(mergeIntervals(once)).toEqual(once);
      }),
    );
  });

  // Pattern: conditional. If no intervals overlap or touch, the output is the input.
  it('leaves sorted, disjoint, non-touching intervals unchanged', () => {
    fc.assert(
      fc.property(disjointList, xs => {
        expect(mergeIntervals(xs)).toEqual(xs);
      }),
    );
  });

  // Pattern: invariant. The input is not modified.
  it('does not modify the input', () => {
    fc.assert(
      fc.property(intervalList, xs => {
        const before = structuredClone(xs);
        mergeIntervals(xs);
        expect(xs).toEqual(before);
      }),
    );
  });
});
