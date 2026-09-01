import { describe, expect, it } from "vitest";
import {
  createDailyGameConfiguration,
  createNormalGameConfiguration,
  createPracticeGameConfiguration,
  generateBoard,
  generateConfiguredBoard,
  isGameConfiguration,
  resolveGameConfiguration,
  scoreWord,
} from "../src";

describe("shared game configuration", () => {
  it("represents normal, ranked daily, and unranked practice games", () => {
    const daily = createDailyGameConfiguration("2026-09-02");
    const practice = createPracticeGameConfiguration(daily);
    expect(createNormalGameConfiguration("hard")).toMatchObject({
      boardSize: 6,
      durationSeconds: 120,
      ranked: false,
    });
    expect(daily.ranked).toBe(true);
    expect(practice.ranked).toBe(false);
    expect(generateConfiguredBoard(practice)).toEqual(
      generateConfiguredBoard(daily),
    );
    expect(generateConfiguredBoard(daily)).toEqual(
      generateBoard({ size: 5, seed: "lettermaze:daily:v1:2026-09-02" }),
    );
  });

  it("adds a custom mode through rules and ordered modifiers", () => {
    const config = {
      ...createNormalGameConfiguration(),
      mode: "sprint",
      seed: { kind: "fixed" as const, value: 42 },
      modifiers: [
        {
          id: "short",
          rules: {
            boardSize: 3,
            durationSeconds: 60,
            words: ["CAT", "DOG"],
            targetWordCount: 2,
          },
        },
        {
          id: "bonus",
          rules: {
            durationSeconds: 30,
            scoring: { tiers: [{ minLength: 1, points: 5 }], multiplier: 2 },
            endOnAllWordsFound: false,
          },
        },
      ],
    };
    const rules = resolveGameConfiguration(config);
    expect(rules).toMatchObject({
      boardSize: 3,
      durationSeconds: 30,
      endOnAllWordsFound: false,
    });
    expect(scoreWord("CAT", rules.scoring)).toBe(10);
    expect(generateConfiguredBoard(config)).toMatchObject({
      size: 3,
      targetWords: expect.arrayContaining(["CAT", "DOG"]),
    });
    expect(generateConfiguredBoard(config)).toEqual(
      generateConfiguredBoard(JSON.parse(JSON.stringify(config))),
    );
    expect(config.boardSize).toBe(5);
  });

  it("rejects invalid persisted rules", () => {
    for (const value of [
      null,
      {},
      { ...createNormalGameConfiguration(), durationSeconds: -1 },
      {
        ...createNormalGameConfiguration(),
        seed: { kind: "fixed", value: null },
      },
    ]) {
      expect(isGameConfiguration(value)).toBe(false);
    }
    expect(isGameConfiguration(createNormalGameConfiguration())).toBe(true);
  });
});
