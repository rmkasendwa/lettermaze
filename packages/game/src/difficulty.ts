import {
  ENGLISH_LETTER_FREQUENCIES,
  type Letter,
  type LetterWeights,
} from "./letters";

export const DIFFICULTY_LEVELS = ["easy", "medium", "hard"] as const;

export type Difficulty = (typeof DIFFICULTY_LEVELS)[number];

export interface DifficultyConfig {
  readonly label: string;
  readonly description: string;
  readonly boardSize: number;
  readonly durationSeconds: number;
  readonly letterWeights: LetterWeights;
}

function adjustWeights(
  adjustments: Partial<Record<Letter, number>>,
): LetterWeights {
  return Object.fromEntries(
    Object.entries(ENGLISH_LETTER_FREQUENCIES).map(([letter, weight]) => [
      letter,
      weight * (adjustments[letter as Letter] ?? 1),
    ]),
  ) as unknown as LetterWeights;
}

const EASY_LETTER_WEIGHTS = adjustWeights({
  A: 1.35,
  E: 1.35,
  I: 1.35,
  O: 1.35,
  U: 1.35,
  J: 0.25,
  Q: 0.25,
  X: 0.25,
  Z: 0.25,
});

const HARD_LETTER_WEIGHTS = adjustWeights({
  A: 0.8,
  E: 0.8,
  I: 0.8,
  O: 0.8,
  U: 0.8,
  J: 4,
  Q: 4,
  X: 4,
  Z: 4,
});

export const DIFFICULTY_CONFIGS: Readonly<
  Record<Difficulty, DifficultyConfig>
> = {
  easy: {
    label: "Easy",
    description: "A compact board, extra time, and more common letters.",
    boardSize: 4,
    durationSeconds: 240,
    letterWeights: EASY_LETTER_WEIGHTS,
  },
  medium: {
    label: "Medium",
    description: "A balanced board, timer, and English letter mix.",
    boardSize: 5,
    durationSeconds: 180,
    letterWeights: ENGLISH_LETTER_FREQUENCIES,
  },
  hard: {
    label: "Hard",
    description: "A larger board, less time, and more uncommon letters.",
    boardSize: 6,
    durationSeconds: 120,
    letterWeights: HARD_LETTER_WEIGHTS,
  },
};

export function isDifficulty(value: unknown): value is Difficulty {
  return (
    typeof value === "string" &&
    (DIFFICULTY_LEVELS as readonly string[]).includes(value)
  );
}
