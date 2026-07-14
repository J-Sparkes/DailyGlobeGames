#!/usr/bin/env node
/**
 * Syncs countries.json land_borders from TopoJSON and maritime_links from
 * src/data/maritime-links.json. Enforces bidirectional integrity.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { neighbors } from "topojson-client";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const countriesPath = join(root, "src/data/countries.json");
const topoPath = join(root, "public/world-countries-50m.json");
const maritimePath = join(root, "src/data/maritime-links.json");

function linkPair(graph, a, b) {
  if (!graph.has(a)) graph.set(a, new Set());
  if (!graph.has(b)) graph.set(b, new Set());
  graph.get(a).add(b);
  graph.get(b).add(a);
}

function buildLandGraph() {
  const topo = JSON.parse(readFileSync(topoPath, "utf8"));
  const geometries = topo.objects.countries.geometries;
  const adjacent = neighbors(geometries);
  const graph = new Map();

  geometries.forEach((geometry, index) => {
    const name = geometry.properties?.name;
    if (!name) return;
    if (!graph.has(name)) graph.set(name, new Set());

    for (const neighborIndex of adjacent[index] ?? []) {
      const neighborName = geometries[neighborIndex]?.properties?.name;
      if (neighborName) linkPair(graph, name, neighborName);
    }
  });

  return graph;
}

function buildMaritimeGraph(maritimeLinks) {
  const graph = new Map();
  for (const [a, b] of maritimeLinks) {
    if (!a || !b) {
      throw new Error(`Invalid maritime link: ${JSON.stringify([a, b])}`);
    }
    linkPair(graph, a, b);
  }
  return graph;
}

function mapNamesToIds(mapNames, byMapName) {
  return [...mapNames]
    .map((mapName) => byMapName.get(mapName)?.id)
    .filter(Boolean)
    .sort();
}

function syncCountryLinks(countries, landGraph, maritimeGraph) {
  const byMapName = new Map(countries.map((country) => [country.mapName, country]));
  const byId = new Map(countries.map((country) => [country.id, country]));
  const errors = [];

  for (const country of countries) {
    const landMapNames = landGraph.get(country.mapName) ?? new Set();
    const maritimeMapNames = maritimeGraph.get(country.mapName) ?? new Set();

    country.land_borders = mapNamesToIds(landMapNames, byMapName);
    country.maritime_links = mapNamesToIds(maritimeMapNames, byMapName);

    if ("neighbors" in country) delete country.neighbors;
  }

  for (const country of countries) {
    for (const field of ["land_borders", "maritime_links"]) {
      for (const neighborId of country[field]) {
        const neighbor = byId.get(neighborId);
        if (!neighbor) {
          errors.push(`${country.id} references missing ${field} target ${neighborId}`);
          continue;
        }
        if (!neighbor[field].includes(country.id)) {
          errors.push(
            `Bidirectional mismatch (${field}): ${country.id} -> ${neighborId} but not reverse`,
          );
        }
      }
    }

    const totalLinks = country.land_borders.length + country.maritime_links.length;
    if (country.inDailyPool && totalLinks === 0) {
      errors.push(`${country.id} is in daily pool but has no land or maritime links`);
    }
  }

  return errors;
}

const dataset = JSON.parse(readFileSync(countriesPath, "utf8"));
const maritimeLinks = JSON.parse(readFileSync(maritimePath, "utf8"));
const landGraph = buildLandGraph();
const maritimeGraph = buildMaritimeGraph(maritimeLinks);
const errors = syncCountryLinks(dataset.countries, landGraph, maritimeGraph);

if (errors.length > 0) {
  console.error("Border sync failed:");
  for (const error of errors) console.error(`  ERROR: ${error}`);
  process.exit(1);
}

dataset.updatedAt = new Date().toISOString().slice(0, 10);
writeFileSync(countriesPath, `${JSON.stringify(dataset, null, 2)}\n`);
console.log(
  `Synced ${dataset.countries.length} countries (${dataset.countries.filter((c) => c.inDailyPool).length} in daily pool).`,
);
