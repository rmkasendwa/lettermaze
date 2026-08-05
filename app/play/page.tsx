import type { Metadata } from "next";
import { EmptyState } from "@/components/ui/EmptyState";
export const metadata: Metadata = { title: "Play" };
export default function PlayPage() {
  return (
    <EmptyState
      title="Play LetterMaze"
      description="The LetterMaze game board will be implemented next."
    />
  );
}
