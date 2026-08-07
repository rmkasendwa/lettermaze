"use client";

import {
  useRef,
  useState,
  type CSSProperties,
  type HTMLAttributes,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";
import { cn } from "@/lib/utils";

export interface BoardProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  "children"
> {
  /** Number of rows and columns in the board. */
  size: number;
  /** Cells in row-major order. Empty positions are filled automatically. */
  children?: ReactNode;
  cells?: readonly ReactNode[];
  cellClassName?: string;
  label?: string;
  /** Prevents starting or completing selections. */
  disabled?: boolean;
  /** Called whenever the active drag path changes. */
  onSelectionChange?: (indexes: readonly number[]) => void;
  /** Called when a non-empty path is released successfully. */
  onSelectionComplete?: (indexes: readonly number[]) => void;
}

function isAdjacent(first: number, second: number, size: number) {
  const rowDistance = Math.abs(
    Math.floor(first / size) - Math.floor(second / size),
  );
  const columnDistance = Math.abs((first % size) - (second % size));
  return Math.max(rowDistance, columnDistance) === 1;
}

export function Board({
  size,
  cells,
  children,
  className,
  cellClassName,
  label = "LetterMaze board",
  disabled = false,
  style,
  onSelectionChange,
  onSelectionComplete,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onPointerCancel,
  onLostPointerCapture,
  ...props
}: BoardProps) {
  if (!Number.isInteger(size) || size < 1) {
    throw new RangeError("Board size must be a positive integer.");
  }

  const [selected, setSelected] = useState<readonly number[]>([]);
  const selectedRef = useRef<readonly number[]>([]);
  const activePointerRef = useRef<number | null>(null);
  const cellCount = size * size;
  const boardCells = cells
    ? Array.from({ length: cellCount }, (_, index) => cells[index] ?? null)
    : null;
  const boardStyle = {
    ...style,
    "--board-size": size,
  } as CSSProperties;

  const updateSelection = (next: readonly number[]) => {
    selectedRef.current = next;
    setSelected(next);
    onSelectionChange?.(next);
  };

  const indexAtPointer = (event: ReactPointerEvent<HTMLDivElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    if (
      bounds.width <= 0 ||
      bounds.height <= 0 ||
      event.clientX < bounds.left ||
      event.clientX >= bounds.right ||
      event.clientY < bounds.top ||
      event.clientY >= bounds.bottom
    ) {
      return null;
    }

    const column = Math.min(
      size - 1,
      Math.floor(((event.clientX - bounds.left) / bounds.width) * size),
    );
    const row = Math.min(
      size - 1,
      Math.floor(((event.clientY - bounds.top) / bounds.height) * size),
    );
    return row * size + column;
  };

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    onPointerDown?.(event);
    if (
      disabled ||
      event.defaultPrevented ||
      !event.isPrimary ||
      event.button !== 0
    )
      return;

    const index = indexAtPointer(event);
    if (index === null) return;
    event.preventDefault();
    activePointerRef.current = event.pointerId;
    event.currentTarget.setPointerCapture?.(event.pointerId);
    updateSelection([index]);
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    onPointerMove?.(event);
    if (activePointerRef.current !== event.pointerId) return;

    const index = indexAtPointer(event);
    const path = selectedRef.current;
    const last = path[path.length - 1];
    if (index === null || last === undefined || index === last) return;

    // Crossing back over the previous tile should feel like unwinding a line.
    if (path.length > 1 && index === path[path.length - 2]) {
      updateSelection(path.slice(0, -1));
      return;
    }

    // Ignore jumps and reused tiles; the user can continue from the last valid tile.
    if (!isAdjacent(last, index, size) || path.includes(index)) return;
    updateSelection([...path, index]);
  };

  const finishSelection = (
    event: ReactPointerEvent<HTMLDivElement>,
    cancelled: boolean,
  ) => {
    if (activePointerRef.current !== event.pointerId) return;
    activePointerRef.current = null;
    if (event.currentTarget.hasPointerCapture?.(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    const completed = selectedRef.current;
    updateSelection([]);
    if (!disabled && !cancelled && completed.length > 0)
      onSelectionComplete?.(completed);
  };

  return (
    <div
      aria-label={label}
      role="grid"
      aria-colcount={size}
      aria-rowcount={size}
      aria-disabled={disabled}
      className={cn(
        "grid aspect-square w-full min-w-0 touch-none select-none overflow-hidden rounded-xl border border-slate-300 bg-slate-300 shadow-sm dark:border-slate-700 dark:bg-slate-700",
        "[grid-template-columns:repeat(var(--board-size),minmax(0,1fr))] [grid-template-rows:repeat(var(--board-size),minmax(0,1fr))]",
        disabled && "cursor-not-allowed opacity-60",
        className,
      )}
      style={boardStyle}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={(event) => {
        onPointerUp?.(event);
        finishSelection(event, event.defaultPrevented);
      }}
      onPointerCancel={(event) => {
        onPointerCancel?.(event);
        finishSelection(event, true);
      }}
      onLostPointerCapture={(event) => {
        onLostPointerCapture?.(event);
        if (activePointerRef.current === event.pointerId) {
          activePointerRef.current = null;
          updateSelection([]);
        }
      }}
      {...props}
    >
      {boardCells
        ? boardCells.map((cell, index) => {
            const isSelected = selected.includes(index);
            return (
              <div
                aria-colindex={(index % size) + 1}
                aria-rowindex={Math.floor(index / size) + 1}
                aria-selected={isSelected}
                className={cn(
                  "flex min-h-0 min-w-0 items-center justify-center border border-slate-200 bg-white text-[clamp(0.75rem,5cqw,2rem)] font-semibold uppercase leading-none transition-colors dark:border-slate-800 dark:bg-slate-900",
                  isSelected &&
                    "border-sky-500 bg-sky-200 text-sky-950 dark:border-sky-400 dark:bg-sky-700 dark:text-white",
                  cellClassName,
                )}
                data-cell-index={index}
                key={index}
                role="gridcell"
              >
                {cell}
              </div>
            );
          })
        : children}
    </div>
  );
}
