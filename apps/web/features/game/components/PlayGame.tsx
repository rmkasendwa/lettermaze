"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  createWordDictionary,
  DEFAULT_PLAYABLE_WORDS,
  scoreWord,
  WordSubmissionTracker,
} from "@lettermaze/game";
import { Board } from "./Board";

export interface PlayGameProps {
  cells: readonly string[];
  size: number;
  durationSeconds?: number;
  onGameEnd?: (result: { score: number; wordsFound: number }) => void;
}

export function PlayGame({
  cells,
  size,
  durationSeconds = 180,
  onGameEnd,
}: PlayGameProps) {
  const duration = Math.max(0, Math.floor(durationSeconds));
  const submissions = useRef(
    new WordSubmissionTracker(createWordDictionary(DEFAULT_PLAYABLE_WORDS)),
  );
  const [score, setScore] = useState(0);
  const [wordsFound, setWordsFound] = useState(0);
  const [scoreUpdate, setScoreUpdate] = useState({ points: 0, sequence: 0 });
  const [remainingSeconds, setRemainingSeconds] = useState(duration);
  const [isPaused, setIsPaused] = useState(false);
  const [isGameOver, setIsGameOver] = useState(duration === 0);
  const scoreRef = useRef(0);
  const wordsFoundRef = useRef(0);
  const deadlineRef = useRef(Date.now() + duration * 1000);
  const remainingMsRef = useRef(duration * 1000);
  const endedRef = useRef(false);

  const endGame = useCallback(() => {
    if (endedRef.current) return;
    endedRef.current = true;
    remainingMsRef.current = 0;
    setRemainingSeconds(0);
    setIsGameOver(true);
    onGameEnd?.({ score: scoreRef.current, wordsFound: wordsFoundRef.current });
  }, [onGameEnd]);

  useEffect(() => {
    if (duration === 0) {
      endGame();
      return;
    }
    if (isPaused || isGameOver) return;

    deadlineRef.current = Date.now() + remainingMsRef.current;
    const update = () => {
      const remainingMs = Math.max(0, deadlineRef.current - Date.now());
      remainingMsRef.current = remainingMs;
      setRemainingSeconds(Math.ceil(remainingMs / 1000));
      if (remainingMs === 0) endGame();
    };
    update();
    const timer = window.setInterval(update, 100);
    return () => window.clearInterval(timer);
  }, [duration, endGame, isGameOver, isPaused]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && !isGameOver) setIsPaused(true);
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [isGameOver]);

  const submitPath = (indexes: readonly number[]) => {
    if (isPaused || isGameOver) return;
    const word = indexes.map((index) => cells[index] ?? "").join("");
    const acceptedWord = submissions.current.submit(word);
    if (!acceptedWord) return;

    const points = scoreWord(acceptedWord);
    scoreRef.current += points;
    wordsFoundRef.current = submissions.current.size;
    setScore(scoreRef.current);
    setWordsFound(wordsFoundRef.current);
    setScoreUpdate((update) => ({ points, sequence: update.sequence + 1 }));
  };

  return (
    <section aria-label="Current game" className="w-full">
      <div className="mb-4 grid grid-cols-3 gap-3" aria-live="polite">
        <div className="rounded-xl border border-slate-200 bg-white p-3 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Time
          </div>
          <div
            className="mt-1 text-3xl font-bold tabular-nums"
            data-testid="timer"
          >
            {Math.floor(remainingSeconds / 60)}:
            {String(remainingSeconds % 60).padStart(2, "0")}
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-3 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Score
          </div>
          <div
            className="relative mt-1 text-3xl font-bold tabular-nums"
            data-testid="score"
          >
            <span
              key={scoreUpdate.sequence}
              className="score-update inline-block"
            >
              {score}
            </span>
            {scoreUpdate.sequence > 0 && scoreUpdate.points > 0 ? (
              <span
                key={`points-${scoreUpdate.sequence}`}
                aria-hidden="true"
                className="score-points absolute left-1/2 ml-5 text-sm font-bold text-emerald-600 dark:text-emerald-400"
              >
                +{scoreUpdate.points}
              </span>
            ) : null}
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-3 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Words found
          </div>
          <div
            className="mt-1 text-3xl font-bold tabular-nums"
            data-testid="words-found"
          >
            {wordsFound}
          </div>
        </div>
      </div>
      <div className="mb-3 flex items-center justify-between">
        <span className="font-semibold" role="status">
          {isGameOver
            ? "Game over"
            : isPaused
              ? "Game paused"
              : "Game in progress"}
        </span>
        {!isGameOver ? (
          <button
            className="min-h-11 rounded-lg border border-slate-300 bg-white px-4 font-semibold dark:border-slate-700 dark:bg-slate-900"
            onClick={() => setIsPaused((paused) => !paused)}
            type="button"
          >
            {isPaused ? "Resume" : "Pause"}
          </button>
        ) : null}
      </div>
      <Board
        cells={cells}
        disabled={isPaused || isGameOver}
        size={size}
        onSelectionComplete={submitPath}
      />
    </section>
  );
}
