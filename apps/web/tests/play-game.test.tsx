import { act, fireEvent, render, screen, within } from "@testing-library/react";
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

function selectTreeRow() {
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
    clientY: 450,
    isPrimary: true,
    pointerId: 2,
  });
  for (const clientX of [150, 250, 350]) {
    fireEvent.pointerMove(board, {
      clientX,
      clientY: 450,
      isPrimary: true,
      pointerId: 2,
    });
  }
  fireEvent.pointerUp(board, { pointerId: 2 });
}

describe("PlayGame", () => {
  it("shows every target and the number still remaining when play begins", () => {
    render(
      <PlayGame cells={cells} size={5} targetWords={["LETTER", "TREE"]} />,
    );

    const targetLists = screen.getAllByRole("list", { name: "Target words" });
    expect(targetLists).toHaveLength(2);
    for (const list of targetLists) {
      expect(list).toHaveTextContent("LETTER");
      expect(list).toHaveTextContent("TREE");
    }
    expect(screen.getAllByTestId("words-remaining")[0]).toHaveTextContent(
      "2 remaining",
    );
  });

  it("previews the selected word and clears it when selection ends", () => {
    render(<PlayGame cells={cells} size={5} />);
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
      pointerId: 7,
    });
    expect(screen.getByTestId("word-preview")).toHaveTextContent("L");
    expect(screen.getByTestId("word-preview-validity")).toHaveTextContent(
      "Potential word",
    );

    fireEvent.pointerMove(board, {
      clientX: 150,
      clientY: 50,
      pointerId: 7,
    });
    expect(screen.getByTestId("word-preview")).toHaveTextContent("LE");

    fireEvent.pointerMove(board, {
      clientX: 150,
      clientY: 150,
      pointerId: 7,
    });
    expect(screen.getByTestId("word-preview")).toHaveTextContent("LEM");
    expect(screen.getByTestId("word-preview-validity")).toHaveTextContent(
      "Not a valid word",
    );

    fireEvent.pointerCancel(board, { pointerId: 7 });
    expect(screen.getByTestId("word-preview")).toBeEmptyDOMElement();
  });

  it("updates totals immediately for a valid word and ignores duplicates", () => {
    render(
      <PlayGame
        cells={[...cells.slice(0, 20), "T", "R", "E", "E", "S"]}
        size={5}
      />,
    );

    expect(
      screen.getByRole("heading", { name: "Accepted words" }),
    ).toBeInTheDocument();
    expect(screen.getByText("No words accepted yet.")).toBeInTheDocument();

    selectTreeRow();
    expect(screen.getAllByTestId("words-remaining")[0]).toHaveTextContent(
      "12 remaining",
    );
    for (const list of screen.getAllByRole("list", { name: "Target words" })) {
      const foundTree = within(list).getByRole("listitem", {
        name: "TREE, found",
      });
      expect(foundTree).toHaveClass("line-through");
      expect(foundTree).toHaveTextContent("TREE");
      expect(
        within(list).getByRole("listitem", { name: "LETTER, not found" }),
      ).not.toHaveClass("line-through");
    }
    selectLetterRow();
    expect(screen.getByTestId("word-preview")).toBeEmptyDOMElement();
    expect(screen.getByTestId("score")).toHaveTextContent("4");
    expect(screen.getByTestId("words-found")).toHaveTextContent("2");
    expect(
      screen.getByTestId("score").querySelector(".score-points"),
    ).toHaveTextContent("+3");
    const acceptedWords = screen.getByRole("list", { name: "Accepted words" });
    expect(acceptedWords).toHaveTextContent("LETTER");
    expect(acceptedWords).toHaveTextContent("+3 points");
    expect(acceptedWords).toHaveTextContent("TREE");
    expect(acceptedWords).toHaveTextContent("+1 point");
    expect(
      [...acceptedWords.querySelectorAll("li")].map((item) => item.textContent),
    ).toEqual(["LETTER+3 points", "TREE+1 point"]);
    expect(screen.getAllByText("LETTER")).toHaveLength(3);

    selectLetterRow();
    expect(screen.getByTestId("score")).toHaveTextContent("4");
    expect(screen.getByTestId("words-found")).toHaveTextContent("2");
    expect(screen.getAllByTestId("words-remaining")[0]).toHaveTextContent(
      "11 remaining",
    );
    expect(screen.getAllByText("LETTER")).toHaveLength(3);
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
    expect(screen.getByRole("dialog", { name: "Game paused" })).toBeVisible();
    expect(screen.getByTestId("pause-overlay")).toHaveTextContent(
      "You paused the game.",
    );
    expect(screen.queryByRole("grid")).not.toBeInTheDocument();
    act(() => vi.advanceTimersByTime(3000));
    expect(screen.getByTestId("timer")).toHaveTextContent("0:02");

    fireEvent.click(screen.getByRole("button", { name: "Resume" }));
    act(() => vi.advanceTimersByTime(2000));
    expect(
      screen.getByRole("heading", { name: "Game results" }),
    ).toBeInTheDocument();
    expect(screen.getByTestId("results-score")).toHaveTextContent("0");
    expect(screen.getByTestId("results-words-found")).toHaveTextContent("0");
    expect(screen.getByText("No words accepted yet.")).toBeInTheDocument();
    expect(
      screen.getByRole("list", { name: "Missed words" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Games played").nextElementSibling,
    ).toHaveTextContent("1");
    expect(
      screen.getByText("Average score").nextElementSibling,
    ).toHaveTextContent("0.0");
    expect(onGameEnd).toHaveBeenCalledOnce();
    expect(onGameEnd).toHaveBeenCalledWith({ score: 0, wordsFound: 0 });

    fireEvent.click(screen.getByRole("button", { name: "Play again" }));
    expect(screen.getByTestId("timer")).toHaveTextContent("0:02");
    expect(screen.getByTestId("score")).toHaveTextContent("0");
    expect(screen.getByTestId("words-found")).toHaveTextContent("0");
    expect(screen.getByRole("grid")).toHaveAttribute("aria-disabled", "false");
    vi.useRealTimers();
  });

  it("explains an automatic pause when the tab is hidden", () => {
    render(<PlayGame cells={cells} size={5} />);
    Object.defineProperty(document, "hidden", {
      configurable: true,
      value: true,
    });
    fireEvent(document, new Event("visibilitychange"));

    expect(screen.getByTestId("pause-overlay")).toHaveTextContent(
      "The game paused because this tab was hidden.",
    );
    expect(
      screen.queryByRole("button", { name: "Resume game" }),
    ).not.toBeInTheDocument();

    Object.defineProperty(document, "hidden", {
      configurable: true,
      value: false,
    });
  });
});
