import type { Metadata } from "next";
import { PracticeGame } from "@/features/game/components/PracticeGame";

export const metadata: Metadata = { title: "Practice" };

export default function PracticePage() {
  return <PracticeGame />;
}
