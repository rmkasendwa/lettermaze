export interface ScoringRules {
  /** Highest matching minimum length determines the score. */
  readonly tiers: readonly {
    readonly minLength: number;
    readonly points: number;
  }[];
  readonly multiplier: number;
}

export const STANDARD_SCORING: ScoringRules = {
  tiers: [
    { minLength: 3, points: 1 },
    { minLength: 5, points: 2 },
    { minLength: 6, points: 3 },
    { minLength: 7, points: 5 },
    { minLength: 8, points: 11 },
  ],
  multiplier: 1,
};

export function scoreWord(
  word: string,
  rules: ScoringRules = STANDARD_SCORING,
): number {
  const length = word.trim().length;
  const tier = rules.tiers.reduce<ScoringRules["tiers"][number] | undefined>(
    (best, candidate) =>
      candidate.minLength <= length &&
      (!best || candidate.minLength > best.minLength)
        ? candidate
        : best,
    undefined,
  );
  return (tier?.points ?? 0) * rules.multiplier;
}
