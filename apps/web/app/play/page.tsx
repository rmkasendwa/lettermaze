import type { Metadata } from "next";
import { GameSetup } from "@/features/game";

export const metadata: Metadata = { title: "Play" };

export default function PlayPage() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col items-center px-4 py-6 sm:px-6 sm:py-10">
      <h1 className="mb-4 text-2xl font-bold sm:text-3xl">LetterMaze</h1>
      <div className="w-full max-w-[min(42rem,calc(100dvh-8rem))]">
        <GameSetup />
      </div>
    </main>
  );
}
