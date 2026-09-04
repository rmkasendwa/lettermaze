"use client";

import { useState } from "react";
import {
  createNormalGameConfiguration,
  createPracticeGameConfiguration,
  generateConfiguredBoard,
  type GameConfiguration,
  type GeneratedBoard,
} from "@lettermaze/game";
import { PlayGame } from "./PlayGame";

function createPracticeSettings(
  boardSize: number,
  unlimitedTime: boolean,
): GameConfiguration {
  return createPracticeGameConfiguration({
    ...createNormalGameConfiguration("medium"),
    boardSize,
    durationSeconds: unlimitedTime ? 0 : 180,
    targetWordCount: Math.max(4, boardSize),
  });
}

export function PracticeGame() {
  const [boardSize, setBoardSize] = useState(5);
  const [unlimitedTime, setUnlimitedTime] = useState(true);
  const [activeConfig, setActiveConfig] = useState(() =>
    createPracticeSettings(5, true),
  );
  const [board, setBoard] = useState<GeneratedBoard>(() =>
    generateConfiguredBoard(activeConfig),
  );
  const [gameNumber, setGameNumber] = useState(1);

  const startNewPractice = () => {
    const config = createPracticeSettings(boardSize, unlimitedTime);
    setActiveConfig(config);
    setBoard(generateConfiguredBoard(config));
    setGameNumber((current) => current + 1);
  };

  return (
    <main className="mx-auto w-full max-w-3xl px-3 py-3 sm:px-6">
      <header className="mb-3 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm font-bold uppercase tracking-wider text-violet-600">
            Unranked
          </p>
          <h1 className="text-2xl font-bold">Practice mode</h1>
        </div>
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-white p-2 dark:border-slate-800 dark:bg-slate-900">
          <label className="text-sm font-semibold">
            Board
            <select
              className="ml-2 rounded-lg border border-slate-300 bg-transparent px-2 py-1"
              onChange={(event) => setBoardSize(Number(event.target.value))}
              value={boardSize}
            >
              {[4, 5, 6].map((size) => (
                <option key={size} value={size}>
                  {size}×{size}
                </option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-2 text-sm font-semibold">
            <input
              checked={unlimitedTime}
              onChange={(event) => setUnlimitedTime(event.target.checked)}
              type="checkbox"
            />
            Unlimited time
          </label>
          <button
            className="min-h-10 rounded-lg bg-violet-600 px-4 text-sm font-bold text-white hover:bg-violet-700"
            onClick={startNewPractice}
            type="button"
          >
            Restart practice
          </button>
        </div>
      </header>
      <PlayGame
        cells={board.cells}
        config={activeConfig}
        key={gameNumber}
        onPlayAgain={startNewPractice}
        targetWords={board.targetWords}
      />
    </main>
  );
}
