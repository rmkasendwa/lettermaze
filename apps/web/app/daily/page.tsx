import type { Metadata } from "next";
import { getUtcPuzzleId } from "@lettermaze/game";
import { DailyChallenge } from "@/features/daily-challenge";
export const metadata: Metadata = { title: "Daily Challenge" };
export const dynamic = "force-dynamic";
export default function DailyPage() {
  return <DailyChallenge puzzleId={getUtcPuzzleId()} />;
}
