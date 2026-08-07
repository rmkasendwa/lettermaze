import { act, fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { PlayGame } from "@/features/game";

const cells = [
  "L",
  "E",
  "T",
  "T",
  "E",
  "A",
  "M",
  "A",
  "Z",
  "R",
  "B",
  "O",
  "A",
  "R",
  "D",
  "P",
  "U",
  "Z",
  "Z",
  "L",
  "W",
  "O",
  "R",
  "D",
  "S",
];

function selectLetterRow() {
  const board = screen.getByRole("grid");
  vi.spyOn(board, "getBoundingClientRect").mockReturnValue({
    left: 0,
    top: 0,
    right: 500,
    bottom: 500,
    width: 500,
    height: 500,
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
  for (const clientX of [150, 250, 350, 450]) {
    fireEvent.pointerMove(board, {
      clientX,
      clientY: 50,
      isPrimary: true,
      pointerId: 1,
    });
  }
  fireEvent.pointerMove(board, {
    clientX: 450,
    clientY: 150,
    isPrimary: true,
    pointerId: 1,
  });
  fireEvent.pointerUp(board, { pointerId: 1 });
}

describe("PlayGame", () => {
  it("updates totals immediately for a valid word and ignores duplicates", () => {
    render(<PlayGame cells={cells} size={5} />);

    selectLetterRow();
    expect(screen.getByTestId("score")).toHaveTextContent("3");
    expect(screen.getByTestId("words-found")).toHaveTextContent("1");
    expect(screen.getByText("+3")).toHaveClass("score-points");

    selectLetterRow();
    expect(screen.getByTestId("score")).toHaveTextContent("3");
    expect(screen.getByTestId("words-found")).toHaveTextContent("1");
  });

  it("counts down, pauses, and ends with the final score", () => {
    vi.useFakeTimers();
    const onGameEnd = vi.fn();
    render(
      <PlayGame
        cells={cells}
        size={5}
        durationSeconds={2}
        onGameEnd={onGameEnd}
      />,
    );

    expect(screen.getByTestId("timer")).toHaveTextContent("0:02");
    fireEvent.click(screen.getByRole("button", { name: "Pause" }));
    act(() => vi.advanceTimersByTime(3000));
    expect(screen.getByTestId("timer")).toHaveTextContent("0:02");

    fireEvent.click(screen.getByRole("button", { name: "Resume" }));
    act(() => vi.advanceTimersByTime(2000));
    expect(screen.getByText("Game over")).toBeInTheDocument();
    expect(screen.getByRole("grid")).toHaveAttribute("aria-disabled", "true");
    expect(onGameEnd).toHaveBeenCalledOnce();
    expect(onGameEnd).toHaveBeenCalledWith({ score: 0, wordsFound: 0 });
    vi.useRealTimers();
  });
});
