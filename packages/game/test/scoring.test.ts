import { describe, expect, it } from "vitest";
import { scoreWord } from "../src/index";

describe("word scoring", () => {
  it.each([
    ["AT", 2],
    ["CAT", 3],
    ["READ", 4],
    ["HOUSE", 5],
    ["LETTER", 6],
    ["GARDENS", 7],
    ["NOTEBOOK", 8],
    ["IMPOSSIBILITIES", 15],
  ])("scores %s as %i points", (word, expected) => {
    expect(scoreWord(word)).toBe(expected);
  });
});
