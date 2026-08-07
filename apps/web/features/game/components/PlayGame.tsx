"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  createWordDictionary,
  DEFAULT_PLAYABLE_WORDS,
  findWordPath,
  scoreWord,
  type Letter,
  WordSubmissionTracker,
} from "@lettermaze/game";
import {
  emptyPlayerStatistics,
  recordCompletedGame,
  type PlayerStatistics,
} from "@/features/player";
import { browserStorage } from "@/lib/storage";
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
  const playableWords = useMemo(() => {
    if (
      cells.length !== size * size ||
      cells.some((cell) => !/^[A-Z]$/.test(cell))
    ) {
      return [];
    }

    const letterCells = cells as readonly Letter[];
    return DEFAULT_PLAYABLE_WORDS.filter((word) =>
      findWordPath({ cells: letterCells, size }, word),
    );
  }, [cells, size]);
  const submissions = useRef(
    new WordSubmissionTracker(createWordDictionary(DEFAULT_PLAYABLE_WORDS)),
  );
  const [foundWords, setFoundWords] = useState<string[]>([]);
  const [score, setScore] = useState(0);
  const [wordsFound, setWordsFound] = useState(0);
  const [scoreUpdate, setScoreUpdate] = useState({ points: 0, sequence: 0 });
  const [remainingSeconds, setRemainingSeconds] = useState(duration);
  const [isPaused, setIsPaused] = useState(false);
  const [isGameOver, setIsGameOver] = useState(duration === 0);
  const [playerStatistics, setPlayerStatistics] = useState<PlayerStatistics>(
    emptyPlayerStatistics,
  );
  const scoreRef = useRef(0);
  const wordsFoundRef = useRef(0);
  const foundWordsRef = useRef<string[]>([]);
  const deadlineRef = useRef(0);
  const remainingMsRef = useRef(duration * 1000);
  const endedRef = useRef(false);

  const endGame = useCallback(() => {
    if (endedRef.current) return;
    endedRef.current = true;
    remainingMsRef.current = 0;
    setRemainingSeconds(0);
    setIsGameOver(true);
    setPlayerStatistics(
      recordCompletedGame(browserStorage, {
        score: scoreRef.current,
        words: foundWordsRef.current,
      }),
    );
    onGameEnd?.({ score: scoreRef.current, wordsFound: wordsFoundRef.current });
  }, [onGameEnd]);

  const replay = () => {
    submissions.current.reset();
    scoreRef.current = 0;
    wordsFoundRef.current = 0;
    foundWordsRef.current = [];
    remainingMsRef.current = duration * 1000;
    deadlineRef.current = Date.now() + duration * 1000;
    endedRef.current = false;
    setScore(0);
    setWordsFound(0);
    setFoundWords([]);
    setScoreUpdate({ points: 0, sequence: 0 });
    setRemainingSeconds(duration);
    setIsPaused(false);
    setIsGameOver(duration === 0);
  };

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
    if (isPaused || isGameOver) return false;
    const word = indexes.map((index) => cells[index] ?? "").join("");
    const acceptedWord = submissions.current.submit(word);
    if (!acceptedWord) return false;

    const points = scoreWord(acceptedWord);
    scoreRef.current += points;
    wordsFoundRef.current = submissions.current.size;
    foundWordsRef.current = [...foundWordsRef.current, acceptedWord];
    setScore(scoreRef.current);
    setWordsFound(wordsFoundRef.current);
    setFoundWords((words) => [...words, acceptedWord]);
    setScoreUpdate((update) => ({ points, sequence: update.sequence + 1 }));
    return true;
  };

  if (isGameOver) {
    const longestWord = foundWords.reduce(
      (longest, word) => (word.length > longest.length ? word : longest),
      "",
    );
    const missedWords = playableWords.filter(
      (word) => !foundWords.includes(word),
    );

    return (
      <section
        aria-labelledby="results-heading"
        className="w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-900"
      >
        <div className="bg-gradient-to-br from-sky-600 to-indigo-700 px-6 py-8 text-center text-white sm:px-10">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-100">
            Time&apos;s up
          </p>
          <h2 className="mt-2 text-3xl font-bold" id="results-heading">
            Game results
          </h2>
          <p
            className="mt-4 text-5xl font-black tabular-nums"
            data-testid="results-score"
          >
            {score}
          </p>
          <p className="mt-1 text-sm font-medium text-sky-100">Total score</p>
        </div>

        <div className="space-y-6 p-6 sm:p-8">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-slate-100 p-4 dark:bg-slate-800">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Words found
              </p>
              <p
                className="mt-1 text-2xl font-bold tabular-nums"
                data-testid="results-words-found"
              >
                {foundWords.length}
              </p>
            </div>
            <div className="rounded-xl bg-slate-100 p-4 dark:bg-slate-800">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Longest word
              </p>
              <p className="mt-1 truncate text-2xl font-bold uppercase">
                {longestWord || "—"}
              </p>
            </div>
          </div>

          <div>
            <h3 className="font-bold">All-time statistics</h3>
            <dl className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {[
                ["Games played", playerStatistics.gamesPlayed],
                ["Total words", playerStatistics.totalWordsFound],
                ["Highest score", playerStatistics.highestScore],
                ["Longest word", playerStatistics.longestWord || "—"],
                ["Average score", playerStatistics.averageScore.toFixed(1)],
              ].map(([label, value]) => (
                <div
                  className="rounded-xl bg-slate-100 p-3 dark:bg-slate-800"
                  key={label}
                >
                  <dt className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    {label}
                  </dt>
                  <dd className="mt-1 truncate text-xl font-bold tabular-nums uppercase">
                    {value}
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          <div>
            <h3 className="font-bold">Your words</h3>
            {foundWords.length > 0 ? (
              <ul
                className="mt-2 flex flex-wrap gap-2"
                aria-label="Words found"
              >
                {foundWords.map((word) => (
                  <li
                    className="rounded-full bg-emerald-100 px-3 py-1 text-sm font-semibold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200"
                    key={word}
                  >
                    {word}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                No words found this round.
              </p>
            )}
          </div>

          <div>
            <h3 className="font-bold">Missed words</h3>
            {missedWords.length > 0 ? (
              <ul
                className="mt-2 flex flex-wrap gap-2"
                aria-label="Missed words"
              >
                {missedWords.map((word) => (
                  <li
                    className="rounded-full bg-amber-100 px-3 py-1 text-sm font-semibold text-amber-900 dark:bg-amber-950 dark:text-amber-200"
                    key={word}
                  >
                    {word}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                You found every word!
              </p>
            )}
          </div>

          <button
            className="min-h-12 w-full rounded-xl bg-sky-600 px-5 font-bold text-white shadow-sm transition-colors hover:bg-sky-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600"
            onClick={replay}
            type="button"
          >
            Play again
          </button>
        </div>
      </section>
    );
  }

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
          {isPaused ? "Game paused" : "Game in progress"}
        </span>
        <button
          className="min-h-11 rounded-lg border border-slate-300 bg-white px-4 font-semibold dark:border-slate-700 dark:bg-slate-900"
          onClick={() => setIsPaused((paused) => !paused)}
          type="button"
        >
          {isPaused ? "Resume" : "Pause"}
        </button>
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
