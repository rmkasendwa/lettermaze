"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  createWordDictionary,
  resolveGameConfiguration,
  type GameConfiguration,
  type ScoringRules,
  scoreWord,
  type Letter,
  WordSubmissionTracker,
} from "@lettermaze/game";
import {
  emptyPlayerStatistics,
  getNewPersonalBests,
  getPlayerStatistics,
  recordCompletedGame,
  getLocalDate,
  recordDailyCompletion,
  type PersonalBest,
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
  config: GameConfiguration;
  targetWords?: readonly string[];
  onGameEnd?: (result: { score: number; wordsFound: number }) => void;
  onPlayAgain?: () => void;
  difficulty?: Difficulty;
  initialSession?: ActiveGameSession;
  dailyChallengeDate?: string;
}

type GameEndReason = "completed" | "timed-out";

const BOARD_MAX_SIZE = 608;
const BOARD_EDGE_GUTTER = 12;

function useViewportBoardSize(
  boardRef: React.RefObject<HTMLDivElement | null>,
) {
  const [boardSize, setBoardSize] = useState<number>();

  useLayoutEffect(() => {
    const board = boardRef.current;
    if (!board) return;
    const viewport = window.visualViewport;

    const updateBoardSize = () => {
      const viewportWidth =
        viewport?.width ?? document.documentElement.clientWidth;
      const viewportBottom =
        (viewport?.offsetTop ?? 0) +
        (viewport?.height ?? document.documentElement.clientHeight);
      const boardTop = board.getBoundingClientRect().top;
      const horizontalGutter = window.innerWidth < 640 ? 24 : 48;
      const nextSize = Math.max(
        0,
        Math.floor(
          Math.min(
            BOARD_MAX_SIZE,
            viewportWidth - horizontalGutter,
            viewportBottom - boardTop - BOARD_EDGE_GUTTER,
          ),
        ),
      );

      setBoardSize((currentSize) =>
        currentSize === nextSize ? currentSize : nextSize,
      );
    };

    updateBoardSize();
    window.addEventListener("resize", updateBoardSize);
    viewport?.addEventListener("resize", updateBoardSize);
    viewport?.addEventListener("scroll", updateBoardSize);

    const observer =
      typeof ResizeObserver === "undefined"
        ? undefined
        : new ResizeObserver(updateBoardSize);
    if (board.parentElement) observer?.observe(board.parentElement);

    return () => {
      window.removeEventListener("resize", updateBoardSize);
      viewport?.removeEventListener("resize", updateBoardSize);
      viewport?.removeEventListener("scroll", updateBoardSize);
      observer?.disconnect();
    };
  }, [boardRef]);

  return boardSize;
}

