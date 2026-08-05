import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";
import { VisuallyHidden } from "./VisuallyHidden";

export function Spinner({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      role="status"
      className={cn(
        "h-6 w-6 animate-spin rounded-full border-2 border-slate-300 border-t-violet-600",
        className,
      )}
      {...props}
    >
      <VisuallyHidden>Loading</VisuallyHidden>
    </div>
  );
}
