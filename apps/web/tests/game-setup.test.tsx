import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  DIFFICULTY_STORAGE_KEY,
  GameSetup,
  TUTORIAL_STORAGE_KEY,
} from "@/features/game";
import { ACTIVE_GAME_STORAGE_KEY } from "@/features/game/session";

const restoredCells = [
  "T",
  "R",
  "E",
  "E",
  "A",
  "B",
  "C",
  "D",
  "E",
  "F",
  "G",
  "H",
  "I",
  "J",
  "K",
  "L",
];

describe("GameSetup", () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem(TUTORIAL_STORAGE_KEY, JSON.stringify(true));
  });

  it("shows a compact tutorial once before the first game", () => {
    localStorage.removeItem(TUTORIAL_STORAGE_KEY);
    render(<GameSetup />);

    fireEvent.click(screen.getByRole("button", { name: "Start Medium game" }));
    expect(
      screen.getByRole("dialog", { name: "Connect letters to find words" }),
    ).toHaveTextContent("crossed out immediately");
    expect(
      screen.getByLabelText("Drag across adjacent letters C, A, T"),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Start playing" }));
    expect(screen.getByRole("grid")).toBeInTheDocument();
    expect(JSON.parse(localStorage.getItem(TUTORIAL_STORAGE_KEY)!)).toBe(true);
  });

  it("lets the player choose a difficulty before generating the game", () => {
    render(<GameSetup />);

    expect(screen.queryByRole("grid")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("radio", { name: /Hard/ }));
    fireEvent.click(screen.getByRole("button", { name: "Start Hard game" }));

    expect(screen.getByRole("grid")).toHaveAttribute("aria-rowcount", "6");
    expect(screen.getByTestId("timer")).toHaveTextContent("2:00");
    expect(JSON.parse(localStorage.getItem(DIFFICULTY_STORAGE_KEY)!)).toBe(
      "hard",
    );
  });

  it("restores a valid preferred difficulty across sessions", async () => {
    localStorage.setItem(DIFFICULTY_STORAGE_KEY, JSON.stringify("easy"));
    render(<GameSetup />);

    await waitFor(() =>
      expect(screen.getByRole("radio", { name: /Easy/ })).toBeChecked(),
    );
    expect(
      screen.getByRole("button", { name: "Start Easy game" }),
    ).toBeInTheDocument();
  });

  it("restores a compatible active board, words, score, and remaining time", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-16T12:00:00Z"));
    localStorage.setItem(
      ACTIVE_GAME_STORAGE_KEY,
      JSON.stringify({
        version: 1,
        difficulty: "easy",
        cells: restoredCells,
        size: 4,
        foundWords: ["TREE"],
        score: 4,
        expiresAt: Date.now() + 90_000,
      }),
    );

    render(<GameSetup />);

    expect(screen.getByRole("grid")).toHaveAttribute("aria-rowcount", "4");
    expect(screen.getByTestId("timer")).toHaveTextContent("1:30");
    expect(screen.getByTestId("score")).toHaveTextContent("4");
    expect(screen.getByTestId("words-found")).toHaveTextContent("1");
    expect(
      screen.getByRole("list", { name: "Accepted words" }),
    ).toHaveTextContent("TREE");
    vi.useRealTimers();
  });

  it("discards expired and invalid active sessions", () => {
    localStorage.setItem(
      ACTIVE_GAME_STORAGE_KEY,
      JSON.stringify({
        version: 1,
        difficulty: "easy",
        cells: restoredCells,
        size: 4,
        foundWords: [],
        score: 99,
        expiresAt: Date.now() - 1,
      }),
    );

    render(<GameSetup />);

    expect(screen.queryByRole("grid")).not.toBeInTheDocument();
    expect(localStorage.getItem(ACTIVE_GAME_STORAGE_KEY)).toBeNull();
  });
});
