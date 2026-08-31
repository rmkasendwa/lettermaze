"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { leaderboardSchema, type Leaderboard } from "@lettermaze/contracts";
import {
  generateDailyBoard,
  getNextUtcPuzzleAt,
  getUtcPuzzleId,
} from "@lettermaze/game";
import { apiRequest } from "@/lib/api/client";
import { browserStorage } from "@/lib/storage";
import { PlayGame } from "@/features/game";
import { getDailyStreak, getLocalDate } from "@/features/player";
import { useAccount } from "@/features/account";
import { z } from "zod";

const acceptedSchema = z.object({ accepted: z.literal(true) });
const streakSchema = z.object({ current: z.number(), longest: z.number() });

function formatCountdown(milliseconds: number): string {
  const seconds = Math.max(0, Math.ceil(milliseconds / 1000));
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
}

export function DailyChallenge({ puzzleId }: { puzzleId: string }) {
  const { user } = useAccount();
  const board = useMemo(() => generateDailyBoard(puzzleId), [puzzleId]);
  const attemptKey = `daily-attempt:${puzzleId}`;
  const [rankedAttemptUsed, setRankedAttemptUsed] = useState(false);
  const [submissionStatus, setSubmissionStatus] = useState("");
  const [leaderboard, setLeaderboard] = useState<Leaderboard | null>(null);
  const [streak, setStreak] = useState({ current: 0, longest: 0 });
  // Keep the server and first client render identical. The live value is filled
  // in after hydration, when both calculations use the browser's clock.
  const [untilNext, setUntilNext] = useState<number | null>(null);

  const loadLeaderboard = useCallback(
    async (playerId?: string) => {
      const query = playerId ? `?playerId=${encodeURIComponent(playerId)}` : "";
      const result = await apiRequest(
        `/leaderboards/${puzzleId}${query}`,
        leaderboardSchema,
      );
      setLeaderboard(result);
    },
    [puzzleId],
  );

  useEffect(() => {
    const hydrationTimer = window.setTimeout(() => {
      setRankedAttemptUsed(browserStorage.get(attemptKey) === true);
      setStreak(getDailyStreak(browserStorage));
      void loadLeaderboard(
        browserStorage.get<string>("daily-player-id") ?? undefined,
      ).catch(() => setLeaderboard(null));
    }, 0);
    return () => window.clearTimeout(hydrationTimer);
  }, [attemptKey, loadLeaderboard]);

  useEffect(() => {
    if (!user) return;
    const localDate = getLocalDate();
    void apiRequest(
      `/account/streak?localDate=${encodeURIComponent(localDate)}`,
      streakSchema,
    )
      .then((remote) =>
        setStreak((local) => ({
          current: Math.max(local.current, remote.current),
          longest: Math.max(local.longest, remote.longest),
        })),
      )
      .catch(() => undefined);
  }, [user]);

  useEffect(() => {
    const update = () => {
      if (getUtcPuzzleId() !== puzzleId) {
        window.location.reload();
        return;
      }
      setUntilNext(getNextUtcPuzzleAt().getTime() - Date.now());
    };
    const timer = window.setInterval(update, 1000);
    update();
    return () => window.clearInterval(timer);
  }, [puzzleId]);

  const finish = useCallback(
    async (result: { score: number; wordsFound: number }) => {
      setStreak(getDailyStreak(browserStorage));
      if (browserStorage.get(attemptKey) === true) {
        setSubmissionStatus("Replay complete — rankings are unchanged.");
        return;
      }

      browserStorage.set(attemptKey, true);
      setRankedAttemptUsed(true);
      let playerId = browserStorage.get<string>("daily-player-id");
      if (!playerId) {
        playerId = crypto.randomUUID();
        browserStorage.set("daily-player-id", playerId);
      }
      try {
        await apiRequest("/leaderboards", acceptedSchema, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ puzzleId, playerId, ...result }),
        });
        setSubmissionStatus("Your first attempt is on today's leaderboard.");
        await loadLeaderboard(playerId);
      } catch {
        setSubmissionStatus(
          "Your ranked attempt was saved locally; the leaderboard is unavailable.",
        );
      }
    },
    [attemptKey, loadLeaderboard, puzzleId],
  );

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col items-center px-4 py-6 sm:px-6 sm:py-10">
      <div className="mb-5 w-full text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-sky-700 dark:text-sky-300">
          Daily puzzle · {puzzleId} UTC
        </p>
        <h1 className="mt-1 text-3xl font-bold">LetterMaze Daily</h1>
        <div
          className="mt-3 flex justify-center gap-3"
          aria-label="Daily streak progress"
        >
          <span className="rounded-full bg-orange-100 px-4 py-1.5 text-sm font-bold text-orange-800 dark:bg-orange-950 dark:text-orange-200">
            🔥 {streak.current} day current streak
          </span>
          <span className="rounded-full bg-violet-100 px-4 py-1.5 text-sm font-bold text-violet-800 dark:bg-violet-950 dark:text-violet-200">
            Best: {streak.longest} days
          </span>
        </div>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
          Next puzzle in{" "}
          <span
            className="font-bold tabular-nums"
            data-testid="daily-countdown"
          >
            {untilNext === null ? "--:--:--" : formatCountdown(untilNext)}
          </span>
          {leaderboard == null
            ? ""
            : ` · ${leaderboard.totalPlayers} ranked player${leaderboard.totalPlayers === 1 ? "" : "s"}`}
        </p>
        {rankedAttemptUsed ? (
          <p className="mt-1 text-sm font-medium text-amber-700 dark:text-amber-300">
            You have used today&apos;s ranked attempt. Replays are for practice.
          </p>
        ) : null}
        {submissionStatus ? (
          <p className="mt-1 text-sm" role="status">
            {submissionStatus}
          </p>
        ) : null}
      </div>
      <div className="w-full max-w-[min(42rem,calc(100dvh-8rem))]">
        <PlayGame
          cells={board.cells}
          targetWords={board.targetWords}
          dailyChallengeDate={puzzleId}
          size={board.size}
          onGameEnd={finish}
        />
      </div>
      <LeaderboardPanel leaderboard={leaderboard} />
    </main>
  );
}

