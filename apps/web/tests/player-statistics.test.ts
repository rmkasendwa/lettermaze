import { beforeEach, describe, expect, it } from "vitest";
import { browserStorage } from "@/lib/storage";
import {
  getPlayerStatistics,
  PLAYER_STATISTICS_KEY,
  recordCompletedGame,
  mergePlayerStatistics,
} from "@/features/player";

describe("player statistics", () => {
  beforeEach(() => localStorage.clear());

  it("accumulates completed games and persists every statistic", () => {
    recordCompletedGame(browserStorage, {
      score: 12,
      words: ["TEAM", "LETTER"],
    });
    const statistics = recordCompletedGame(browserStorage, {
      score: 6,
      words: ["WORD"],
    });

    expect(statistics).toEqual({
      gamesPlayed: 2,
      totalWordsFound: 3,
      highestScore: 12,
      longestWord: "LETTER",
      averageScore: 9,
      totalScore: 18,
    });
    expect(getPlayerStatistics(browserStorage)).toEqual(statistics);
  });

  it("recovers safely from invalid persisted data", () => {
    localStorage.setItem(PLAYER_STATISTICS_KEY, JSON.stringify({ nope: true }));
    expect(getPlayerStatistics(browserStorage).gamesPlayed).toBe(0);
  });

  it("merges additive totals while keeping personal bests", () => {
    expect(
      mergePlayerStatistics(
        {
          gamesPlayed: 2,
          totalWordsFound: 5,
          highestScore: 20,
          longestWord: "MAZE",
          averageScore: 8,
          totalScore: 16,
        },
        {
          gamesPlayed: 3,
          totalWordsFound: 9,
          highestScore: 18,
          longestWord: "LETTERS",
          averageScore: 10,
          totalScore: 30,
        },
      ),
    ).toEqual({
      gamesPlayed: 5,
      totalWordsFound: 14,
      highestScore: 20,
      longestWord: "LETTERS",
      averageScore: 9.2,
      totalScore: 46,
    });
  });
});
