import { countryById } from "@/lib/game-data";
import type { Country } from "@/types/country";

const mapNameById = new Map<string, string>();

export function registerMapCountry(mapName: string, countryId: string): void {
  mapNameById.set(countryId, mapName);
}

export function getMapName(countryId: string): string | undefined {
  return countryById.get(countryId)?.mapName ?? mapNameById.get(countryId);
}

export function resolveCountry(countryId: string): Country | undefined {
  const fromDataset = countryById.get(countryId);
  if (fromDataset) return fromDataset;

  const mapName = mapNameById.get(countryId);
  if (!mapName) return undefined;

  return {
    id: countryId,
    name: mapName,
    mapName,
    aliases: [mapName],
    neighbors: [],
    inDailyPool: false,
  };
}

export function getCountryDisplayName(countryId: string): string {
  return resolveCountry(countryId)?.name ?? countryId;
}
