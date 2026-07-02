import type { Country } from "@/types/country";
import countryData from "@/data/countries.json";
import locationsData from "@/data/locations.json";
import type { CountryDataset } from "@/types/country";
import type { DailyLocation } from "@/types/location";
import { getDateSeed, pickDailyCountry } from "@/lib/daily-seed";
import { pickDailyLocations } from "@/lib/daily-locations";
import { pickDailyHuntCountry, buildHuntPool } from "@/lib/daily-hunt";
import { getFrontierCountryIds, loadBorderGraph } from "@/lib/border-graph";
import { loadServerBorderGraph } from "@/lib/server/border-graph";
import { loadServerCountryFeatures } from "@/lib/server/world-geographies";
import { isCorrectAnswer } from "@/lib/answer-check";
import { countryById, getDailyPool } from "@/lib/game-data";
import { scoreRound, MAX_ROUNDS } from "@/lib/tap-scoring";
import { haversineKm } from "@/lib/geo-distance";
import { getFeatureCentroid } from "@/lib/geo-centroid";
import { getWarmerHint } from "@/lib/hunt-scoring";
import type { CountryFeature } from "@/lib/world-geographies";

const dataset = countryData as CountryDataset;

export function getServerCountries(): Country[] {
  return dataset.countries;
}

export function getServerDailyPool(): Country[] {
  return getDailyPool();
}

export function getServerLocations(): DailyLocation[] {
  return locationsData as DailyLocation[];
}

export function getServerSweepStart(date: string): Country {
  const pool = getServerDailyPool();
  const dateObj = new Date(`${date}T00:00:00Z`);
  return pickDailyCountry(pool, dateObj);
}

export function getServerTapRounds(date: string) {
  const dateObj = new Date(`${date}T00:00:00Z`);
  const picked = pickDailyLocations(getServerLocations(), MAX_ROUNDS, dateObj);
  return picked.map((loc) => ({
    locationId: loc.id,
    prompt: loc.prompt,
    difficulty: loc.difficulty,
    fact: loc.fact,
  }));
}

export function scoreServerTapGuess(
  date: string,
  roundIndex: number,
  lat: number,
  lng: number,
) {
  const dateObj = new Date(`${date}T00:00:00Z`);
  const picked = pickDailyLocations(getServerLocations(), MAX_ROUNDS, dateObj);
  const location = picked[roundIndex];
  if (!location) {
    throw new Error("Invalid round index");
  }

  const distanceKm = haversineKm(lat, lng, location.lat, location.lng);
  const scoring = scoreRound(distanceKm, roundIndex);

  return {
    locationId: location.id,
    prompt: location.prompt,
    guessLat: lat,
    guessLng: lng,
    answerLat: location.lat,
    answerLng: location.lng,
    distanceKm,
    ...scoring,
    fact: location.fact,
  };
}

let huntFeaturesCache: CountryFeature[] | null = null;

export async function getServerHuntCountryId(date: string): Promise<string> {
  if (!huntFeaturesCache) {
    huntFeaturesCache = loadServerCountryFeatures();
  }
  const dateObj = new Date(`${date}T00:00:00Z`);
  return pickDailyHuntCountry(huntFeaturesCache, dateObj);
}

export function scoreServerHuntGuess(
  hiddenCountryId: string,
  guessCountryId: string,
  previousDistanceMiles: number | null,
  features: CountryFeature[],
) {
  const hidden = features.find((f) => f.properties.countryId === hiddenCountryId);
  const guess = features.find((f) => f.properties.countryId === guessCountryId);
  if (!hidden || !guess) {
    throw new Error("Invalid country");
  }

  const { lat: hLat, lng: hLng } = requireCentroid(hidden);
  const { lat: gLat, lng: gLng } = requireCentroid(guess);

  const distanceMiles = haversineKm(gLat, gLng, hLat, hLng) * 0.621371;

  let warmer = getWarmerHint(distanceMiles, previousDistanceMiles);

  const won = guessCountryId === hiddenCountryId;

  return { distanceMiles, warmer, won, hiddenCountryId };
}

function requireCentroid(feature: CountryFeature) {
  return getFeatureCentroid(feature);
}

export async function validateSweepPath(
  date: string,
  path: string[],
  failedGuess: string,
  targetCountryId: string,
): Promise<{ valid: boolean; streak: number }> {
  if (path.length === 0) return { valid: false, streak: 0 };

  const start = getServerSweepStart(date);
  if (path[0] !== start.id) {
    return { valid: false, streak: 0 };
  }

  loadServerBorderGraph();
  await loadBorderGraph();

  for (let i = 0; i < path.length; i++) {
    const countryId = path[i]!;
    if (!countryById.has(countryId)) {
      return { valid: false, streak: i };
    }

    if (i < path.length - 1) {
      const frontier = new Set(getFrontierCountryIds(path.slice(0, i + 1)));
      const next = path[i + 1]!;
      if (!frontier.has(next)) {
        return { valid: false, streak: i + 1 };
      }
    }
  }

  const lastCountry = countryById.get(path[path.length - 1]!);
  if (!lastCountry) return { valid: false, streak: 0 };

  const target = countryById.get(targetCountryId);
  if (!target || !isCorrectAnswer(failedGuess, target)) {
    return { valid: false, streak: path.length };
  }

  return { valid: true, streak: path.length };
}

export { buildHuntPool };
