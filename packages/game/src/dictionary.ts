export interface WordDictionary {
  has(word: string): boolean;
  readonly size: number;
}

/** Normalizes user input and dictionary entries to their canonical form. */
export function normalizeWord(word: string): string {
  return word.trim().toUpperCase();
}

/**
 * Loads dictionary entries into a Set once, making validation constant-time.
 * Keeping this factory independent of a particular word list lets callers
 * replace the dictionary without changing submission logic.
 */
export function createWordDictionary(words: Iterable<string>): WordDictionary {
  const entries = new Set<string>();

  for (const word of words) {
    const normalized = normalizeWord(word);
    if (/^[A-Z]+$/.test(normalized)) entries.add(normalized);
  }

  return {
    has(word: string) {
      return entries.has(normalizeWord(word));
    },
    get size() {
      return entries.size;
    },
  };
}

/** Parses the common one-word-per-line dictionary file format. */
export function loadWordDictionary(contents: string): WordDictionary {
  return createWordDictionary(contents.split(/\r?\n/));
}

export class WordSubmissionTracker {
  readonly #dictionary: WordDictionary;
  readonly #submitted = new Set<string>();

  constructor(dictionary: WordDictionary) {
    this.#dictionary = dictionary;
  }

  /** Returns the canonical word when accepted, otherwise null. */
  submit(word: string): string | null {
    const normalized = normalizeWord(word);
    if (
      !/^[A-Z]+$/.test(normalized) ||
      this.#submitted.has(normalized) ||
      !this.#dictionary.has(normalized)
    ) {
      return null;
    }

    this.#submitted.add(normalized);
    return normalized;
  }

  hasSubmitted(word: string): boolean {
    return this.#submitted.has(normalizeWord(word));
  }

  get size(): number {
    return this.#submitted.size;
  }

  reset(): void {
    this.#submitted.clear();
  }
}
