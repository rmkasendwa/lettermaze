import { describe, expect, it } from "vitest";
import {
  createWordDictionary,
  loadWordDictionary,
  normalizeWord,
  WordSubmissionTracker,
} from "../src/index.js";

describe("dictionary validation", () => {
  it("normalizes casing and surrounding whitespace", () => {
    expect(normalizeWord("  CaT \n")).toBe("CAT");

    const submissions = new WordSubmissionTracker(
      createWordDictionary(["cat", "DOG"]),
    );
    expect(submissions.submit(" Cat ")).toBe("CAT");
    expect(submissions.submit("dog")).toBe("DOG");
  });

  it("accepts only words in the dictionary", () => {
    const submissions = new WordSubmissionTracker(
      createWordDictionary(["CAT"]),
    );

    expect(submissions.submit("CAT")).toBe("CAT");
    expect(submissions.submit("CATS")).toBeNull();
    expect(submissions.submit("123")).toBeNull();
    expect(submissions.size).toBe(1);
  });

  it("ignores duplicate submissions regardless of casing", () => {
    const submissions = new WordSubmissionTracker(
      createWordDictionary(["letter"]),
    );

    expect(submissions.submit("Letter")).toBe("LETTER");
    expect(submissions.submit("LETTER")).toBeNull();
    expect(submissions.submit(" letter ")).toBeNull();
    expect(submissions.size).toBe(1);
  });

  it("loads replaceable newline-delimited dictionaries", () => {
    const first = loadWordDictionary("cat\r\ndog\n");
    const replacement = loadWordDictionary("tree\nplant\n");

    expect(first.size).toBe(2);
    expect(first.has("CAT")).toBe(true);
    expect(replacement.has("cat")).toBe(false);
    expect(replacement.has("TREE")).toBe(true);
  });

  it("can reset duplicate tracking for a new game", () => {
    const submissions = new WordSubmissionTracker(
      createWordDictionary(["CAT"]),
    );
    submissions.submit("CAT");
    submissions.reset();

    expect(submissions.submit("cat")).toBe("CAT");
  });
});
