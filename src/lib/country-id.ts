import { countryByMapName } from "@/lib/game-data";

export function toCountryId(mapName: string): string {
  const fromDataset = countryByMapName.get(mapName);
  if (fromDataset) return fromDataset.id;

  return mapName
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}
