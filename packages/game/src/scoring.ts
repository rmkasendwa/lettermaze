export interface ScoringRules {
  /** Highest matching minimum length determines the score. */
  readonly tiers: readonly {
    readonly minLength: number;
    readonly points: number;
  }[];
  readonly multiplier: number;
}

export const STANDARD_SCORING: ScoringRules = {
  // One point per letter keeps every target's value immediately predictable.
  tiers: Array.from({ length: 26 }, (_, index) => ({
    minLength: index + 1,
    points: index + 1,
  })),
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
