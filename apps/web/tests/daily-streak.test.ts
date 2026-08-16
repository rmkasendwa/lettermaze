import { beforeEach, describe, expect, it } from "vitest";
import {
  getDailyStreak,
  recordDailyCompletion,
} from "@/features/player/dailyStreak";
import { browserStorage } from "@/lib/storage";

describe("local daily streaks", () => {
  beforeEach(() => localStorage.clear());

  it("increments once per local calendar day", () => {
    recordDailyCompletion(browserStorage, "2026-08-15");
    recordDailyCompletion(browserStorage, "2026-08-16");
    recordDailyCompletion(browserStorage, "2026-08-16");
    expect(getDailyStreak(browserStorage, "2026-08-16")).toEqual({
      current: 2,
      longest: 2,
    });
  });

  it("resets after a missed required day", () => {
    recordDailyCompletion(browserStorage, "2026-08-12");
    recordDailyCompletion(browserStorage, "2026-08-13");
    recordDailyCompletion(browserStorage, "2026-08-16");
    expect(getDailyStreak(browserStorage, "2026-08-16")).toEqual({
      current: 1,
      longest: 2,
    });
  });
});
