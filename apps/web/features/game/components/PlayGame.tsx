"use client";

import { useRef, useState } from "react";
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
}

export function PlayGame({ cells, size }: PlayGameProps) {
  const submissions = useRef(
    new WordSubmissionTracker(createWordDictionary(DEFAULT_PLAYABLE_WORDS)),
  );
  const [score, setScore] = useState(0);
  const [wordsFound, setWordsFound] = useState(0);
  const [scoreUpdate, setScoreUpdate] = useState({ points: 0, sequence: 0 });

  const submitPath = (indexes: readonly number[]) => {
    const word = indexes.map((index) => cells[index] ?? "").join("");
    const acceptedWord = submissions.current.submit(word);
    if (!acceptedWord) return;

    const points = scoreWord(acceptedWord);
    setScore((total) => total + points);
    setWordsFound(submissions.current.size);
    setScoreUpdate((update) => ({ points, sequence: update.sequence + 1 }));
  };

  return (
    <section aria-label="Current game" className="w-full">
      <div className="mb-4 grid grid-cols-2 gap-3" aria-live="polite">
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
      <Board cells={cells} size={size} onSelectionComplete={submitPath} />
    </section>
  );
}
