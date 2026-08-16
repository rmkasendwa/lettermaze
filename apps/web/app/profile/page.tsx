"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { z } from "zod";
import { useAccount } from "@/features/account";
import { apiRequest } from "@/lib/api/client";

const statisticsSchema = z.object({
  gamesPlayed: z.number(),
  totalWordsFound: z.number(),
  highestScore: z.number(),
  mostWordsFound: z.number(),
  longestWord: z.string(),
  bestDailyScore: z.number(),
  averageScore: z.number(),
  totalScore: z.number(),
});
const profileSchema = z.object({
  user: z.object({
    id: z.string(),
    name: z.string().nullable(),
    email: z.string().nullable(),
    createdAt: z.string(),
  }),
  statistics: statisticsSchema,
  dailyStatistics: z.object({
    gamesPlayed: z.number(),
    totalScore: z.number(),
    totalWordsFound: z.number(),
    highestScore: z.number(),
    averageScore: z.number(),
  }),
  recentGames: z.array(
    z.object({
      id: z.string(),
      score: z.number(),
      wordsFound: z.number(),
      longestWord: z.string(),
      isDaily: z.boolean(),
      puzzleId: z.string().nullable(),
      completedAt: z.string(),
    }),
  ),
});
type Profile = z.infer<typeof profileSchema>;
const gameSummarySchema = z.object({
  id: z.string(),
  score: z.number(),
  wordsFound: z.number(),
  boardSize: z.number(),
  durationSeconds: z.number(),
  longestWord: z.string(),
  isDaily: z.boolean(),
  puzzleId: z.string().nullable(),
  completedAt: z.string(),
});
const gamesPageSchema = z.object({
  items: z.array(gameSummarySchema),
  nextCursor: z.string().nullable(),
});
type GameSummary = z.infer<typeof gameSummarySchema>;

const number = new Intl.NumberFormat();
const date = new Intl.DateTimeFormat(undefined, { dateStyle: "medium" });
const dateTime = new Intl.DateTimeFormat(undefined, {
  dateStyle: "medium",
  timeStyle: "short",
});

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl bg-slate-100 p-4 dark:bg-slate-800">
      <dt className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
        {label}
      </dt>
      <dd className="mt-1 truncate text-2xl font-bold tabular-nums">{value}</dd>
    </div>
  );
}

