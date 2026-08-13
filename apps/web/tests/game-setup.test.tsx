import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { DIFFICULTY_STORAGE_KEY, GameSetup } from "@/features/game";

describe("GameSetup", () => {
  beforeEach(() => localStorage.clear());

  it("lets the player choose a difficulty before generating the game", () => {
    render(<GameSetup />);

    expect(screen.queryByRole("grid")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("radio", { name: /Hard/ }));
    fireEvent.click(screen.getByRole("button", { name: "Start Hard game" }));

    expect(screen.getByRole("grid")).toHaveAttribute("aria-rowcount", "6");
    expect(screen.getByTestId("timer")).toHaveTextContent("2:00");
    expect(JSON.parse(localStorage.getItem(DIFFICULTY_STORAGE_KEY)!)).toBe(
      "hard",
    );
  });

  it("restores a valid preferred difficulty across sessions", async () => {
    localStorage.setItem(DIFFICULTY_STORAGE_KEY, JSON.stringify("easy"));
    render(<GameSetup />);

    await waitFor(() =>
      expect(screen.getByRole("radio", { name: /Easy/ })).toBeChecked(),
    );
    expect(
      screen.getByRole("button", { name: "Start Easy game" }),
    ).toBeInTheDocument();
  });
});
