export type RandomSource = () => number;

/**
 * Creates a small, repeatable pseudo-random number generator.
 * String and numeric seeds are normalized so they behave identically everywhere.
 */
export function createSeededRandom(seed: string | number): RandomSource {
  const text = String(seed);
  let hash = 2166136261;

  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  let state = hash >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4_294_967_296;
  };
}

export function randomIndex(length: number, random: RandomSource): number {
  if (!Number.isInteger(length) || length < 1) {
    throw new RangeError("Length must be a positive integer.");
  }

  return Math.floor(random() * length);
}
