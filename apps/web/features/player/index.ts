import type { StorageAdapter } from "@/lib/storage";

export const PLAYER_STATISTICS_KEY = "lettermaze.player-statistics.v1";
export const PLAYER_STATISTICS_IMPORT_KEY =
  "lettermaze.player-statistics-import.v1";

export interface PlayerStatistics {
  gamesPlayed: number;
  totalWordsFound: number;
  highestScore: number;
  longestWord: string;
  averageScore: number;
  totalScore: number;
}

export const emptyPlayerStatistics: PlayerStatistics = {
  gamesPlayed: 0,
  totalWordsFound: 0,
  highestScore: 0,
  longestWord: "",
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
    longestWord:
      local.longestWord.length > remote.longestWord.length
        ? local.longestWord
        : remote.longestWord,
    totalScore,
    averageScore: gamesPlayed ? totalScore / gamesPlayed : 0,
  };
}

export function getPlayerStatistics(storage: StorageAdapter): PlayerStatistics {
  const stored = storage.get<unknown>(PLAYER_STATISTICS_KEY);
  return isPlayerStatistics(stored) ? stored : { ...emptyPlayerStatistics };
}

export function recordCompletedGame(
  storage: StorageAdapter,
  result: { score: number; words: readonly string[] },
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
    longestWord:
      roundLongest.length > current.longestWord.length
        ? roundLongest
        : current.longestWord,
    averageScore: totalScore / gamesPlayed,
    totalScore,
  };
  storage.set(PLAYER_STATISTICS_KEY, next);
  return next;
}
