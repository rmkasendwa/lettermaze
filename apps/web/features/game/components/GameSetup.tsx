"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import {
  DIFFICULTY_CONFIGS,
  DIFFICULTY_LEVELS,
  generateConfiguredBoard,
  createNormalGameConfiguration,
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
export const TUTORIAL_STORAGE_KEY = "lettermaze.tutorialCompleted";

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
  const [showTutorial, setShowTutorial] = useState(false);
  const activeDifficulty = restoredSession?.difficulty ?? difficulty;

  useEffect(() => {
    const session = loadActiveGame(browserStorage);
    if (!session) return;
    // Restoring persisted state is an intentional one-time external sync.
    // eslint-disable-next-line react-hooks/set-state-in-effect
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

  const beginGame = () => {
    const config = createNormalGameConfiguration(difficulty);
    browserStorage.set(DIFFICULTY_STORAGE_KEY, difficulty);
    setRestoredSession(null);
    setBoard(generateConfiguredBoard(config));
  };

  const startGame = () => {
    if (browserStorage.get(TUTORIAL_STORAGE_KEY) !== true) {
      setShowTutorial(true);
      return;
    }
    beginGame();
  };

  if (board) {
    const config = DIFFICULTY_CONFIGS[activeDifficulty];
    return (
      <div className="w-full">
        <div className="game-context mx-auto mb-2 flex max-w-xl items-center justify-end">
          <button
            aria-label={`Change difficulty. Current difficulty: ${config.label}`}
            className="min-h-9 rounded-lg px-3 text-xs font-semibold text-slate-500 transition-colors hover:bg-slate-200 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
            onClick={() => {
              discardActiveGame(browserStorage);
              setRestoredSession(null);
              setBoard(null);
            }}
            type="button"
          >
            {config.label} · Change
          </button>
        </div>
        <PlayGame
          cells={board.cells}
          targetWords={
            board.targetWords?.length > 0 ? board.targetWords : undefined
          }
          config={
            restoredSession?.config ??
            createNormalGameConfiguration(activeDifficulty)
          }
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
      <details className="mt-4 text-sm text-slate-600 dark:text-slate-300">
        <summary className="cursor-pointer font-semibold">How to play</summary>
        <p className="mt-2">
          Drag across adjacent letters in any direction to spell one of the
          listed target words. A cell cannot be reused within the same word.
          Found targets are crossed out. Find every target before time runs out.
        </p>
      </details>
      {showTutorial ? (
        <div
          aria-labelledby="tutorial-heading"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4"
          role="dialog"
        >
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-2xl dark:bg-slate-900">
            <p className="text-sm font-bold uppercase tracking-wider text-sky-600">
              Quick start
            </p>
            <h2 className="mt-2 text-2xl font-bold" id="tutorial-heading">
              Connect letters to find words
            </h2>
            <div
              aria-label="Drag across adjacent letters C, A, T"
              className="my-5 flex items-center justify-center gap-2"
            >
              {["C", "A", "T"].map((letter) => (
                <span
                  className="grid size-12 place-items-center rounded-xl bg-sky-100 text-xl font-black text-sky-900 ring-2 ring-sky-400"
                  key={letter}
                >
                  {letter}
                </span>
              ))}
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Drag through adjacent letters. When you find a listed word, it is
              crossed out immediately.
            </p>
            <button
              className="mt-6 min-h-12 w-full rounded-xl bg-sky-600 px-5 font-bold text-white hover:bg-sky-700"
              onClick={() => {
                browserStorage.set(TUTORIAL_STORAGE_KEY, true);
                setShowTutorial(false);
                beginGame();
              }}
              type="button"
            >
              Start playing
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
}
