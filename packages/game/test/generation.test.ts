import { describe, expect, it } from "vitest";
import {
  createSeededRandom,
  generateBoard,
  pickWeightedLetter,
} from "../src/index.js";

describe("board generation", () => {
  it("generates an identical board for the same seed", () => {
    expect(generateBoard({ size: 4, seed: "daily-2026-08-07" })).toEqual(
      generateBoard({ size: 4, seed: "daily-2026-08-07" }),
    );
  });

  it("generates different boards for different seeds", () => {
    expect(generateBoard({ size: 4, seed: "one" }).cells).not.toEqual(
      generateBoard({ size: 4, seed: "two" }).cells,
    );
  });

  it("always includes a playable word on adjacent, unique cells", () => {
    const board = generateBoard({ size: 5, seed: 42 });
    const letters = board.guaranteedPath.map(
      ({ row, column }) => board.cells[row * board.size + column],
    );

    expect(letters.join("")).toBe(board.guaranteedWord);
    expect(
      new Set(board.guaranteedPath.map(({ row, column }) => `${row},${column}`))
        .size,
    ).toBe(board.guaranteedPath.length);
    for (let index = 1; index < board.guaranteedPath.length; index += 1) {
      const previous = board.guaranteedPath[index - 1]!;
      const current = board.guaranteedPath[index]!;
      expect(
        Math.max(
          Math.abs(previous.row - current.row),
          Math.abs(previous.column - current.column),
        ),
      ).toBe(1);
    }
  });

  it("uses English weights instead of a uniform alphabet", () => {
    const random = createSeededRandom("frequency-sample");
    const counts: Record<string, number> = {};
    for (let index = 0; index < 100_000; index += 1) {
      const letter = pickWeightedLetter(random);
      counts[letter] = (counts[letter] ?? 0) + 1;
    }

    expect(counts.E).toBeGreaterThan(counts.Z! * 50);
    expect(counts.E! / 100_000).toBeGreaterThan(0.11);
    expect(counts.E! / 100_000).toBeLessThan(0.14);
  });

  it("rejects a word list that cannot make a playable board", () => {
    expect(() =>
      generateBoard({ size: 2, seed: 1, words: ["TOOLONG", "123"] }),
    ).toThrow("At least one playable word must fit");
  });
});
