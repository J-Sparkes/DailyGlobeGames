import type { Country } from "@/types/country";
import { getDateSeed } from "@/lib/daily-seed";

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

export function pickDailyCountry(
  pool: Country[],
  date: Date = new Date(),
): Country {
  if (pool.length === 0) {
    throw new Error("Daily pool is empty");
  }

  const rng = mulberry32(hashSeed(getDateSeed(date)));
  const index = Math.floor(rng() * pool.length);
  return pool[index]!;
}
