import type { RandomSource } from "./random.js";

/** Relative frequencies in a representative sample of English text. */
export const ENGLISH_LETTER_FREQUENCIES = {
  A: 8.2,
  B: 1.5,
  C: 2.8,
  D: 4.3,
  E: 12.7,
  F: 2.2,
  G: 2,
  H: 6.1,
  I: 7,
  J: 0.15,
  K: 0.77,
  L: 4,
  M: 2.4,
  N: 6.7,
  O: 7.5,
  P: 1.9,
  Q: 0.095,
  R: 6,
  S: 6.3,
  T: 9.1,
  U: 2.8,
  V: 0.98,
  W: 2.4,
  X: 0.15,
  Y: 2,
  Z: 0.074,
} as const;

export type Letter = keyof typeof ENGLISH_LETTER_FREQUENCIES;
export type LetterWeights = Readonly<Record<Letter, number>>;

export function pickWeightedLetter(
  random: RandomSource,
  weights: LetterWeights = ENGLISH_LETTER_FREQUENCIES,
): Letter {
  const entries = Object.entries(weights) as [Letter, number][];
  const total = entries.reduce((sum, [, weight]) => {
    if (!Number.isFinite(weight) || weight < 0) {
      throw new RangeError(
        "Letter weights must be finite, non-negative numbers.",
      );
    }
    return sum + weight;
  }, 0);

  if (total <= 0) {
    throw new RangeError(
      "At least one letter weight must be greater than zero.",
    );
  }

  let choice = random() * total;
  for (const [letter, weight] of entries) {
    choice -= weight;
    if (choice < 0) return letter;
  }

  return entries[entries.length - 1]![0];
}
