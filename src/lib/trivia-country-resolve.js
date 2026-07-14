import { countries } from "@/lib/game-data";
import { unCountryById } from "@/lib/un-countries";
import { getFeatureCentroid } from "@/lib/geo-centroid";
import { loadCountryFeatures } from "@/lib/world-geographies";

function normalizeName(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "");
}

/**
 * @typedef {{ name: string, countryId: string, coordinates: { lat: number, lng: number } }} TriviaCountryMatch
 */

/** @type {Map<string, TriviaCountryMatch> | null} */
let lookupByName = null;

export async function loadTriviaCountryLookup() {
  if (lookupByName) return lookupByName;

  const features = await loadCountryFeatures();
  const featureById = new Map(
    features.map((feature) => [feature.properties.countryId, feature]),
  );

  lookupByName = new Map();

  for (const country of countries) {
    const feature = featureById.get(country.id);
    const un = unCountryById.get(country.id);
    const coordinates = feature
      ? getFeatureCentroid(feature)
      : { lat: un?.lat ?? 0, lng: un?.lng ?? 0 };

    const entry = {
      name: country.name,
      countryId: country.id,
      coordinates,
    };

    const names = new Set([
      country.name,
      country.mapName,
      ...country.aliases,
    ]);

    for (const name of names) {
      lookupByName.set(normalizeName(name), entry);
    }
  }

  return lookupByName;
}

/**
 * @param {string} input
 * @param {Map<string, TriviaCountryMatch>} lookup
 * @returns {TriviaCountryMatch | null}
 */
export function resolveTriviaCountryInput(input, lookup) {
  const normalized = normalizeName(input);
  if (!normalized) return null;

  const exact = lookup.get(normalized);
  if (exact) return exact;

  for (const country of countries) {
    const aliases = [country.name, country.mapName, ...country.aliases];
    const match = aliases.some((alias) =>
      normalizeName(alias).includes(normalized),
    );
    if (match) {
      return lookup.get(normalizeName(country.name)) ?? null;
    }
  }

  return null;
}

/**
 * @param {string} countryName
 * @param {Map<string, TriviaCountryMatch>} lookup
 * @returns {TriviaCountryMatch | null}
 */
export function resolveTriviaCountryByName(countryName, lookup) {
  return lookup.get(normalizeName(countryName)) ?? null;
}
