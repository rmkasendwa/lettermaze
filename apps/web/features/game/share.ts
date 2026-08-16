export interface ShareableResult {
  score: number;
  wordsFound: number;
  dailyChallengeDate?: string;
}

interface ResultShareNavigator {
  share?: (data?: ShareData) => Promise<void>;
  clipboard: { writeText: (text: string) => Promise<void> };
}

export function formatShareableResult(result: ShareableResult): string {
  const heading = result.dailyChallengeDate
    ? `LetterMaze Daily ${result.dailyChallengeDate}`
    : "LetterMaze";
  const wordLabel = result.wordsFound === 1 ? "word" : "words";

  return `${heading}\n${result.score} points · ${result.wordsFound} ${wordLabel} found`;
}

export async function shareResult(
  result: ShareableResult,
  shareNavigator: ResultShareNavigator = navigator,
): Promise<"shared" | "copied"> {
  const text = formatShareableResult(result);

  if (typeof shareNavigator.share === "function") {
    await shareNavigator.share({ title: "LetterMaze result", text });
    return "shared";
  }

  await shareNavigator.clipboard.writeText(text);
  return "copied";
}
