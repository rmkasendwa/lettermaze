import { DEFAULT_PLAYABLE_WORDS, generateBoard } from "./board";
import { DIFFICULTY_CONFIGS, type Difficulty } from "./difficulty";
import { ENGLISH_LETTER_FREQUENCIES, type LetterWeights } from "./letters";
import { STANDARD_SCORING, type ScoringRules } from "./scoring";

export type SeedConfiguration =
  | { readonly kind: "random" }
  | { readonly kind: "fixed"; readonly value: string | number };

/** Serializable rules shared by generation, gameplay, and saved sessions. */
export interface GameRules {
  readonly boardSize: number;
  readonly durationSeconds: number;
  readonly letterWeights: LetterWeights;
  readonly words: readonly string[];
  readonly targetWordCount: number;
  readonly scoring: ScoringRules;
  readonly endOnAllWordsFound: boolean;
}

export interface GameConfiguration extends GameRules {
  /** An identifier for presentation/analytics, never an engine switch. */
  readonly mode: string;
  readonly ranked: boolean;
  readonly seed: SeedConfiguration;
  /** Applied in order; later overrides win. New rules belong in GameRules. */
  readonly modifiers: readonly {
    readonly id: string;
    readonly rules: Partial<GameRules>;
  }[];
}

export function createNormalGameConfiguration(
  difficulty: Difficulty = "medium",
): GameConfiguration {
  const settings = DIFFICULTY_CONFIGS[difficulty];
  return {
    mode: "normal",
    ranked: false,
    boardSize: settings.boardSize,
    durationSeconds: settings.durationSeconds,
    letterWeights: settings.letterWeights,
    words: DEFAULT_PLAYABLE_WORDS.filter(
      (word) =>
        word.length >= settings.minWordLength &&
        word.length <= settings.maxWordLength,
    ),
    targetWordCount: settings.targetWordCount,
    scoring: STANDARD_SCORING,
    seed: { kind: "random" },
    endOnAllWordsFound: true,
    modifiers: [],
  };
}

export function createDailyGameConfiguration(
  puzzleId: string,
): GameConfiguration {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(puzzleId))
    throw new RangeError("Puzzle id must use YYYY-MM-DD format.");
  return {
    ...createNormalGameConfiguration(),
    mode: "daily",
    ranked: true,
    seed: { kind: "fixed", value: `lettermaze:daily:v1:${puzzleId}` },
  };
}

/** Practice can reuse any puzzle, including its seed and modifiers. */
export function createPracticeGameConfiguration(
  base = createNormalGameConfiguration(),
): GameConfiguration {
  return { ...base, mode: "practice", ranked: false };
}

export function resolveGameConfiguration(
  config: GameConfiguration,
): GameConfiguration {
  if (
    typeof config.mode !== "string" ||
    !config.mode ||
    typeof config.ranked !== "boolean" ||
    !Array.isArray(config.modifiers) ||
    config.modifiers.some(
      (modifier) =>
        typeof modifier.id !== "string" ||
        !modifier.rules ||
        typeof modifier.rules !== "object",
    ) ||
    !config.seed ||
    !["random", "fixed"].includes(config.seed.kind) ||
    (config.seed.kind === "fixed" &&
      typeof config.seed.value !== "string" &&
      !(
        typeof config.seed.value === "number" &&
        Number.isFinite(config.seed.value)
      ))
  ) {
    throw new TypeError("Invalid game configuration.");
  }
  const resolved = config.modifiers.reduce<GameConfiguration>(
    (current, modifier) => ({ ...current, ...modifier.rules }),
    config,
  );
  if (
    !Number.isInteger(resolved.boardSize) ||
    resolved.boardSize < 1 ||
    typeof resolved.endOnAllWordsFound !== "boolean" ||
    !Array.isArray(resolved.words) ||
    !resolved.words.length ||
    resolved.words.some(
      (word) => typeof word !== "string" || !/^[A-Z]+$/.test(word),
    ) ||
    !resolved.letterWeights ||
    Object.keys(resolved.letterWeights).length !==
      Object.keys(ENGLISH_LETTER_FREQUENCIES).length ||
    Object.keys(ENGLISH_LETTER_FREQUENCIES).some(
      (letter) => !(letter in resolved.letterWeights),
    ) ||
    Object.values(resolved.letterWeights).some(
      (weight) => !Number.isFinite(weight) || weight < 0,
    ) ||
    !Object.values(resolved.letterWeights).some((weight) => weight > 0) ||
    !Number.isInteger(resolved.durationSeconds) ||
    resolved.durationSeconds < 0 ||
    !Number.isInteger(resolved.targetWordCount) ||
    resolved.targetWordCount < 1 ||
    !Number.isFinite(resolved.scoring.multiplier) ||
    resolved.scoring.multiplier < 0 ||
    resolved.scoring.tiers.some(
      (tier) =>
        !Number.isInteger(tier.minLength) ||
        tier.minLength < 1 ||
        !Number.isFinite(tier.points) ||
        tier.points < 0,
    )
  ) {
    throw new RangeError("Invalid game rules.");
  }
  return { ...resolved, modifiers: [] };
}

export function isGameConfiguration(
  value: unknown,
): value is GameConfiguration {
  try {
    resolveGameConfiguration(value as GameConfiguration);
    return true;
  } catch {
    return false;
  }
}

export function generateConfiguredBoard(config: GameConfiguration) {
  const rules = resolveGameConfiguration(config);
  return generateBoard({
    size: rules.boardSize,
    weights: rules.letterWeights,
    words: rules.words,
    targetWordCount: rules.targetWordCount,
    seed: rules.seed.kind === "fixed" ? rules.seed.value : undefined,
  });
}
