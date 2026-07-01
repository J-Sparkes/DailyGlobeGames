import { getDateSeed } from "@/lib/daily-seed";
import fameData from "@/data/hunt-fame-tiers.json";
import { getFeatureCentroid } from "@/lib/geo-centroid";
import type { CountryFeature } from "@/lib/world-geographies";

const TIER1 = new Set(fameData.tier1 as string[]);
const TIER3 = new Set(fameData.tier3 as string[]);
const EXCLUDED = new Set(fameData.excluded as string[]);

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

function getFameTier(countryId: string): 1 | 2 | 3 {
  if (TIER1.has(countryId)) return 1;
  if (TIER3.has(countryId)) return 3;
  return 2;
}

function getWeekdayTierWeights(date: Date): Record<1 | 2 | 3, number> {
  const day = date.getUTCDay();
  if (day >= 1 && day <= 3) {
    return { 1: 0.55, 2: 0.35, 3: 0.1 };
  }
  if (day === 4 || day === 5) {
    return { 1: 0.3, 2: 0.45, 3: 0.25 };
  }
  return { 1: 0.15, 2: 0.4, 3: 0.45 };
}

function isValidCentroid(lat: number, lng: number): boolean {
  return Number.isFinite(lat) && Number.isFinite(lng);
}

export function buildHuntPool(features: CountryFeature[]): CountryFeature[] {
  return features.filter((feature) => {
    const countryId = feature.properties.countryId;
    if (EXCLUDED.has(countryId)) return false;

    const { lat, lng } = getFeatureCentroid(feature);
    return isValidCentroid(lat, lng);
  });
}

export function pickDailyHuntCountry(
  features: CountryFeature[],
  date: Date = new Date(),
): string {
  const pool = buildHuntPool(features);
  if (pool.length === 0) {
    throw new Error("Hunt country pool is empty");
  }

  const weights = getWeekdayTierWeights(date);
  const weighted = pool.map((feature) => {
    const tier = getFameTier(feature.properties.countryId);
    return {
      feature,
      weight: weights[tier],
    };
  });

  const totalWeight = weighted.reduce((sum, entry) => sum + entry.weight, 0);
  const rng = mulberry32(hashSeed(`${getDateSeed(date)}-hunt`));
  let roll = rng() * totalWeight;

  for (const entry of weighted) {
    roll -= entry.weight;
    if (roll <= 0) {
      return entry.feature.properties.countryId;
    }
  }

  return weighted[weighted.length - 1]!.feature.properties.countryId;
}

export function getHuntCountryFact(countryId: string, displayName: string): string {
  void countryId;
  return `Today's hidden country was ${displayName}. Every guess measures how far you were from its geographic center.`;
}
