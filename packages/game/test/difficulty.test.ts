import { describe, expect, it } from "vitest";
import {
  DIFFICULTY_CONFIGS,
  DIFFICULTY_LEVELS,
  isDifficulty,
} from "../src/index";

describe("difficulty configuration", () => {
  it("increases board size and reduces time as difficulty rises", () => {
    const configs = DIFFICULTY_LEVELS.map(
      (difficulty) => DIFFICULTY_CONFIGS[difficulty],
    );

    expect(configs.map(({ boardSize }) => boardSize)).toEqual([4, 5, 6]);
    expect(configs.map(({ durationSeconds }) => durationSeconds)).toEqual([
      240, 180, 120,
    ]);
  });

  it("uses a friendlier easy letter mix and a rarer hard mix", () => {
    const easy = DIFFICULTY_CONFIGS.easy.letterWeights;
    const medium = DIFFICULTY_CONFIGS.medium.letterWeights;
    const hard = DIFFICULTY_CONFIGS.hard.letterWeights;

    expect(easy.E / easy.Z).toBeGreaterThan(medium.E / medium.Z);
    expect(hard.E / hard.Z).toBeLessThan(medium.E / medium.Z);
  });

  it("increases target count and word length with difficulty", () => {
    const easy = DIFFICULTY_CONFIGS.easy;
    const medium = DIFFICULTY_CONFIGS.medium;
    const hard = DIFFICULTY_CONFIGS.hard;

    expect([
      easy.targetWordCount,
      medium.targetWordCount,
      hard.targetWordCount,
    ]).toEqual([4, 6, 7]);
    expect(easy.maxWordLength).toBeLessThan(medium.maxWordLength);
    expect(medium.maxWordLength).toBeLessThan(hard.maxWordLength);
    expect(hard.minWordLength).toBeGreaterThan(easy.minWordLength);
  });

  it("validates persisted difficulty values", () => {
    expect(isDifficulty("easy")).toBe(true);
    expect(isDifficulty("expert")).toBe(false);
    expect(isDifficulty(null)).toBe(false);
  });
});
