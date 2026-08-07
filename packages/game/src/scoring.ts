/** Standard LetterMaze scoring, based on the submitted word's length. */
export function scoreWord(word: string): number {
  const length = word.trim().length;

  if (length < 3) return 0;
  if (length <= 4) return 1;
  if (length === 5) return 2;
  if (length === 6) return 3;
  if (length === 7) return 5;
  return 11;
}
