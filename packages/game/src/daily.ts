import { type GeneratedBoard } from "./board";
import {
  createDailyGameConfiguration,
  createNormalGameConfiguration,
  generateConfiguredBoard,
} from "./configuration";

export const DAILY_BOARD_SIZE = createNormalGameConfiguration().boardSize;

/** Returns the canonical YYYY-MM-DD puzzle id for an instant in UTC. */
export function getUtcPuzzleId(date: Date = new Date()): string {
  if (Number.isNaN(date.getTime())) throw new RangeError("Date must be valid.");
  return date.toISOString().slice(0, 10);
}

export function getNextUtcPuzzleAt(date: Date = new Date()): Date {
  if (Number.isNaN(date.getTime())) throw new RangeError("Date must be valid.");
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate() + 1),
  );
}

/** The version prefix keeps historical boards stable if generation changes. */
export function generateDailyBoard(
  puzzleId: string,
  size = DAILY_BOARD_SIZE,
): GeneratedBoard {
  return generateConfiguredBoard({
    ...createDailyGameConfiguration(puzzleId),
    boardSize: size,
    targetWordCount: Math.max(3, size),
  });
}
