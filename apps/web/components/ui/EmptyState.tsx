import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

interface EmptyStateProps extends HTMLAttributes<HTMLDivElement> {
  title: string;
  description: string;
  action?: ReactNode;
}
export function EmptyState({
  title,
  description,
  action,
  className,
  ...props
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-dashed border-slate-300 p-8 text-center dark:border-slate-700",
        className,
      )}
      {...props}
    >
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="mt-2 text-slate-600 dark:text-slate-300">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
