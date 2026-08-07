import { beforeEach, describe, expect, it } from "vitest";
import { browserStorage } from "@/lib/storage";
import {
  getPlayerStatistics,
  PLAYER_STATISTICS_KEY,
  recordCompletedGame,
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
});
