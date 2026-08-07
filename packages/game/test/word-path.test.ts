import { describe, expect, it } from "vitest";
import { findWordPath, type Letter } from "../src/index.js";

const board = {
  size: 3,
  cells: ["C", "A", "T", "X", "R", "D", "Y", "Z", "O"] as Letter[],
};

describe("word path validation", () => {
  it.each([
    [
      "CAT",
      [
        { row: 0, column: 0 },
        { row: 0, column: 1 },
        { row: 0, column: 2 },
      ],
    ],
    [
      "CXY",
      [
        { row: 0, column: 0 },
        { row: 1, column: 0 },
        { row: 2, column: 0 },
      ],
    ],
    [
      "CRO",
      [
        { row: 0, column: 0 },
        { row: 1, column: 1 },
        { row: 2, column: 2 },
      ],
    ],
  ])(
    "finds horizontal, vertical, and diagonal paths for %s",
    (word, expected) => {
      expect(findWordPath(board, word)).toEqual(expected);
    },
  );

  it("returns the path in the requested word order", () => {
    expect(findWordPath(board, "orc")).toEqual([
      { row: 2, column: 2 },
      { row: 1, column: 1 },
      { row: 0, column: 0 },
    ]);
  });

  it("rejects paths that revisit a tile", () => {
    expect(
      findWordPath({ size: 2, cells: ["A", "B", "X", "X"] as Letter[] }, "ABA"),
    ).toBeNull();
  });

  it("rejects words whose letters are not connected", () => {
    expect(findWordPath(board, "CO")).toBeNull();
  });

  it("rejects empty, non-alphabetic, and oversized words", () => {
    expect(findWordPath(board, "")).toBeNull();
    expect(findWordPath(board, "C-A-T")).toBeNull();
    expect(findWordPath(board, "ABCDEFGHIJ")).toBeNull();
  });
});
