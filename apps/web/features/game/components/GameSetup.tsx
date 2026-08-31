"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import {
  DIFFICULTY_CONFIGS,
  DIFFICULTY_LEVELS,
  generateBoard,
  isDifficulty,
  type Difficulty,
  type GeneratedBoard,
} from "@lettermaze/game";
import { browserStorage } from "@/lib/storage";
import { PlayGame } from "./PlayGame";
import {
  discardActiveGame,
  loadActiveGame,
  type ActiveGameSession,
} from "../session";

export const DIFFICULTY_STORAGE_KEY = "lettermaze.preferredDifficulty";

function subscribeToPreferredDifficulty(onStoreChange: () => void) {
  const handleStorage = (event: StorageEvent) => {
    if (event.key === DIFFICULTY_STORAGE_KEY) onStoreChange();
  };
  window.addEventListener("storage", handleStorage);
  return () => window.removeEventListener("storage", handleStorage);
}

function getPreferredDifficulty(): Difficulty {
  const preferred = browserStorage.get<unknown>(DIFFICULTY_STORAGE_KEY);
  return isDifficulty(preferred) ? preferred : "medium";
}

export function GameSetup() {
  const preferredDifficulty = useSyncExternalStore<Difficulty>(
    subscribeToPreferredDifficulty,
    getPreferredDifficulty,
    () => "medium",
  );
  const [selectedDifficulty, setSelectedDifficulty] =
    useState<Difficulty | null>(null);
  const difficulty = selectedDifficulty ?? preferredDifficulty;
  const [restoredSession, setRestoredSession] =
    useState<ActiveGameSession | null>(null);
  const [board, setBoard] = useState<GeneratedBoard | null>(null);
  const activeDifficulty = restoredSession?.difficulty ?? difficulty;

  useEffect(() => {
    const session = loadActiveGame(browserStorage);
    if (!session) return;
    setRestoredSession(session);
    setBoard({
      cells: session.cells,
      size: session.size,
      guaranteedPath: [],
      guaranteedWord: "",
      targetWords: session.targetWords ?? [],
      targetPaths: [],
    });
  }, []);

  const startGame = () => {
    const config = DIFFICULTY_CONFIGS[difficulty];
    browserStorage.set(DIFFICULTY_STORAGE_KEY, difficulty);
    setRestoredSession(null);
    setBoard(
      generateBoard({
        size: config.boardSize,
        weights: config.letterWeights,
      }),
    );
  };

  if (board) {
    const config = DIFFICULTY_CONFIGS[activeDifficulty];
    return (
      <div className="w-full">
        <div className="mb-2 flex min-h-10 items-center justify-between gap-2">
          <p className="truncate text-xs font-semibold text-slate-600 dark:text-slate-300 sm:text-sm">
            {config.label} · {config.boardSize}×{config.boardSize} ·{" "}
            {config.durationSeconds / 60} min
          </p>
          <button
            className="min-h-10 shrink-0 rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold dark:border-slate-700 dark:bg-slate-900"
            onClick={() => {
              discardActiveGame(browserStorage);
              setRestoredSession(null);
              setBoard(null);
            }}
            type="button"
          >
            Change difficulty
          </button>
        </div>
        <PlayGame
          cells={board.cells}
          targetWords={board.targetWords?.length > 0 ? board.targetWords : undefined}
          durationSeconds={config.durationSeconds}
          size={config.boardSize}
          difficulty={activeDifficulty}
          initialSession={restoredSession ?? undefined}
        />
      </div>
    );
  }

  return (
    <section
      aria-labelledby="difficulty-heading"
      className="mx-auto w-full max-w-3xl rounded-2xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900 sm:p-8"
    >
      <h2 className="text-2xl font-bold" id="difficulty-heading">
        Choose your difficulty
      </h2>
      <p className="mt-1 text-slate-600 dark:text-slate-300">
        Your choice sets the board, timer, and letter mix.
      </p>
      <fieldset className="mt-6 grid gap-3 sm:grid-cols-3">
        <legend className="sr-only">Difficulty</legend>
        {DIFFICULTY_LEVELS.map((level) => {
          const config = DIFFICULTY_CONFIGS[level];
          const selected = difficulty === level;
          return (
            <label
              className={`cursor-pointer rounded-xl border-2 p-4 transition-colors ${
                selected
                  ? "border-sky-600 bg-sky-50 dark:bg-sky-950"
                  : "border-slate-200 dark:border-slate-700"
              }`}
              key={level}
            >
              <input
                checked={selected}
                className="sr-only"
                name="difficulty"
                onChange={() => setSelectedDifficulty(level)}
                type="radio"
                value={level}
              />
              <span className="block text-lg font-bold">{config.label}</span>
              <span className="mt-1 block text-sm text-slate-600 dark:text-slate-300">
                {config.boardSize}×{config.boardSize} ·{" "}
                {config.durationSeconds / 60} min
              </span>
              <span className="mt-2 block text-xs text-slate-500 dark:text-slate-400">
                {config.description}
              </span>
            </label>
          );
        })}
      </fieldset>
      <button
        className="mt-6 min-h-12 w-full rounded-xl bg-sky-600 px-5 font-bold text-white shadow-sm transition-colors hover:bg-sky-700"
        onClick={startGame}
        type="button"
      >
        Start {DIFFICULTY_CONFIGS[difficulty].label} game
      </button>
    </section>
  );
}
