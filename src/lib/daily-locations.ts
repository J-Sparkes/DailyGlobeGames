import { getDateSeed } from "@/lib/daily-seed";
import type { DailyLocation } from "@/types/location";

function hashSeed(seed: string): number {
  let hash = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    hash ^= seed.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function mulberry32(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffleWithSeed<T>(items: T[], seed: string): T[] {
  const rng = mulberry32(hashSeed(seed));
  const copy = [...items];

  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [copy[i], copy[j]] = [copy[j]!, copy[i]!];
  }

  return copy;
}

/** 0-based UTC day of year (0 = Jan 1). */
export function getUtcDayOfYear(date: Date): number {
  const start = Date.UTC(date.getUTCFullYear(), 0, 1);
  const current = Date.UTC(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate(),
  );
  return Math.floor((current - start) / 86_400_000);
}

/**
 * Build a year-long deck by concatenating seeded shuffles of the pool
 * so consecutive days deal disjoint hands until the deck wraps.
 */
export function buildTapYearDeck(
  pool: DailyLocation[],
  year: number,
  daysInYear = 366,
  count = 5,
): DailyLocation[] {
  const sorted = [...pool].sort((a, b) => a.id.localeCompare(b.id));
  const slotsNeeded = daysInYear * count;
  const deck: DailyLocation[] = [];
  let copyIndex = 0;

  while (deck.length < slotsNeeded) {
    deck.push(
      ...shuffleWithSeed(sorted, `${year}-tap-deck-${copyIndex}`),
    );
    copyIndex += 1;
  }

  return deck;
}

/**
 * Deterministic Tap rounds for a UTC date.
 * Uses a year deck so each day gets a different set, with minimal
 * day-to-day repeats, drawn from the full location pool.
 */
export function pickDailyLocations(
  pool: DailyLocation[],
  count = 5,
  date: Date = new Date(),
): DailyLocation[] {
  if (pool.length < count) {
    throw new Error(`Location pool needs at least ${count} entries`);
  }

  const dateSeed = getDateSeed(date);
  const year = Number(dateSeed.slice(0, 4));
  const dayOfYear = getUtcDayOfYear(date);
  const deck = buildTapYearDeck(pool, year, 366, count);
  const start = dayOfYear * count;
  const picked = deck.slice(start, start + count);

  return [...picked].sort((a, b) => a.difficulty - b.difficulty);
}
