import type { Metadata } from "next";
import { getUtcPuzzleId } from "@lettermaze/game";
import { DailyChallenge } from "@/features/daily-challenge";
export const metadata: Metadata = { title: "Daily Challenge" };
export const dynamic = "force-dynamic";
export default async function DailyPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const today = getUtcPuzzleId();
  const requestedDate = (await searchParams).date;
  const puzzleId =
    requestedDate &&
    /^\d{4}-\d{2}-\d{2}$/.test(requestedDate) &&
    requestedDate < today &&
    getUtcPuzzleId(new Date(`${requestedDate}T00:00:00Z`)) === requestedDate
      ? requestedDate
      : today;
  return <DailyChallenge puzzleId={puzzleId} />;
}
