import type { CSSProperties, HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface BoardProps extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
  /** Number of rows and columns in the board. */
  size: number;
  /** Cells in row-major order. Empty positions are filled automatically. */
  children?: ReactNode;
  cells?: readonly ReactNode[];
  cellClassName?: string;
  label?: string;
}

export function Board({
  size,
  cells,
  children,
  className,
  cellClassName,
  label = "LetterMaze board",
  style,
  ...props
}: BoardProps) {
  if (!Number.isInteger(size) || size < 1) {
    throw new RangeError("Board size must be a positive integer.");
  }

  const cellCount = size * size;
  const boardCells = cells
    ? Array.from({ length: cellCount }, (_, index) => cells[index] ?? null)
    : null;
  const boardStyle = {
    ...style,
    "--board-size": size,
  } as CSSProperties;

  return (
    <div
      aria-label={label}
      role="grid"
      aria-colcount={size}
      aria-rowcount={size}
      className={cn(
        "grid aspect-square w-full min-w-0 overflow-hidden rounded-xl border border-slate-300 bg-slate-300 shadow-sm dark:border-slate-700 dark:bg-slate-700",
        "[grid-template-columns:repeat(var(--board-size),minmax(0,1fr))] [grid-template-rows:repeat(var(--board-size),minmax(0,1fr))]",
        className,
      )}
      style={boardStyle}
      {...props}
    >
      {boardCells
        ? boardCells.map((cell, index) => (
            <div
              aria-colindex={(index % size) + 1}
              aria-rowindex={Math.floor(index / size) + 1}
              className={cn(
                "flex min-h-0 min-w-0 items-center justify-center border border-slate-200 bg-white text-[clamp(0.75rem,5cqw,2rem)] font-semibold uppercase leading-none dark:border-slate-800 dark:bg-slate-900",
                cellClassName,
              )}
              key={index}
              role="gridcell"
            >
              {cell}
            </div>
          ))
        : children}
    </div>
  );
}
