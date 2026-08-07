import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Board } from "@/features/game";

describe("Board", () => {
  it("renders a complete configurable square grid", () => {
    render(<Board cells={["A", "B"]} size={3} />);

    const board = screen.getByRole("grid", { name: "LetterMaze board" });
    expect(board).toHaveAttribute("aria-rowcount", "3");
    expect(board).toHaveAttribute("aria-colcount", "3");
    expect(board).toHaveStyle({ "--board-size": "3" });
    expect(screen.getAllByRole("gridcell")).toHaveLength(9);
  });

  it("reserves a square responsive area before content renders", () => {
    render(<Board size={4} />);
    expect(screen.getByRole("grid")).toHaveClass("aspect-square", "w-full");
  });

  it("rejects invalid board sizes", () => {
    expect(() => render(<Board size={0} />)).toThrow(RangeError);
  });

  it("selects adjacent cells, highlights them, and completes the path", () => {
    const onSelectionComplete = vi.fn(() => true);
    render(
      <Board
        cells={["A", "B", "C", "D"]}
        size={2}
        onSelectionComplete={onSelectionComplete}
      />,
    );
    const board = screen.getByRole("grid");
    vi.spyOn(board, "getBoundingClientRect").mockReturnValue({
      left: 0,
      top: 0,
      right: 200,
      bottom: 200,
      width: 200,
      height: 200,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    });

    fireEvent.pointerDown(board, {
      button: 0,
      clientX: 50,
      clientY: 50,
      isPrimary: true,
      pointerId: 1,
    });
    fireEvent.pointerMove(board, {
      clientX: 150,
      clientY: 50,
      isPrimary: true,
      pointerId: 1,
    });
    expect(screen.getAllByRole("gridcell")[0]).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(screen.getAllByRole("gridcell")[0]).toHaveClass(
      "game-tile-selected",
    );
    expect(screen.getAllByRole("gridcell")[1]).toHaveAttribute(
      "aria-selected",
      "true",
    );

    fireEvent.pointerUp(board, {
      clientX: 150,
      clientY: 50,
      isPrimary: true,
      pointerId: 1,
    });
    expect(onSelectionComplete).toHaveBeenCalledWith([0, 1]);
    expect(screen.getAllByRole("gridcell")[0]).toHaveAttribute(
      "aria-selected",
      "false",
    );
    expect(screen.getAllByRole("gridcell")[0]).toHaveClass("game-tile-success");
  });

  it("unwinds naturally and ignores invalid jumps", () => {
    const onSelectionChange = vi.fn();
    render(
      <Board
        cells={["A", "B", "C", "D", "E", "F", "G", "H", "I"]}
        size={3}
        onSelectionChange={onSelectionChange}
      />,
    );
    const board = screen.getByRole("grid");
    vi.spyOn(board, "getBoundingClientRect").mockReturnValue({
      left: 0,
      top: 0,
      right: 300,
      bottom: 300,
      width: 300,
      height: 300,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    });

    fireEvent.pointerDown(board, {
      button: 0,
      clientX: 50,
      clientY: 50,
      isPrimary: true,
      pointerId: 2,
    });
    fireEvent.pointerMove(board, {
      clientX: 150,
      clientY: 50,
      isPrimary: true,
      pointerId: 2,
    });
    fireEvent.pointerMove(board, {
      clientX: 250,
      clientY: 250,
      isPrimary: true,
      pointerId: 2,
    });
    fireEvent.pointerMove(board, {
      clientX: 50,
      clientY: 50,
      isPrimary: true,
      pointerId: 2,
    });

    expect(onSelectionChange).toHaveBeenLastCalledWith([0]);
  });

  it("clears without submitting when the pointer is cancelled", () => {
    const onSelectionComplete = vi.fn();
    render(
      <Board
        cells={["A"]}
        size={1}
        onSelectionComplete={onSelectionComplete}
      />,
    );
    const board = screen.getByRole("grid");
    vi.spyOn(board, "getBoundingClientRect").mockReturnValue({
      left: 0,
      top: 0,
      right: 100,
      bottom: 100,
      width: 100,
      height: 100,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    });
    fireEvent.pointerDown(board, {
      button: 0,
      clientX: 50,
      clientY: 50,
      isPrimary: true,
      pointerId: 3,
    });
    fireEvent.pointerCancel(board, { pointerId: 3 });

    expect(onSelectionComplete).not.toHaveBeenCalled();
    expect(screen.getByRole("gridcell")).toHaveAttribute(
      "aria-selected",
      "false",
    );
  });
});
