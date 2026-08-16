import { describe, expect, it } from "vitest";
import { eligibleAchievementIds } from "../src/account/achievements";

describe("achievement eligibility", () => {
  it("unlocks score, word length, games played, and streak milestones", () => {
    expect(
      eligibleAchievementIds({
        highestScore: 500,
        longestWord: 8,
        gamesPlayed: 10,
        longestStreak: 7,
      }),
    ).toEqual([
      "score-100",
      "score-500",
      "word-6",
      "word-8",
      "games-1",
      "games-10",
      "streak-3",
      "streak-7",
    ]);
  });

  it("does not unlock a milestone before its threshold", () => {
    expect(
      eligibleAchievementIds({
        highestScore: 99,
        longestWord: 5,
        gamesPlayed: 0,
        longestStreak: 2,
      }),
    ).toEqual([]);
  });
});