function AcceptedWordsPanel({
  heading = "Accepted words",
  headingId,
  words,
  scoring,
}: {
  scoring: ScoringRules;
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
            const points = scoreWord(word, scoring);
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

function TargetWordsPanel({
  foundWords,
  headingId,
  scoring,
  words,
}: {
  foundWords: readonly string[];
  headingId: string;
  scoring: ScoringRules;
  words: readonly string[];
}) {
  const foundWordSet = new Set(foundWords);
  const remainingCount = words.filter((word) => !foundWordSet.has(word)).length;

  return (
    <section
      aria-labelledby={headingId}
      className="rounded-xl border border-slate-200 bg-white p-2.5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-3"
    >
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-sm font-bold" id={headingId}>
          Find these words
        </h2>
        <span
          className="shrink-0 text-xs font-bold tabular-nums text-sky-700 dark:text-sky-300"
          data-testid="words-remaining"
        >
          {remainingCount} remaining
        </span>
      </div>
      <ul
        aria-label="Target words"
        className="mt-1.5 flex max-h-20 flex-wrap gap-1 overflow-y-auto overscroll-contain sm:mt-2 sm:max-h-28 sm:gap-1.5"
      >
        {words.map((word) => {
          const isFound = foundWordSet.has(word);
          return (
            <li
              aria-label={`${word}, ${isFound ? "found" : "not found"}`}
              className={
                isFound
                  ? "flex gap-1 rounded-md bg-emerald-100 px-1.5 py-0.5 text-xs font-bold uppercase text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200 sm:px-2 sm:py-1 sm:text-sm"
                  : "flex gap-1 rounded-md bg-sky-100 px-1.5 py-0.5 text-xs font-bold uppercase text-sky-900 dark:bg-sky-950 dark:text-sky-100 sm:px-2 sm:py-1 sm:text-sm"
              }
              data-found={isFound}
              key={word}
            >
              <span
                className={isFound ? "line-through decoration-2" : undefined}
              >
                {word}
              </span>
              <span aria-hidden="true" className="opacity-60">
                +{scoreWord(word, scoring)}
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export function PlayGame({
  cells,
  targetWords,
  config,
  onGameEnd,
  onPlayAgain,
  difficulty,
  initialSession,
  dailyChallengeDate,
}: PlayGameProps) {
  const boardContainerRef = useRef<HTMLDivElement>(null);
  const viewportBoardSize = useViewportBoardSize(boardContainerRef);
  const rules = useMemo(() => resolveGameConfiguration(config), [config]);
  const size = rules.boardSize;
  const puzzleTargetWords = targetWords ?? rules.words;
  const duration = rules.durationSeconds;
  const restoredRemainingMs = duration * 1000;
  const [submissions] = useState(() => {
    const tracker = new WordSubmissionTracker(
      createWordDictionary(puzzleTargetWords),
    );
    for (const word of initialSession?.foundWords ?? []) {
      tracker.submit(word);
    }
    return tracker;
  });
  const [foundWords, setFoundWords] = useState<string[]>(
    initialSession?.foundWords ?? [],
  );
  const [selectedIndexes, setSelectedIndexes] = useState<readonly number[]>([]);
  const [score, setScore] = useState(initialSession?.score ?? 0);
  const [wordsFound, setWordsFound] = useState(
    initialSession?.foundWords.length ?? 0,
  );
  const [scoreUpdate, setScoreUpdate] = useState({ points: 0, sequence: 0 });
  const [remainingSeconds, setRemainingSeconds] = useState(
    Math.ceil(restoredRemainingMs / 1000),
  );
  const [pauseReason, setPauseReason] = useState<"manual" | "hidden" | null>(
    null,
  );
  const isPaused = pauseReason !== null;
  const [isGameOver, setIsGameOver] = useState(false);
  const [endReason, setEndReason] = useState<GameEndReason | null>(null);
  const [completionSeconds, setCompletionSeconds] = useState(0);
  const [playerStatistics, setPlayerStatistics] = useState<PlayerStatistics>(
    emptyPlayerStatistics,
  );
  const [shareStatus, setShareStatus] = useState("");
  const [newPersonalBests, setNewPersonalBests] = useState<PersonalBest[]>([]);
  const scoreRef = useRef(initialSession?.score ?? 0);
  const wordsFoundRef = useRef(initialSession?.foundWords.length ?? 0);
  const foundWordsRef = useRef<string[]>(initialSession?.foundWords ?? []);
  const deadlineRef = useRef(initialSession?.expiresAt ?? 0);
  const remainingMsRef = useRef(restoredRemainingMs);
  const endedRef = useRef(false);

  const endGame = useCallback(
    (reason: GameEndReason = "timed-out") => {
      if (endedRef.current) return;
      endedRef.current = true;
      setCompletionSeconds(
        Math.min(
          duration,
          Math.max(0, duration - Math.ceil(remainingMsRef.current / 1000)),
        ),
      );
      discardActiveGame(browserStorage);
      remainingMsRef.current = 0;
      setRemainingSeconds(0);
      setIsGameOver(true);
      setEndReason(reason);
      setSelectedIndexes([]);
      const result = {
        score: scoreRef.current,
        words: foundWordsRef.current,
        isDaily: Boolean(dailyChallengeDate),
      };
      const localDate = getLocalDate();
      if (dailyChallengeDate) recordDailyCompletion(browserStorage, localDate);
      const currentStatistics = getPlayerStatistics(browserStorage);
      setNewPersonalBests(getNewPersonalBests(currentStatistics, result));
      setPlayerStatistics(recordCompletedGame(browserStorage, result));
      window.dispatchEvent(
        new CustomEvent("lettermaze:game-completed", {
          detail: {
            ranked: rules.ranked,
            mode: rules.mode,
            score: scoreRef.current,
            words: foundWordsRef.current,
            boardSize: size,
            durationSeconds: duration,
            puzzleId: dailyChallengeDate,
            localDate: dailyChallengeDate ? localDate : undefined,
          },
        }),
      );
      onGameEnd?.({
        score: scoreRef.current,
        wordsFound: wordsFoundRef.current,
      });
    },
    [dailyChallengeDate, duration, onGameEnd, size, rules.ranked, rules.mode],
  );

  const replay = () => {
    discardActiveGame(browserStorage);
    submissions.reset();
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
    setIsGameOver(false);
    setEndReason(null);
    setCompletionSeconds(0);
    setShareStatus("");
    setNewPersonalBests([]);
  };

  const shareGameResult = async () => {
    setShareStatus("");
    try {
      const outcome = await shareResult({
        score,
        wordsFound: foundWords.length,
        dailyChallengeDate,
      });
      setShareStatus(
        outcome === "shared" ? "Result shared." : "Result copied to clipboard.",
      );
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      setShareStatus("Unable to share this result.");
    }
  };

  useEffect(() => {
    if (duration === 0) {
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
      if (remainingMs === 0) endGame("timed-out");
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
      config: rules,
      difficulty,
      cells: [...cells] as Letter[],
      size,
      targetWords: [...puzzleTargetWords],
      foundWords: [...foundWordsRef.current],
      score: scoreRef.current,
      expiresAt,
    });
  }, [cells, difficulty, isGameOver, isPaused, size, puzzleTargetWords, rules]);

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
    const acceptedWord = submissions.submit(word);
    if (!acceptedWord) return false;

    const points = scoreWord(acceptedWord, rules.scoring);
    scoreRef.current += points;
    wordsFoundRef.current = submissions.size;
    foundWordsRef.current = [...foundWordsRef.current, acceptedWord];
    setScore(scoreRef.current);
    setWordsFound(wordsFoundRef.current);
    setFoundWords((words) => [...words, acceptedWord]);
    setScoreUpdate((update) => ({ points, sequence: update.sequence + 1 }));
    queueMicrotask(persistGame);
    if (
      rules.endOnAllWordsFound &&
      wordsFoundRef.current === puzzleTargetWords.length
    )
      queueMicrotask(() => endGame("completed"));
    return true;
  };

  const selectedWord = selectedIndexes
    .map((index) => cells[index] ?? "")
    .join("");
  const isPotentialWord =
    selectedWord.length > 0 &&
    puzzleTargetWords.some((word) => word.startsWith(selectedWord));

  if (isGameOver) {
    const longestWord = foundWords.reduce(
      (longest, word) => (word.length > longest.length ? word : longest),
      "",
    );
    const missedWords = puzzleTargetWords.filter(
      (word) => !foundWords.includes(word),
    );

    return (
      <section
        aria-labelledby="results-heading"
        className="w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-900"
      >
        <div className="bg-gradient-to-br from-sky-600 to-indigo-700 px-6 py-8 text-center text-white sm:px-10">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-100">
            {endReason === "completed" ? "Puzzle complete" : "Time's up"}
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
          {newPersonalBests.length > 0 ? (
            <div
              aria-live="polite"
              className="personal-best-celebration rounded-2xl border border-amber-300 bg-amber-50 p-5 text-center text-amber-950 shadow-sm dark:border-amber-700 dark:bg-amber-950 dark:text-amber-100"
              data-testid="personal-best-celebration"
              role="status"
            >
              <p className="text-3xl" aria-hidden="true">
                🏆
              </p>
              <h3 className="mt-1 text-xl font-black">New personal best!</h3>
              <ul className="mt-2 space-y-1 text-sm font-semibold">
                {newPersonalBests.map((record) => (
                  <li key={record}>
                    {record === "highestScore" && `Highest score: ${score}`}
                    {record === "mostWordsFound" &&
                      `Most words in one game: ${foundWords.length}`}
                    {record === "longestWord" && `Longest word: ${longestWord}`}
                    {record === "bestDailyScore" &&
                      `Best daily challenge: ${score} points`}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <div className="rounded-xl bg-slate-100 p-4 dark:bg-slate-800">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Words found
              </p>
              <p
                className="mt-1 text-2xl font-bold tabular-nums"
                data-testid="results-words-found"
              >
                {foundWords.length} / {puzzleTargetWords.length}
              </p>
            </div>
            <div className="rounded-xl bg-slate-100 p-4 dark:bg-slate-800">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Completion time
              </p>
              <p
                className="mt-1 text-2xl font-bold tabular-nums"
                data-testid="results-completion-time"
              >
                {Math.floor(completionSeconds / 60)}:
                {String(completionSeconds % 60).padStart(2, "0")}
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
                ["Most words", playerStatistics.mostWordsFound],
                ["Longest word", playerStatistics.longestWord || "—"],
                ["Best daily", playerStatistics.bestDailyScore],
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
            scoring={rules.scoring}
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
              onClick={onPlayAgain ?? replay}
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
      <div className="game-primary mx-auto w-fit max-w-full">
        <div
          className="game-board-column flex min-w-0 flex-col gap-2"
          style={
            viewportBoardSize === undefined
              ? undefined
              : { width: `${viewportBoardSize}px` }
          }
        >
          <div
            className="grid grid-cols-[1fr_1fr_1fr_auto] items-stretch overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900"
            aria-label="Game status and controls"
            aria-live="polite"
          >
            <div className="px-2 py-1.5 text-center sm:py-2">
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Time
              </div>
              <div
                className="text-lg font-bold tabular-nums sm:text-xl"
                data-testid="timer"
              >
                {duration === 0 ? (
                  <span aria-label="Unlimited time">∞</span>
                ) : (
                  <>
                    {Math.floor(remainingSeconds / 60)}:
                    {String(remainingSeconds % 60).padStart(2, "0")}
                  </>
                )}
              </div>
            </div>
            <div className="border-l border-slate-200 px-2 py-1.5 text-center dark:border-slate-800 sm:py-2">
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Score
              </div>
              <div
                className="relative text-lg font-bold tabular-nums sm:text-xl"
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
            <div className="border-l border-slate-200 px-2 py-1.5 text-center dark:border-slate-800 sm:py-2">
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Words found
              </div>
              <div
                aria-label={`${wordsFound} of ${puzzleTargetWords.length} words found`}
                aria-valuemax={puzzleTargetWords.length}
                aria-valuemin={0}
                aria-valuenow={wordsFound}
                className="text-lg font-bold tabular-nums sm:text-xl"
                data-testid="words-found"
                role="progressbar"
              >
                {wordsFound} / {puzzleTargetWords.length}
              </div>
            </div>
            <button
              aria-label={isPaused ? "Resume" : "Pause"}
              className="min-w-16 border-l border-slate-200 px-3 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-100 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800"
              onClick={() => {
                if (!isPaused) setSelectedIndexes([]);
                setPauseReason(isPaused ? null : "manual");
              }}
              type="button"
            >
              {isPaused ? "Resume" : "Pause"}
            </button>
          </div>
          <TargetWordsPanel
            foundWords={foundWords}
            headingId="target-words-heading"
            scoring={rules.scoring}
            words={puzzleTargetWords}
          />
          <div
            aria-atomic="true"
            aria-live="polite"
            className="flex min-h-8 items-center justify-center px-3 text-center"
            data-testid="word-preview"
          >
            {selectedWord ? (
              <div>
                <div className="text-base font-bold uppercase tracking-[0.16em]">
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
          <div
            className="game-board relative aspect-square w-full"
            ref={boardContainerRef}
          >
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
        </div>
      </div>
      <div className="game-secondary mx-auto mt-8 max-w-xl">
        <AcceptedWordsPanel
          scoring={rules.scoring}
          headingId="accepted-words-heading"
          words={foundWords}
        />
      </div>
    </section>
  );
}
