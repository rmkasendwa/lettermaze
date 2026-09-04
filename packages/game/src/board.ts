import { pickWeightedLetter, type Letter, type LetterWeights } from "./letters";
import { createSeededRandom, randomIndex, type RandomSource } from "./random";

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
  /** The complete, unique set of words players must find. */
  readonly targetWords: readonly string[];
  /** A legal, non-repeating path for each corresponding target word. */
  readonly targetPaths: readonly (readonly Coordinate[])[];
}

export interface GenerateBoardOptions {
  size: number;
  seed?: string | number;
  words?: readonly string[];
  weights?: LetterWeights;
  random?: RandomSource;
  targetWordCount?: number;
}

export interface LetterBoard {
  readonly size: number;
  /** Uppercase letters in row-major order. */
  readonly cells: readonly Letter[];
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

/**
 * Finds one path spelling `word`, using horizontal, vertical, or diagonal
 * neighbours. A cell can occur at most once in the returned path.
 */
export function findWordPath(
  board: LetterBoard,
  word: string,
): Coordinate[] | null {
  const { cells, size } = board;
  if (!Number.isInteger(size) || size < 1 || cells.length !== size * size) {
    throw new RangeError("Board cells must form a non-empty square board.");
  }

  const normalizedWord = word.toUpperCase();
  if (
    !/^[A-Z]+$/.test(normalizedWord) ||
    normalizedWord.length > cells.length
  ) {
    return null;
  }

  // Starting at the rarer endpoint substantially reduces failed branches. The
  // completed path is reversed again so callers always receive word order.
  let searchWord = normalizedWord;
  let reversed = false;
  let firstCount = 0;
  let lastCount = 0;
  const lastLetter = normalizedWord[normalizedWord.length - 1];
  for (const cell of cells) {
    if (cell === normalizedWord[0]) firstCount += 1;
    if (cell === lastLetter) lastCount += 1;
  }
  if (lastCount < firstCount) {
    searchWord = [...normalizedWord].reverse().join("");
    reversed = true;
  }

  const visited = new Uint8Array(cells.length);
  const path = new Array<number>(searchWord.length);

  const visit = (cellIndex: number, wordIndex: number): boolean => {
    if (cells[cellIndex] !== searchWord[wordIndex] || visited[cellIndex]) {
      return false;
    }

    path[wordIndex] = cellIndex;
    if (wordIndex === searchWord.length - 1) return true;

    visited[cellIndex] = 1;
    const row = Math.floor(cellIndex / size);
    const column = cellIndex % size;
    const minRow = Math.max(0, row - 1);
    const maxRow = Math.min(size - 1, row + 1);
    const minColumn = Math.max(0, column - 1);
    const maxColumn = Math.min(size - 1, column + 1);

    for (let nextRow = minRow; nextRow <= maxRow; nextRow += 1) {
      for (
        let nextColumn = minColumn;
        nextColumn <= maxColumn;
        nextColumn += 1
      ) {
        const nextIndex = nextRow * size + nextColumn;
        if (nextIndex !== cellIndex && visit(nextIndex, wordIndex + 1)) {
          visited[cellIndex] = 0;
          return true;
        }
      }
    }

    visited[cellIndex] = 0;
    return false;
  };

  for (let index = 0; index < cells.length; index += 1) {
    if (visit(index, 0)) {
      const indexes = reversed ? path.slice().reverse() : path;
      return indexes.map((cellIndex) => ({
        row: Math.floor(cellIndex / size),
        column: cellIndex % size,
      }));
    }
  }

  return null;
}

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
  return [
    ...new Set(
      words
        .map((word) => word.trim().toUpperCase())
        .filter((word) => /^[A-Z]+$/.test(word) && word.length <= capacity),
    ),
  ];
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

  const fullPath = createSnakePath(size, random);
  const requestedCount = options.targetWordCount ?? Math.max(3, size);
  if (!Number.isInteger(requestedCount) || requestedCount < 1) {
    throw new RangeError("Target word count must be a positive integer.");
  }
  const candidates = [...words];
  for (let index = candidates.length - 1; index > 0; index -= 1) {
    const swapIndex = randomIndex(index + 1, random);
    [candidates[index], candidates[swapIndex]] = [
      candidates[swapIndex]!,
      candidates[index]!,
    ];
  }
  const targetWords: string[] = [];
  const targetOffsets: number[] = [];
  let usedCells = 0;
  while (targetWords.length < requestedCount && candidates.length > 0) {
    const previousWord = targetWords.at(-1);
    const overlapIndex = previousWord
      ? candidates.findIndex(
          (word) =>
            previousWord.at(-1) === word[0] &&
            usedCells + word.length - 1 <= fullPath.length,
        )
      : -1;
    const candidateIndex =
      overlapIndex >= 0
        ? overlapIndex
        : candidates.findIndex(
            (word) => usedCells + word.length <= fullPath.length,
          );
    if (candidateIndex < 0) break;

    const [word] = candidates.splice(candidateIndex, 1);
    const overlapsPrevious =
      previousWord !== undefined && previousWord.at(-1) === word![0];
    const pathOffset = usedCells - (overlapsPrevious ? 1 : 0);
    targetWords.push(word!);
    targetOffsets.push(pathOffset);
    usedCells = pathOffset + word!.length;
  }
  if (targetWords.length === 0) {
    throw new RangeError("At least one target word must fit on the board.");
  }
  const targetPaths: Coordinate[][] = [];
  for (const [wordIndex, word] of targetWords.entries()) {
    const pathOffset = targetOffsets[wordIndex]!;
    targetPaths.push(fullPath.slice(pathOffset, pathOffset + word.length));
  }
  const guaranteedWord = targetWords[0]!;
  const guaranteedPath = targetPaths[0]!;
  const cells = Array.from({ length: size * size }, () =>
    pickWeightedLetter(random, weights),
  );

  targetPaths.forEach((path, wordIndex) =>
    path.forEach(({ row, column }, letterIndex) => {
      cells[row * size + column] = targetWords[wordIndex]![
        letterIndex
      ] as Letter;
    }),
  );

  return {
    size,
    cells,
    guaranteedWord,
    guaranteedPath,
    targetWords,
    targetPaths,
  };
}
