import { readFileSync } from "node:fs";
import { join } from "node:path";
import maritimeLinks from "@/data/maritime-links.json";
import { neighbors } from "topojson-client";
import type {
  GeometryCollection,
  Topology,
} from "topojson-specification";

type CountryGeometry = GeometryCollection["geometries"][number] & {
  properties?: { name?: string };
};

let neighborByMapName: Map<string, Set<string>> | null = null;

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

export function loadServerBorderGraph(): Map<string, Set<string>> {
  if (neighborByMapName) return neighborByMapName;

  const filePath = join(process.cwd(), "public/world-countries-110m.json");
  const raw = readFileSync(filePath, "utf8");
  const topo = JSON.parse(raw) as Topology<{
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
}
