import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { DailyChallenge } from "@/features/daily-challenge";

vi.mock("@/features/account", () => ({
  useAccount: () => ({ user: null }),
}));
vi.mock("@/lib/api/client", () => ({ apiRequest: vi.fn() }));

describe("daily challenge archive", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ user: null }), {
          headers: { "Content-Type": "application/json" },
          status: 200,
        }),
      ),
    );
  });

  it("opens a deterministic archived puzzle without ranked UI", async () => {
    localStorage.setItem("daily-completed:2026-01-15", JSON.stringify(true));
    render(<DailyChallenge puzzleId="2026-01-15" />);

    expect(
      screen.getByText(/Archived puzzle · 2026-01-15/),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Choose a previous daily puzzle")).toHaveValue(
      "2026-01-15",
    );
    expect(screen.getByText(/Rankings are unchanged/)).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "Today's leaderboard" }),
    ).not.toBeInTheDocument();
    await waitFor(() =>
      expect(
        screen.getByText("You previously completed this puzzle."),
      ).toBeInTheDocument(),
    );
  });
});
