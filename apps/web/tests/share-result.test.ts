import { describe, expect, it, vi } from "vitest";
import { formatShareableResult, shareResult } from "@/features/game/share";

describe("result sharing", () => {
  it("formats a compact daily result without puzzle contents", () => {
    const text = formatShareableResult({
      score: 42,
      wordsFound: 7,
      dailyChallengeDate: "2026-08-16",
    });

    expect(text).toBe("LetterMaze Daily 2026-08-16\n42 points · 7 words found");
    expect(text).not.toMatch(/BOARD|LETTER|TREE/);
  });

  it("uses native sharing when available", async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    const clipboard = { writeText: vi.fn() };

    await expect(
      shareResult({ score: 3, wordsFound: 1 }, { share, clipboard }),
    ).resolves.toBe("shared");
    expect(share).toHaveBeenCalledWith({
      title: "LetterMaze result",
      text: "LetterMaze\n3 points · 1 word found",
    });
    expect(clipboard.writeText).not.toHaveBeenCalled();
  });

  it("copies the result when native sharing is unavailable", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);

    await expect(
      shareResult(
        { score: 12, wordsFound: 4 },
        { share: undefined, clipboard: { writeText } },
      ),
    ).resolves.toBe("copied");
    expect(writeText).toHaveBeenCalledWith(
      "LetterMaze\n12 points · 4 words found",
    );
  });
});
