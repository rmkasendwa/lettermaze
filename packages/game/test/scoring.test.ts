import { describe, expect, it } from "vitest";
import { scoreWord } from "../src/index";

describe("word scoring", () => {
  it.each([
    ["AT", 0],
    ["CAT", 1],
    ["READ", 1],
    ["HOUSE", 2],
    ["LETTER", 3],
    ["GARDENS", 5],
    ["NOTEBOOK", 11],
    ["IMPOSSIBILITIES", 11],
  ])("scores %s as %i points", (word, expected) => {
    expect(scoreWord(word)).toBe(expected);
  });
});
