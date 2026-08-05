"use client";
import { ErrorState } from "@/components/ui/ErrorState";
export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="p-6">
        <ErrorState
          title="LetterMaze encountered an error"
          description="Please retry. If the problem continues, reload the page."
          onRetry={reset}
        />
      </body>
    </html>
  );
}
