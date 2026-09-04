import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PracticeGame } from "@/features/game/components/PracticeGame";

describe("PracticeGame", () => {
  it("starts unranked with unlimited time and applies settings on restart", () => {
    render(<PracticeGame />);

    expect(screen.getByText("Unranked")).toBeInTheDocument();
    const unlimitedToggle = screen.getByLabelText("Unlimited time", {
      selector: "input",
    });
    expect(unlimitedToggle).toBeChecked();
    expect(screen.getByTestId("timer")).toHaveTextContent("∞");
    expect(
      screen.getByLabelText("Unlimited time", { selector: "span" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("grid")).toHaveAttribute("aria-rowcount", "5");

    fireEvent.change(screen.getByLabelText("Board"), {
      target: { value: "4" },
    });
    fireEvent.click(unlimitedToggle);
    fireEvent.click(screen.getByRole("button", { name: "Restart practice" }));

    expect(screen.getByRole("grid")).toHaveAttribute("aria-rowcount", "4");
    expect(screen.getByTestId("timer")).toHaveTextContent("3:00");
  });
});
