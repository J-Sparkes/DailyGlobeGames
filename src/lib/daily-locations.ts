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

export function pickDailyLocations(
  pool: DailyLocation[],
  count = 5,
  date: Date = new Date(),
): DailyLocation[] {
  if (pool.length < count) {
    throw new Error(`Location pool needs at least ${count} entries`);
  }

  const seed = `${getDateSeed(date)}-tap`;
  const shuffled = shuffleWithSeed(pool, seed);
  const picked = shuffled.slice(0, count);

  return [...picked].sort((a, b) => a.difficulty - b.difficulty);
}
