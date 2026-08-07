import { describe, expect, it } from "vitest";
import {
  generateDailyBoard,
  getNextUtcPuzzleAt,
  getUtcPuzzleId,
} from "../src";

describe("daily puzzles", () => {
  it("uses the UTC calendar day", () => {
    expect(getUtcPuzzleId(new Date("2026-08-07T23:59:59.999Z"))).toBe("2026-08-07");
    expect(getUtcPuzzleId(new Date("2026-08-08T00:00:00.000Z"))).toBe("2026-08-08");
    expect(getNextUtcPuzzleAt(new Date("2026-08-07T14:30:00Z")).toISOString()).toBe(
      "2026-08-08T00:00:00.000Z",
    );
  });

  it("generates the same board for a day and a different board next day", () => {
    const first = generateDailyBoard("2026-08-07");
    expect(generateDailyBoard("2026-08-07").cells).toEqual(first.cells);
    expect(generateDailyBoard("2026-08-08").cells).not.toEqual(first.cells);
  });
});
