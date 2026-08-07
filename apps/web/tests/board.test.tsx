import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
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
});
