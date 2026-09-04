import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Button } from "@/components/ui/Button";
import { routes } from "@/lib/routes";
import { cn } from "@/lib/utils";

describe("project foundation", () => {
  it("forwards native button props", () => {
    render(
      <Button disabled name="submit-word">
        Submit
      </Button>,
    );
    expect(screen.getByRole("button", { name: "Submit" })).toBeDisabled();
    expect(screen.getByRole("button")).toHaveAttribute("name", "submit-word");
  });
  it("defines stable routes", () =>
    expect(routes).toEqual({
      home: "/",
      play: "/play",
      practice: "/practice",
      daily: "/daily",
      profile: "/profile",
      settings: "/settings",
    }));
  it("merges conflicting utility classes", () =>
    expect(cn("px-2", "px-4")).toBe("px-4"));
});
