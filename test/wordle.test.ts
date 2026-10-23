import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { matchGuess } from '../src/wordle';

// Recitation Part 1: follow along with your TA, filling in the todos below.
// Problem set Task 1: keep adding properties until `npm run mutants:wordle`
// kills every mutant. Read the spec in src/wordle/matchGuess.ts.
//
// Label every property with its pattern, on the line above its `it(`:
//   // Pattern: invariant. The result always has exactly five colors.
// (invariant, algebraic, metamorphic, differential, or conditional)

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

// Step 1: a generator for five-letter uppercase words.
const wordFrom = (letters: string) =>
  fc.array(fc.constantFrom(...letters), { minLength: 5, maxLength: 5}).map(cs => cs.join(''));
const word = wordFrom(ALPHABET);

// Pattern: invariant. The result always has exactly five colors.
it('returns exactly five colors', () => {
  fc.assert(
    fc.property(word, word, (secret, guess) => {
      expect(matchGuess(secret, guess)).toHaveLength(5);
    }),
  );
});

// Pattern: invariant. Every color is G, Y, or B.
it('only uses the colors G, Y, B', () => {
  fc.assert(
    fc.property(word, word, (secret, guess) => {
      for (const c of matchGuess(secret, guess)) expect(['G', 'Y', 'B']).toContain(c);
    }),
  );
});


// Pattern: conditional. If the guess is the secret, every color is green.
it('guessing the secret gives all greens', () => {
  fc.assert(
    fc.property(word, w => {
      expect(matchGuess(w, w)).toEqual(['G', 'G', 'G', 'G', 'G']);
    }),
  );
});

// Pattern: invariant. No letter is credited (G or Y) more times than the secret contains it
it('never credits a letter more times than the secret contains it', () => {
  fc.assert(
    fc.property(word, word, (secret, guess) => {
      const result = matchGuess(secret, guess);
      for (const letter of new Set(guess)) {
        const credited = [...guess].filter((c, i) => c === letter && result[i] !== 'B').length;
        const inSecret = [...secret].filter(c => c === letter).length;
        expect(credited).toBeLessThanOrEqual(inSecret);
      }
    }),
  );
});

const anagramPair = word.chain(secret =>
  fc.shuffledSubarray([...secret], { minLength: 5, maxLength: 5 }).map(cs => [secret, cs.join('')] as const),
);

// Pattern: conditional. If the guess is an anagram of the secret, no color is black.
it('an anagram of the secret has no blacks', () => {
  fc.assert(
    fc.property(anagramPair, ([secret, guess]) => {
      expect(matchGuess(secret, guess)).not.toContain('B');
    }),
  );
});

const shift = (w: string, k: number) => w.replace(/[A-Z]/g, c => ALPHABET[(ALPHABET.indexOf(c) + k) % 26]);

// Pattern: metamorphic. Shifting every letter of both words by the same amount does not change the result.
it('shifting both words through the alphabet does not change the result', () => {
  fc.assert(
    fc.property(word, word, fc.integer({ min: 1, max: 25 }), (secret, guess, k) => {
      expect(matchGuess(shift(secret, k), shift(guess, k))).toEqual(matchGuess(secret, guess));
    }),
  );
});
