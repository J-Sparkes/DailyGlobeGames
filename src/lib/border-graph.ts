import maritimeLinks from "@/data/maritime-links.json";
import { countryById } from "@/lib/game-data";
import { getMapName } from "@/lib/country-resolve";
import { toCountryId } from "@/lib/country-id";
import type {
  GeometryCollection,
  Topology,
} from "topojson-specification";

type CountryGeometry = GeometryCollection["geometries"][number] & {
  properties?: { name?: string };
};

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

export async function loadBorderGraph(): Promise<Map<string, Set<string>>> {
  if (neighborByMapName) return neighborByMapName;
  if (loadPromise) return loadPromise;

  loadPromise = (async () => {
    const { neighbors } = await import("topojson-client");
    const response = await fetch("/world-countries-110m.json");
    const topo = (await response.json()) as Topology<{
      countries: GeometryCollection;
    }>;

    const geometries = topo.objects.countries.geometries as CountryGeometry[];

    const graph = new Map<string, Set<string>>();
    const adjacent = neighbors(geometries) as number[][];

    geometries.forEach((geometry, index) => {
      const props = geometry.properties as { name?: string } | null;
      const name = props?.name;
      if (!name) return;
      if (!graph.has(name)) graph.set(name, new Set());

      for (const neighborIndex of adjacent[index] ?? []) {
        const neighborProps = geometries[neighborIndex]?.properties as {
          name?: string;
        } | null;
        const neighborName = neighborProps?.name;
        if (neighborName) linkPair(graph, name, neighborName);
      }
    });

    for (const [a, b] of maritimeLinks as [string, string][]) {
      linkPair(graph, a, b);
    }

    neighborByMapName = graph;
    return graph;
  })();

  return loadPromise;
}

export function getBorderingCountryIds(mapName: string): string[] {
  if (!neighborByMapName) return [];

  const neighbors = neighborByMapName.get(mapName);
  if (!neighbors) return [];

  return [...neighbors].map(toCountryId);
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
