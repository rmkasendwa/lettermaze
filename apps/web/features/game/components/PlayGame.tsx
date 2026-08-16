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
import type { Difficulty } from "@lettermaze/game";
import {
  discardActiveGame,
  saveActiveGame,
  type ActiveGameSession,
} from "../session";
import { shareResult } from "../share";

export interface PlayGameProps {
  cells: readonly string[];
  size: number;
  durationSeconds?: number;
  onGameEnd?: (result: { score: number; wordsFound: number }) => void;
  difficulty?: Difficulty;
  initialSession?: ActiveGameSession;
  dailyChallengeDate?: string;
}

function AcceptedWordsPanel({
  heading = "Accepted words",
  headingId,
  words,
}: {
  heading?: string;
  headingId: string;
  words: readonly string[];
}) {
  const sortedWords = useMemo(
    () => [...words].sort((first, second) => first.localeCompare(second)),
    [words],
  );

  return (
    <section
      aria-labelledby={headingId}
      className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900"
    >
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="font-bold" id={headingId}>
          {heading}
        </h3>
        <span className="shrink-0 text-xs font-semibold tabular-nums text-slate-500 dark:text-slate-400">
          {sortedWords.length} {sortedWords.length === 1 ? "word" : "words"}
        </span>
      </div>
      {sortedWords.length > 0 ? (
        <ul
          aria-label="Accepted words"
          className="mt-3 grid max-h-40 grid-cols-1 gap-2 overflow-y-auto overscroll-contain pr-1 sm:grid-cols-2"
        >
          {sortedWords.map((word) => {
            const points = scoreWord(word);
            return (
              <li
                className="flex min-w-0 items-center justify-between gap-3 rounded-lg bg-emerald-50 px-3 py-2 text-sm dark:bg-emerald-950/60"
                key={word}
              >
                <span className="min-w-0 truncate font-semibold uppercase text-emerald-900 dark:text-emerald-100">
                  {word}
                </span>
                <span className="shrink-0 font-bold tabular-nums text-emerald-700 dark:text-emerald-300">
                  +{points}{" "}
                  <span className="sr-only">
                    {points === 1 ? "point" : "points"}
                  </span>
                </span>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          No words accepted yet.
        </p>
      )}
    </section>
  );
}

export function PlayGame({
  cells,
  size,
  durationSeconds = 180,
  onGameEnd,
  difficulty,
  initialSession,
  dailyChallengeDate,
}: PlayGameProps) {
  const duration = Math.max(0, Math.floor(durationSeconds));
  const restoredRemainingMs = initialSession
    ? Math.max(0, initialSession.expiresAt - Date.now())
    : duration * 1000;
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
  const submissionsInitialized = useRef(false);
  if (!submissionsInitialized.current) {
    for (const word of initialSession?.foundWords ?? []) {
      submissions.current.submit(word);
    }
    submissionsInitialized.current = true;
  }
  const [foundWords, setFoundWords] = useState<string[]>(initialSession?.foundWords ?? []);
  const [selectedIndexes, setSelectedIndexes] = useState<readonly number[]>([]);
  const [score, setScore] = useState(initialSession?.score ?? 0);
  const [wordsFound, setWordsFound] = useState(initialSession?.foundWords.length ?? 0);
  const [scoreUpdate, setScoreUpdate] = useState({ points: 0, sequence: 0 });
  const [remainingSeconds, setRemainingSeconds] = useState(Math.ceil(restoredRemainingMs / 1000));
  const [pauseReason, setPauseReason] = useState<"manual" | "hidden" | null>(
    null,
  );
  const isPaused = pauseReason !== null;
  const [isGameOver, setIsGameOver] = useState(duration === 0 || restoredRemainingMs === 0);
  const [playerStatistics, setPlayerStatistics] = useState<PlayerStatistics>(
    emptyPlayerStatistics,
  );
  const [shareStatus, setShareStatus] = useState("");
  const scoreRef = useRef(initialSession?.score ?? 0);
  const wordsFoundRef = useRef(initialSession?.foundWords.length ?? 0);
  const foundWordsRef = useRef<string[]>(initialSession?.foundWords ?? []);
  const deadlineRef = useRef(initialSession?.expiresAt ?? 0);
  const remainingMsRef = useRef(restoredRemainingMs);
  const endedRef = useRef(false);

  const endGame = useCallback(() => {
    if (endedRef.current) return;
    endedRef.current = true;
    discardActiveGame(browserStorage);
    remainingMsRef.current = 0;
    setRemainingSeconds(0);
    setIsGameOver(true);
    setSelectedIndexes([]);
    setPlayerStatistics(
      recordCompletedGame(browserStorage, {
        score: scoreRef.current,
        words: foundWordsRef.current,
      }),
    );
    onGameEnd?.({ score: scoreRef.current, wordsFound: wordsFoundRef.current });
  }, [onGameEnd]);

  const replay = () => {
    discardActiveGame(browserStorage);
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
    setSelectedIndexes([]);
    setScoreUpdate({ points: 0, sequence: 0 });
    setRemainingSeconds(duration);
    setPauseReason(null);
    setIsGameOver(duration === 0);
    setShareStatus("");
  };

  const shareGameResult = async () => {
    setShareStatus("");
    try {
      const outcome = await shareResult({
        score,
        wordsFound: foundWords.length,
        dailyChallengeDate,
      });
      setShareStatus(outcome === "shared" ? "Result shared." : "Result copied to clipboard.");
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      setShareStatus("Unable to share this result.");
    }
  };

  useEffect(() => {
    if (duration === 0) {
      endGame();
      return;
    }
    if (isPaused || isGameOver) return;

    if (deadlineRef.current <= Date.now()) {
      deadlineRef.current = Date.now() + remainingMsRef.current;
    }
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

  const persistGame = useCallback(() => {
    if (!difficulty || isGameOver || endedRef.current) return;
    const expiresAt = isPaused
      ? Date.now() + remainingMsRef.current
      : deadlineRef.current;
    saveActiveGame(browserStorage, {
      version: 1,
      difficulty,
      cells: [...cells] as Letter[],
      size,
      foundWords: [...foundWordsRef.current],
      score: scoreRef.current,
      expiresAt,
    });
  }, [cells, difficulty, isGameOver, isPaused, size]);

  useEffect(() => {
    persistGame();
    const handlePageHide = () => persistGame();
    window.addEventListener("pagehide", handlePageHide);
    return () => {
      persistGame();
      window.removeEventListener("pagehide", handlePageHide);
    };
  }, [persistGame]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && !isGameOver) {
        setSelectedIndexes([]);
        setPauseReason("hidden");
      }
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
    queueMicrotask(persistGame);
    return true;
  };

  const selectedWord = selectedIndexes
    .map((index) => cells[index] ?? "")
    .join("");
  const isPotentialWord =
    selectedWord.length > 0 &&
    DEFAULT_PLAYABLE_WORDS.some((word) => word.startsWith(selectedWord));

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

          <AcceptedWordsPanel
            heading="Your words"
            headingId="results-accepted-words-heading"
            words={foundWords}
          />

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

          <div className="grid gap-3 sm:grid-cols-2">
            <button
              className="min-h-12 rounded-xl bg-sky-600 px-5 font-bold text-white shadow-sm transition-colors hover:bg-sky-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600"
              onClick={() => void shareGameResult()}
              type="button"
            >
              Share result
            </button>
            <button
              className="min-h-12 rounded-xl border border-slate-300 bg-white px-5 font-bold shadow-sm transition-colors hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600 dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800"
              onClick={replay}
              type="button"
            >
              Play again
            </button>
          </div>
          {shareStatus ? (
            <p className="text-center text-sm font-medium" role="status">
              {shareStatus}
            </p>
          ) : null}
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
          onClick={() => {
            if (!isPaused) setSelectedIndexes([]);
            setPauseReason(isPaused ? null : "manual");
          }}
          type="button"
        >
          {isPaused ? "Resume" : "Pause"}
        </button>
      </div>
      <div
        aria-atomic="true"
        aria-live="polite"
        className="mb-3 flex min-h-16 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900"
        data-testid="word-preview"
      >
        {selectedWord ? (
          <div>
            <div className="text-2xl font-bold uppercase tracking-[0.16em]">
              {selectedWord}
            </div>
            <div
              className={
                isPotentialWord
                  ? "text-xs font-semibold text-emerald-600 dark:text-emerald-400"
                  : "text-xs font-semibold text-rose-600 dark:text-rose-400"
              }
              data-testid="word-preview-validity"
            >
              {isPotentialWord ? "Potential word" : "Not a valid word"}
            </div>
          </div>
        ) : null}
      </div>
      <div className="relative aspect-square">
        {!isPaused ? (
          <div>
            <Board
              cells={cells}
              disabled={isPaused || isGameOver}
              size={size}
              onSelectionChange={setSelectedIndexes}
              onSelectionComplete={submitPath}
            />
          </div>
        ) : null}
        {isPaused ? (
          <div
            aria-labelledby="pause-heading"
            aria-modal="true"
            className="absolute inset-0 z-20 flex items-center justify-center rounded-xl border border-slate-300 bg-slate-950 p-6 text-center text-white shadow-lg dark:border-slate-700"
            data-testid="pause-overlay"
            role="dialog"
          >
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-300">
                Board hidden
              </p>
              <h2 className="mt-2 text-3xl font-bold" id="pause-heading">
                Game paused
              </h2>
              <p className="mt-3 text-sm text-slate-300">
                {pauseReason === "hidden"
                  ? "The game paused because this tab was hidden."
                  : "You paused the game."}
              </p>
              {pauseReason === "manual" ? (
                <button
                  className="mt-6 min-h-12 rounded-xl bg-sky-600 px-6 font-bold text-white transition-colors hover:bg-sky-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400"
                  onClick={() => setPauseReason(null)}
                  type="button"
                >
                  Resume game
                </button>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>
      <div className="mt-4">
        <AcceptedWordsPanel
          headingId="accepted-words-heading"
          words={foundWords}
        />
      </div>
    </section>
  );
}
