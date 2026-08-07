import { generateBoard, type GeneratedBoard } from "./board";

export const DAILY_BOARD_SIZE = 5;

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
  if (!/^\d{4}-\d{2}-\d{2}$/.test(puzzleId)) {
    throw new RangeError("Puzzle id must use YYYY-MM-DD format.");
  }
  return generateBoard({ size, seed: `lettermaze:daily:v1:${puzzleId}` });
}