export default function ProfilePage() {
  const { user, loading } = useAccount();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [failed, setFailed] = useState(false);
  const [games, setGames] = useState<GameSummary[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    if (!user) return;
    void Promise.all([
      apiRequest("/account/profile", profileSchema),
      apiRequest("/account/games?limit=10", gamesPageSchema),
    ])
      .then(([loadedProfile, page]) => {
        setProfile(loadedProfile);
        setGames(page.items);
        setNextCursor(page.nextCursor);
      })
      .catch(() => setFailed(true));
  }, [user]);

  const loadMore = async () => {
    if (!nextCursor || loadingMore) return;
    setLoadingMore(true);
    try {
      const page = await apiRequest(
        `/account/games?limit=10&cursor=${encodeURIComponent(nextCursor)}`,
        gamesPageSchema,
      );
      setGames((current) => [...current, ...page.items]);
      setNextCursor(page.nextCursor);
    } finally {
      setLoadingMore(false);
    }
  };

  if (loading) {
    return (
      <main className="mx-auto max-w-5xl px-4 py-12">Loading profile…</main>
    );
  }
  if (!user) {
    return (
      <main className="mx-auto max-w-lg px-4 py-16 text-center">
        <h1 className="text-3xl font-bold">Your player profile</h1>
        <p className="mt-3 text-slate-600 dark:text-slate-300">
          Log in to view your saved statistics, personal bests, and game
          history.
        </p>
        <Link
          className="mt-6 inline-flex rounded-xl bg-violet-600 px-6 py-3 font-bold text-white"
          href="/account"
        >
          Log in or create an account
        </Link>
      </main>
    );
  }
  if (failed) {
    return (
      <main className="mx-auto max-w-5xl px-4 py-12">
        Unable to load your profile.
      </main>
    );
  }
  if (!profile) {
    return (
      <main className="mx-auto max-w-5xl px-4 py-12">Loading profile…</main>
    );
  }

  const { statistics, dailyStatistics } = profile;
  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
      <header className="rounded-2xl bg-gradient-to-br from-violet-700 to-indigo-700 p-6 text-white shadow-xl sm:p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-violet-200">
          Player profile
        </p>
        <h1 className="mt-2 text-3xl font-black sm:text-4xl">
          {profile.user.name || "LetterMaze player"}
        </h1>
        <p className="mt-2 text-violet-100">{profile.user.email}</p>
        <p className="mt-1 text-sm text-violet-200">
          Playing since {date.format(new Date(profile.user.createdAt))}
        </p>
      </header>

      <section className="mt-8" aria-labelledby="lifetime-heading">
        <h2 className="text-2xl font-bold" id="lifetime-heading">
          Lifetime statistics
        </h2>
        <dl className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Stat
            label="Games played"
            value={number.format(statistics.gamesPlayed)}
          />
          <Stat
            label="Total score"
            value={number.format(statistics.totalScore)}
          />
          <Stat
            label="Words found"
            value={number.format(statistics.totalWordsFound)}
          />
          <Stat
            label="Average score"
            value={statistics.averageScore.toFixed(1)}
          />
        </dl>
      </section>

      <div className="mt-8 grid gap-8 lg:grid-cols-2">
        <section aria-labelledby="daily-stats-heading">
          <h2 className="text-2xl font-bold" id="daily-stats-heading">
            Daily challenge
          </h2>
          <dl className="mt-4 grid grid-cols-2 gap-3">
            <Stat
              label="Challenges completed"
              value={dailyStatistics.gamesPlayed}
            />
            <Stat label="Best score" value={dailyStatistics.highestScore} />
            <Stat
              label="Average score"
              value={dailyStatistics.averageScore.toFixed(1)}
            />
            <Stat label="Words found" value={dailyStatistics.totalWordsFound} />
          </dl>
        </section>
        <section aria-labelledby="bests-heading">
          <h2 className="text-2xl font-bold" id="bests-heading">
            Personal bests
          </h2>
          <dl className="mt-4 grid grid-cols-2 gap-3">
            <Stat label="Highest score" value={statistics.highestScore} />
            <Stat
              label="Most words in one game"
              value={statistics.mostWordsFound}
            />
            <Stat
              label="Longest word"
              value={statistics.longestWord.toUpperCase() || "—"}
            />
            <Stat
              label="Best daily challenge"
              value={statistics.bestDailyScore}
            />
          </dl>
        </section>
      </div>

      <section className="mt-8" aria-labelledby="recent-heading">
        <div className="flex items-baseline justify-between gap-4">
          <h2 className="text-2xl font-bold" id="recent-heading">
            Recent games
          </h2>
          <span className="text-sm text-slate-500">Newest first</span>
        </div>
        {games.length === 0 ? (
          <p className="mt-4 rounded-xl border border-dashed p-8 text-center text-slate-500">
            Complete a game to start your history.
          </p>
        ) : (
          <ol className="mt-4 space-y-3">
            {games.map((game) => (
              <li
                className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900"
                key={game.id}
              >
                <Link
                  className="grid gap-3 rounded-xl p-4 transition hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-violet-600 dark:hover:bg-slate-800 sm:grid-cols-[1fr_auto_auto] sm:items-center"
                  href={`/profile/games/${game.id}`}
                >
                  <div>
                    <p className="font-bold">
                      {game.isDaily
                        ? `Daily challenge · ${game.puzzleId}`
                        : "Classic game"}
                    </p>
                    <time
                      className="text-sm text-slate-500"
                      dateTime={game.completedAt}
                    >
                      {dateTime.format(new Date(game.completedAt))}
                    </time>
                  </div>
                  <p>
                    <strong className="text-xl tabular-nums">
                      {game.score}
                    </strong>{" "}
                    <span className="text-sm text-slate-500">points</span>
                  </p>
                  <p className="text-sm">
                    <strong>{game.wordsFound}</strong> words
                    {` · ${game.boardSize}×${game.boardSize} · ${Math.floor(game.durationSeconds / 60)}:${String(game.durationSeconds % 60).padStart(2, "0")}`}
                  </p>
                </Link>
              </li>
            ))}
          </ol>
        )}
        {nextCursor ? (
          <button
            className="mt-4 rounded-xl border border-slate-300 px-5 py-2.5 font-semibold hover:bg-slate-100 disabled:opacity-60 dark:border-slate-700 dark:hover:bg-slate-800"
            disabled={loadingMore}
            onClick={() => void loadMore()}
            type="button"
          >
            {loadingMore ? "Loading…" : "Load more games"}
          </button>
        ) : null}
      </section>
    </main>
  );
}
