import { countries, countryById } from "@/lib/game-data";
import { getLinkedCountryIds } from "@/lib/country-links";
import { getMapName } from "@/lib/country-resolve";
import { toCountryId } from "@/lib/country-id";

let neighborByMapName: Map<string, Set<string>> | null = null;
let loadPromise: Promise<Map<string, Set<string>>> | null = null;

function linkPair(
  graph: Map<string, Set<string>>,
  a: string,
  b: string,
): void {
  if (!graph.has(a)) graph.set(a, new Set());
  if (!graph.has(b)) graph.set(b, new Set());
  graph.get(a)!.add(b);
  graph.get(b)!.add(a);
}

function buildBorderGraphFromCountries(): Map<string, Set<string>> {
  const graph = new Map<string, Set<string>>();

  for (const country of countries) {
    if (!graph.has(country.mapName)) {
      graph.set(country.mapName, new Set());
    }

    for (const neighborId of getLinkedCountryIds(country)) {
      const neighbor = countryById.get(neighborId);
      if (!neighbor) continue;
      linkPair(graph, country.mapName, neighbor.mapName);
    }
  }

  return graph;
}

export async function loadBorderGraph(): Promise<Map<string, Set<string>>> {
  if (neighborByMapName) return neighborByMapName;
  if (loadPromise) return loadPromise;

  loadPromise = Promise.resolve().then(() => {
    neighborByMapName = buildBorderGraphFromCountries();
    return neighborByMapName;
  });

  return loadPromise;
}

export function getBorderingCountryIds(mapName: string): string[] {
  if (!neighborByMapName) return [];

  const linkedMapNames = neighborByMapName.get(mapName);
  if (!linkedMapNames) return [];

  return [...linkedMapNames].map(toCountryId);
}

export function getFrontierCountryIds(claimedIds: string[]): string[] {
  if (!neighborByMapName || claimedIds.length === 0) return [];

  const claimedSet = new Set(claimedIds);
  const frontier = new Set<string>();

  for (const claimedId of claimedIds) {
    const mapName = getMapName(claimedId);
    if (!mapName) continue;

    for (const neighborId of getBorderingCountryIds(mapName)) {
      if (!claimedSet.has(neighborId) && countryById.has(neighborId)) {
        frontier.add(neighborId);
      }
    }
  }

  return [...frontier];
}

/** @internal Resets cached graph — for tests only. */
export function clearBorderGraphCache(): void {
  neighborByMapName = null;
  loadPromise = null;
}
