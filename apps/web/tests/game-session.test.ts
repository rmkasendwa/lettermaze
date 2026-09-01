import { beforeEach, describe, expect, it } from "vitest";
import { createNormalGameConfiguration } from "@lettermaze/game";
import { browserStorage } from "@/lib/storage";
import {
  loadActiveGame,
  saveActiveGame,
  type ActiveGameSession,
} from "@/features/game/session";

describe("configured saved games", () => {
  beforeEach(() => localStorage.clear());

  it("restores the saved board and scoring rules instead of difficulty defaults", () => {
    const session: ActiveGameSession = {
      version: 1,
      difficulty: "medium",
      config: {
        ...createNormalGameConfiguration(),
        boardSize: 2,
        words: ["BIRD"],
        scoring: { tiers: [{ minLength: 1, points: 9 }], multiplier: 2 },
      },
      cells: ["B", "I", "D", "R"],
      size: 2,
      targetWords: ["BIRD"],
      foundWords: ["BIRD"],
      score: 18,
      expiresAt: Date.now() + 60_000,
    };
    saveActiveGame(browserStorage, session);
    expect(loadActiveGame(browserStorage)).toEqual(session);
    saveActiveGame(browserStorage, { ...session, score: 1 });
    expect(loadActiveGame(browserStorage)).toBeNull();
    saveActiveGame(browserStorage, {
      ...session,
      config: { ...session.config!, boardSize: -1 },
    });
    expect(loadActiveGame(browserStorage)).toBeNull();
  });
});
