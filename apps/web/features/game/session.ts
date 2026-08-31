import {
  DEFAULT_PLAYABLE_WORDS,
  DIFFICULTY_CONFIGS,
  findWordPath,
  isDifficulty,
  scoreWord,
  type Difficulty,
  type Letter,
} from "@lettermaze/game";
import type { StorageAdapter } from "@/lib/storage";

export const ACTIVE_GAME_STORAGE_KEY = "lettermaze.activeGame";
const SESSION_VERSION = 1;

export interface ActiveGameSession {
  version: typeof SESSION_VERSION;
  difficulty: Difficulty;
  cells: Letter[];
  size: number;
  targetWords?: string[];
  foundWords: string[];
  score: number;
  expiresAt: number;
}

export function loadActiveGame(
  storage: StorageAdapter,
  now = Date.now(),
): ActiveGameSession | null {
  const value = storage.get<unknown>(ACTIVE_GAME_STORAGE_KEY);
  if (!isValidSession(value) || value.expiresAt <= now) {
    if (value !== null) storage.remove(ACTIVE_GAME_STORAGE_KEY);
    return null;
  }
  return value;
}

export function saveActiveGame(
  storage: StorageAdapter,
  session: ActiveGameSession,
): void {
  storage.set(ACTIVE_GAME_STORAGE_KEY, session);
}

export function discardActiveGame(storage: StorageAdapter): void {
  storage.remove(ACTIVE_GAME_STORAGE_KEY);
}

function isValidSession(value: unknown): value is ActiveGameSession {
  if (!value || typeof value !== "object") return false;
  const session = value as Partial<ActiveGameSession>;
  if (
    session.version !== SESSION_VERSION ||
    !isDifficulty(session.difficulty) ||
    !Number.isInteger(session.size) ||
    !Array.isArray(session.cells) ||
    !Array.isArray(session.foundWords) ||
    (session.targetWords !== undefined && !Array.isArray(session.targetWords)) ||
    typeof session.score !== "number" ||
    !Number.isFinite(session.score) ||
    typeof session.expiresAt !== "number" ||
    !Number.isFinite(session.expiresAt)
  ) return false;

  const config = DIFFICULTY_CONFIGS[session.difficulty];
  if (
    session.size !== config.boardSize ||
    session.cells.length !== session.size * session.size ||
    session.cells.some((cell) => typeof cell !== "string" || !/^[A-Z]$/.test(cell)) ||
    new Set(session.foundWords).size !== session.foundWords.length
  ) return false;

  const board = { cells: session.cells as Letter[], size: session.size };
  const targetWords = session.targetWords ?? DEFAULT_PLAYABLE_WORDS.filter((word) => findWordPath(board, word));
  if (targetWords.length === 0 || new Set(targetWords).size !== targetWords.length || targetWords.some((word) =>
    typeof word !== "string" ||
    !(DEFAULT_PLAYABLE_WORDS as readonly string[]).includes(word) ||
    !findWordPath(board, word)
  )) return false;
  if (session.foundWords.some((word) => !targetWords.includes(word))) return false;

  return session.score === session.foundWords.reduce(
    (total, word) => total + scoreWord(word),
    0,
  );
}
