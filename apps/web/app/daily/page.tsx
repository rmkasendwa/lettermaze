import type { Metadata } from "next";
import { EmptyState } from "@/components/ui/EmptyState";
export const metadata: Metadata = { title: "Daily Challenge" };
export default function DailyPage() {
  return (
    <EmptyState
      title="Daily Challenge"
      description="Daily challenges will be implemented in a future milestone."
    />
  );
}
