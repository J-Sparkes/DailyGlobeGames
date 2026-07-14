import triviaCountries from "@/data/trivia-countries.json";
import { countries, countryById } from "@/lib/game-data";
import { unCountryById } from "@/lib/un-countries";

export type TriviaRound = {
  name: string;
  countryId: string;
  coordinates: { lat: number; lng: number };
  clues: string[];
};

export type DailyTrivia = {
  daily: TriviaRound;
  bonus: TriviaRound;
};

const FACTS = triviaCountries as Record<string, string[]>;

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

/** Playable countries with a full clue set, sorted for stable picks. */
export function getTriviaCountryPool(): string[] {
  return countries
    .map((country) => country.id)
    .filter((id) => (FACTS[id]?.length ?? 0) >= 5)
    .sort();
}

function pickIndex(poolLength: number, dateSeed: string, salt: string): number {
  if (poolLength <= 0) {
    throw new Error("Trivia country pool is empty");
  }
  const rng = mulberry32(hashSeed(`${dateSeed}:${salt}`));
  return Math.floor(rng() * poolLength);
}

function toRound(countryId: string): TriviaRound {
  const country = countryById.get(countryId);
  const clues = FACTS[countryId];
  const un = unCountryById.get(countryId);
  if (!country || !clues || clues.length < 5) {
    throw new Error(`Missing trivia round data for ${countryId}`);
  }

  return {
    name: country.name,
    countryId: country.id,
    coordinates: {
      lat: un?.lat ?? 0,
      lng: un?.lng ?? 0,
    },
    clues: clues.slice(0, 5),
  };
}

/**
 * Deterministic daily + bonus quiz countries for a UTC date seed (YYYY-MM-DD).
 * Bonus is always a different country from daily.
 */
export function getDailyTrivia(dateSeed: string): DailyTrivia {
  const pool = getTriviaCountryPool();
  const dailyIndex = pickIndex(pool.length, dateSeed, "trivia-daily");
  let bonusIndex = pickIndex(pool.length, dateSeed, "trivia-bonus");

  if (bonusIndex === dailyIndex) {
    bonusIndex = (bonusIndex + 1) % pool.length;
  }

  const dailyId = pool[dailyIndex]!;
  const bonusId = pool[bonusIndex]!;

  return {
    daily: toRound(dailyId),
    bonus: toRound(bonusId),
  };
}
