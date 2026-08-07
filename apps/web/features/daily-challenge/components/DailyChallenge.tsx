"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { leaderboardSchema } from "@lettermaze/contracts";
import { generateDailyBoard, getNextUtcPuzzleAt, getUtcPuzzleId } from "@lettermaze/game";
import { apiRequest } from "@/lib/api/client";
import { browserStorage } from "@/lib/storage";
import { PlayGame } from "@/features/game";
import { z } from "zod";

const acceptedSchema = z.object({ accepted: z.literal(true) });

function formatCountdown(milliseconds: number): string {
  const seconds = Math.max(0, Math.ceil(milliseconds / 1000));
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
}

export function DailyChallenge({ puzzleId }: { puzzleId: string }) {
  const board = useMemo(() => generateDailyBoard(puzzleId), [puzzleId]);
  const attemptKey = `daily-attempt:${puzzleId}`;
  const [rankedAttemptUsed, setRankedAttemptUsed] = useState(false);
  const [submissionStatus, setSubmissionStatus] = useState("");
  const [leaderCount, setLeaderCount] = useState<number | null>(null);
  const [untilNext, setUntilNext] = useState(() => getNextUtcPuzzleAt().getTime() - Date.now());

  useEffect(() => {
    const hydrationTimer = window.setTimeout(
      () => setRankedAttemptUsed(browserStorage.get(attemptKey) === true),
      0,
    );
    void apiRequest(`/leaderboards/${puzzleId}`, leaderboardSchema)
      .then((leaderboard) => setLeaderCount(leaderboard.entries.length))
      .catch(() => setLeaderCount(null));
    return () => window.clearTimeout(hydrationTimer);
  }, [attemptKey, puzzleId]);

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

  const finish = useCallback(async (result: { score: number; wordsFound: number }) => {
    if (browserStorage.get(attemptKey) === true) {
      setSubmissionStatus("Replay complete — rankings are unchanged.");
      return;
    }

    // Claim the ranked attempt before the request; retries and replays can never
    // accidentally replace a player's original result.
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
      setLeaderCount((count) => (count == null ? 1 : count + 1));
    } catch {
      setSubmissionStatus("Your ranked attempt was saved locally; the leaderboard is unavailable.");
    }
  }, [attemptKey, puzzleId]);

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col items-center px-4 py-6 sm:px-6 sm:py-10">
      <div className="mb-5 w-full text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-sky-700 dark:text-sky-300">Daily puzzle · {puzzleId} UTC</p>
        <h1 className="mt-1 text-3xl font-bold">LetterMaze Daily</h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
          Next puzzle in <span className="font-bold tabular-nums" data-testid="daily-countdown">{formatCountdown(untilNext)}</span>
          {leaderCount == null ? "" : ` · ${leaderCount} ranked player${leaderCount === 1 ? "" : "s"}`}
        </p>
        {rankedAttemptUsed ? <p className="mt-1 text-sm font-medium text-amber-700 dark:text-amber-300">You have used today&apos;s ranked attempt. Replays are for practice.</p> : null}
        {submissionStatus ? <p className="mt-1 text-sm" role="status">{submissionStatus}</p> : null}
      </div>
      <div className="w-full max-w-[min(42rem,calc(100dvh-8rem))]">
        <PlayGame cells={board.cells} size={board.size} onGameEnd={finish} />
      </div>
    </main>
  );
}
