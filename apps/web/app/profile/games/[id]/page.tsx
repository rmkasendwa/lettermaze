"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { z } from "zod";
import { useAccount } from "@/features/account";
import { apiRequest } from "@/lib/api/client";

const gameSchema = z.object({
  id: z.string(),
  score: z.number(),
  wordsFound: z.number(),
  words: z.array(z.string()),
  boardSize: z.number(),
  durationSeconds: z.number(),
  longestWord: z.string(),
  isDaily: z.boolean(),
  puzzleId: z.string().nullable(),
  completedAt: z.string(),
});
type Game = z.infer<typeof gameSchema>;

const dateTime = new Intl.DateTimeFormat(undefined, {
  dateStyle: "long",
  timeStyle: "short",
});

export default function GameResultPage() {
  const { user, loading } = useAccount();
  const { id } = useParams<{ id: string }>();
  const [game, setGame] = useState<Game | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!user || !id) return;
    void apiRequest(`/account/games/${encodeURIComponent(id)}`, gameSchema)
      .then(setGame)
      .catch(() => setFailed(true));
  }, [id, user]);

  if (loading) return <main className="mx-auto max-w-3xl px-4 py-12">Loading result…</main>;
  if (!user) return <main className="mx-auto max-w-3xl px-4 py-12">Log in to inspect saved games.</main>;
  if (failed) return <main className="mx-auto max-w-3xl px-4 py-12">This game result could not be found.</main>;
  if (!game) return <main className="mx-auto max-w-3xl px-4 py-12">Loading result…</main>;

  return (
    <main className="mx-auto max-w-3xl px-4 py-8 sm:py-12">
      <Link className="font-semibold text-violet-700 dark:text-violet-300" href="/profile">
        ← Back to profile
      </Link>
      <header className="mt-6 rounded-2xl bg-gradient-to-br from-violet-700 to-indigo-700 p-6 text-white shadow-xl sm:p-8">
        <p className="text-sm font-semibold uppercase tracking-wider text-violet-200">
          {game.isDaily ? `Daily challenge · ${game.puzzleId}` : "Classic game"}
        </p>
        <h1 className="mt-2 text-4xl font-black tabular-nums">{game.score} points</h1>
        <time className="mt-2 block text-violet-100" dateTime={game.completedAt}>
          {dateTime.format(new Date(game.completedAt))}
        </time>
      </header>
      <dl className="mt-6 grid grid-cols-3 gap-3">
        <ResultStat label="Board" value={`${game.boardSize}×${game.boardSize}`} />
        <ResultStat label="Duration" value={`${Math.floor(game.durationSeconds / 60)}:${String(game.durationSeconds % 60).padStart(2, "0")}`} />
        <ResultStat label="Words" value={game.wordsFound} />
      </dl>
      <section className="mt-8" aria-labelledby="words-heading">
        <h2 className="text-2xl font-bold" id="words-heading">Words found</h2>
        {game.words.length ? (
          <ul className="mt-4 flex flex-wrap gap-2">
            {game.words.map((word) => (
              <li className="rounded-lg bg-emerald-100 px-3 py-2 font-semibold uppercase text-emerald-900 dark:bg-emerald-950 dark:text-emerald-100" key={word}>{word}</li>
            ))}
          </ul>
        ) : <p className="mt-3 text-slate-500">No words were found.</p>}
      </section>
    </main>
  );
}

function ResultStat({ label, value }: { label: string; value: string | number }) {
  return <div className="rounded-xl bg-slate-100 p-4 dark:bg-slate-800"><dt className="text-xs font-semibold uppercase text-slate-500">{label}</dt><dd className="mt-1 text-xl font-bold tabular-nums">{value}</dd></div>;
}
