import type { Metadata } from "next";
import { GameSetup } from "@/features/game";

export const metadata: Metadata = { title: "Play" };

export default function PlayPage() {
  return (
    <div className="play-page mx-auto w-full max-w-6xl px-3 py-2 sm:px-6 sm:py-4">
      <h1 className="sr-only">LetterMaze</h1>
      <GameSetup />
    </div>
  );
}
