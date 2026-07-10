import type { Country } from "@/types/country";
import countryData from "@/data/countries.json";
import type { CountryDataset } from "@/types/country";

const dataset = countryData as CountryDataset;

export const countries: Country[] = dataset.countries;

export const countryById = new Map(countries.map((c) => [c.id, c]));

export const countryByMapName = new Map(countries.map((c) => [c.mapName, c]));

import { getLinkedCountryIds } from "@/lib/country-links";

export function getNeighborCountries(countryId: string): Country[] {
  const country = countryById.get(countryId);
  if (!country) return [];

  return getLinkedCountryIds(country)
    .map((id) => countryById.get(id))
    .filter((c): c is Country => c !== undefined);
}

export function getDailyPool(): Country[] {
  return countries.filter((c) => c.inDailyPool);
}

export function isPlayableCountryId(countryId: string): boolean {
  return countryById.has(countryId);
}
