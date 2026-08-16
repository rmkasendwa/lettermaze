import type { StorageAdapter } from "@/lib/storage";
export {
  getDailyStreak,
  getLocalDate,
  recordDailyCompletion,
} from "./dailyStreak";

export const PLAYER_STATISTICS_KEY = "lettermaze.player-statistics.v1";
export const PLAYER_STATISTICS_IMPORT_KEY =
  "lettermaze.player-statistics-import.v1";

export interface PlayerStatistics {
  gamesPlayed: number;
  totalWordsFound: number;
  highestScore: number;
  mostWordsFound: number;
  longestWord: string;
  bestDailyScore: number;
  averageScore: number;
  totalScore: number;
}

export const emptyPlayerStatistics: PlayerStatistics = {
  gamesPlayed: 0,
  totalWordsFound: 0,
  highestScore: 0,
  mostWordsFound: 0,
  longestWord: "",
  bestDailyScore: 0,
  averageScore: 0,
  totalScore: 0,
};

function isPlayerStatistics(value: unknown): value is PlayerStatistics {
  if (!value || typeof value !== "object") return false;
  const stats = value as Partial<PlayerStatistics>;
  return (
    Number.isFinite(stats.gamesPlayed) &&
    Number.isFinite(stats.totalWordsFound) &&
    Number.isFinite(stats.highestScore) &&
    (stats.mostWordsFound === undefined ||
      Number.isFinite(stats.mostWordsFound)) &&
    (stats.bestDailyScore === undefined ||
      Number.isFinite(stats.bestDailyScore)) &&
    Number.isFinite(stats.averageScore) &&
    Number.isFinite(stats.totalScore) &&
    typeof stats.longestWord === "string"
  );
}

export function mergePlayerStatistics(
  local: PlayerStatistics,
  remote: PlayerStatistics,
): PlayerStatistics {
  const gamesPlayed = local.gamesPlayed + remote.gamesPlayed;
  const totalScore = local.totalScore + remote.totalScore;
  return {
    gamesPlayed,
    totalWordsFound: local.totalWordsFound + remote.totalWordsFound,
    highestScore: Math.max(local.highestScore, remote.highestScore),
    mostWordsFound: Math.max(local.mostWordsFound, remote.mostWordsFound),
    longestWord:
      local.longestWord.length > remote.longestWord.length
        ? local.longestWord
        : remote.longestWord,
    bestDailyScore: Math.max(local.bestDailyScore, remote.bestDailyScore),
    totalScore,
    averageScore: gamesPlayed ? totalScore / gamesPlayed : 0,
  };
}

export function getPlayerStatistics(storage: StorageAdapter): PlayerStatistics {
  const stored = storage.get<unknown>(PLAYER_STATISTICS_KEY);
  return isPlayerStatistics(stored)
    ? {
        ...stored,
        mostWordsFound: stored.mostWordsFound ?? 0,
        bestDailyScore: stored.bestDailyScore ?? 0,
      }
    : { ...emptyPlayerStatistics };
}

export type PersonalBest =
  "highestScore" | "mostWordsFound" | "longestWord" | "bestDailyScore";

export function getNewPersonalBests(
  current: PlayerStatistics,
  result: { score: number; words: readonly string[]; isDaily?: boolean },
): PersonalBest[] {
  const longestWordLength = result.words.reduce(
    (length, word) => Math.max(length, word.length),
    0,
  );
  const records: PersonalBest[] = [];
  if (result.score > current.highestScore) records.push("highestScore");
  if (result.words.length > current.mostWordsFound)
    records.push("mostWordsFound");
  if (longestWordLength > current.longestWord.length)
    records.push("longestWord");
  if (result.isDaily && result.score > current.bestDailyScore)
    records.push("bestDailyScore");
  return records;
}

export function recordCompletedGame(
  storage: StorageAdapter,
  result: { score: number; words: readonly string[]; isDaily?: boolean },
): PlayerStatistics {
  const current = getPlayerStatistics(storage);
  const gamesPlayed = current.gamesPlayed + 1;
  const totalScore = current.totalScore + result.score;
  const roundLongest = result.words.reduce(
    (longest, word) => (word.length > longest.length ? word : longest),
    "",
  );
  const next: PlayerStatistics = {
    gamesPlayed,
    totalWordsFound: current.totalWordsFound + result.words.length,
    highestScore: Math.max(current.highestScore, result.score),
    mostWordsFound: Math.max(current.mostWordsFound, result.words.length),
    longestWord:
      roundLongest.length > current.longestWord.length
        ? roundLongest
        : current.longestWord,
    bestDailyScore: result.isDaily
      ? Math.max(current.bestDailyScore, result.score)
      : current.bestDailyScore,
    averageScore: totalScore / gamesPlayed,
    totalScore,
  };
  storage.set(PLAYER_STATISTICS_KEY, next);
  return next;
}
