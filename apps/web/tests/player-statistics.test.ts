import { beforeEach, describe, expect, it } from "vitest";
import { browserStorage } from "@/lib/storage";
import {
  getPlayerStatistics,
  getNewPersonalBests,
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
      mostWordsFound: 2,
      longestWord: "LETTER",
      bestDailyScore: 0,
      averageScore: 9,
      totalScore: 18,
    });
    expect(getPlayerStatistics(browserStorage)).toEqual(statistics);
  });

  it("recovers safely from invalid persisted data", () => {
    localStorage.setItem(PLAYER_STATISTICS_KEY, JSON.stringify({ nope: true }));
    expect(getPlayerStatistics(browserStorage).gamesPlayed).toBe(0);
  });

  it("reports only records that were strictly exceeded", () => {
    const current = {
      gamesPlayed: 2,
      totalWordsFound: 8,
      highestScore: 20,
      mostWordsFound: 4,
      longestWord: "LETTER",
      bestDailyScore: 18,
      averageScore: 15,
      totalScore: 30,
    };

    expect(
      getNewPersonalBests(current, {
        score: 20,
        words: ["LETTERS", "TEAM", "WORD", "MAZE"],
        isDaily: true,
      }),
    ).toEqual(["longestWord", "bestDailyScore"]);
  });

  it("tracks the best daily score only for daily games", () => {
    recordCompletedGame(browserStorage, {
      score: 30,
      words: ["TEAM"],
    });
    const statistics = recordCompletedGame(browserStorage, {
      score: 12,
      words: ["WORD"],
      isDaily: true,
    });

    expect(statistics.highestScore).toBe(30);
    expect(statistics.bestDailyScore).toBe(12);
  });

  it("merges additive totals while keeping personal bests", () => {
    expect(
      mergePlayerStatistics(
        {
          gamesPlayed: 2,
          totalWordsFound: 5,
          highestScore: 20,
          mostWordsFound: 4,
          longestWord: "MAZE",
          bestDailyScore: 14,
          averageScore: 8,
          totalScore: 16,
        },
        {
          gamesPlayed: 3,
          totalWordsFound: 9,
          highestScore: 18,
          mostWordsFound: 6,
          longestWord: "LETTERS",
          bestDailyScore: 22,
          averageScore: 10,
          totalScore: 30,
        },
      ),
    ).toEqual({
      gamesPlayed: 5,
      totalWordsFound: 14,
      highestScore: 20,
      mostWordsFound: 6,
      longestWord: "LETTERS",
      bestDailyScore: 22,
      averageScore: 9.2,
      totalScore: 46,
    });
  });
});
