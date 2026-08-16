import { describe, expect, it } from "vitest";
import { calculateDailyStreak } from "../src/account/streak";

describe("daily streaks", () => {
  it("counts consecutive local calendar days", () => {
    expect(
      calculateDailyStreak(
        ["2026-08-14", "2026-08-15", "2026-08-16"],
        "2026-08-16",
      ),
    ).toEqual({ current: 3, longest: 3 });
  });

  it("does not count duplicate completions twice", () => {
    expect(
      calculateDailyStreak(
        ["2026-08-15", "2026-08-16", "2026-08-16"],
        "2026-08-16",
      ),
    ).toEqual({ current: 2, longest: 2 });
  });

  it("resets the current streak after a missed day and preserves the best", () => {
    expect(
      calculateDailyStreak(
        ["2026-08-10", "2026-08-11", "2026-08-12", "2026-08-15"],
        "2026-08-16",
      ),
    ).toEqual({ current: 1, longest: 3 });
    expect(
      calculateDailyStreak(["2026-08-10", "2026-08-11"], "2026-08-16"),
    ).toEqual({ current: 0, longest: 2 });
  });
});