function LeaderboardPanel({
  leaderboard,
}: {
  leaderboard: Leaderboard | null;
}) {
  const currentIsInTop = leaderboard?.currentPlayer
    ? leaderboard.entries.some(
        (entry) => entry.rank === leaderboard.currentPlayer?.rank,
      )
    : false;

  return (
    <section
      aria-labelledby="leaderboard-heading"
      className="mt-8 w-full max-w-[42rem] rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900"
    >
      <div className="flex items-baseline justify-between gap-4">
        <h2 className="text-xl font-bold" id="leaderboard-heading">
          Today&apos;s leaderboard
        </h2>
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          Top 10
        </span>
      </div>
      {leaderboard === null ? (
        <p className="mt-4 text-sm text-slate-500">Leaderboard unavailable.</p>
      ) : leaderboard.entries.length === 0 ? (
        <p className="mt-4 text-sm text-slate-500">
          Finish today&apos;s puzzle to set the first score.
        </p>
      ) : (
        <ol className="mt-4 space-y-2" aria-label="Top players">
          {leaderboard.entries.map((entry) => {
            const isCurrent = entry.rank === leaderboard.currentPlayer?.rank;
            return (
              <LeaderboardRow
                entry={entry}
                isCurrent={isCurrent}
                key={`${entry.rank}-${entry.playerLabel}`}
              />
            );
          })}
        </ol>
      )}
      {leaderboard?.currentPlayer && !currentIsInTop ? (
        <div className="mt-3 border-t border-dashed border-slate-300 pt-3 dark:border-slate-700">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
            Your position
          </p>
          <LeaderboardRow entry={leaderboard.currentPlayer} isCurrent />
        </div>
      ) : null}
    </section>
  );
}

function LeaderboardRow({
  entry,
  isCurrent,
}: {
  entry: Leaderboard["entries"][number];
  isCurrent: boolean;
}) {
  return (
    <li
      className={`grid grid-cols-[3rem_1fr_auto] items-center gap-3 rounded-xl px-3 py-2 ${isCurrent ? "bg-sky-100 ring-1 ring-sky-300 dark:bg-sky-950 dark:ring-sky-700" : "bg-slate-50 dark:bg-slate-800"}`}
    >
      <span className="font-bold tabular-nums">#{entry.rank}</span>
      <span className="min-w-0 truncate font-semibold">
        {isCurrent ? "You" : entry.playerLabel}
      </span>
      <span className="text-right">
        <strong className="tabular-nums">{entry.score}</strong>
        <span className="ml-2 text-xs text-slate-500">
          {entry.wordsFound} words
        </span>
      </span>
    </li>
  );
}
