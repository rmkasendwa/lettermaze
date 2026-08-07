import {
  pickWeightedLetter,
  type Letter,
  type LetterWeights,
} from "./letters.js";
import {
  createSeededRandom,
  randomIndex,
  type RandomSource,
} from "./random.js";

export interface Coordinate {
  readonly row: number;
  readonly column: number;
}

export interface GeneratedBoard {
  readonly size: number;
  /** Uppercase letters in row-major order. */
  readonly cells: readonly Letter[];
  /** A guaranteed playable word and its adjacent, non-repeating path. */
  readonly guaranteedWord: string;
  readonly guaranteedPath: readonly Coordinate[];
}

export interface GenerateBoardOptions {
  size: number;
  seed?: string | number;
  words?: readonly string[];
  weights?: LetterWeights;
  random?: RandomSource;
}

export const DEFAULT_PLAYABLE_WORDS = [
  "A",
  "I",
  "CAT",
  "DOG",
  "TREE",
  "READ",
  "STONE",
  "HOUSE",
  "PLANT",
  "WATER",
  "GARDEN",
  "LETTER",
  "PLANET",
] as const;

function createSnakePath(size: number, random: RandomSource): Coordinate[] {
  const path: Coordinate[] = [];
  const transpose = random() < 0.5;
  const reverseRows = random() < 0.5;
  const reverseColumns = random() < 0.5;

  for (let outer = 0; outer < size; outer += 1) {
    const row = reverseRows ? size - outer - 1 : outer;
    for (let inner = 0; inner < size; inner += 1) {
      const forward = outer % 2 === 0;
      const offset = forward ? inner : size - inner - 1;
      const column = reverseColumns ? size - offset - 1 : offset;
      path.push(transpose ? { row: column, column: row } : { row, column });
    }
  }

  return path;
}

function normalizeWords(words: readonly string[], capacity: number): string[] {
  return words
    .map((word) => word.trim().toUpperCase())
    .filter((word) => /^[A-Z]+$/.test(word) && word.length <= capacity);
}

export function generateBoard(options: GenerateBoardOptions): GeneratedBoard {
  const { size, weights } = options;
  if (!Number.isInteger(size) || size < 1) {
    throw new RangeError("Board size must be a positive integer.");
  }
  if (options.seed !== undefined && options.random !== undefined) {
    throw new TypeError("Provide either a seed or a random source, not both.");
  }

  const random =
    options.random ??
    (options.seed === undefined
      ? Math.random
      : createSeededRandom(options.seed));
  const words = normalizeWords(
    options.words ?? DEFAULT_PLAYABLE_WORDS,
    size * size,
  );
  if (words.length === 0) {
    throw new RangeError("At least one playable word must fit on the board.");
  }

  const guaranteedWord = words[randomIndex(words.length, random)]!;
  const fullPath = createSnakePath(size, random);
  const maxStart = fullPath.length - guaranteedWord.length;
  const start = maxStart === 0 ? 0 : randomIndex(maxStart + 1, random);
  const guaranteedPath = fullPath.slice(start, start + guaranteedWord.length);
  const cells = Array.from({ length: size * size }, () =>
    pickWeightedLetter(random, weights),
  );

  guaranteedPath.forEach(({ row, column }, index) => {
    cells[row * size + column] = guaranteedWord[index] as Letter;
  });

  return { size, cells, guaranteedWord, guaranteedPath };
}
