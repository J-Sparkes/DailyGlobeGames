#!/usr/bin/env node
/**
 * Syncs countries.json neighbor arrays from TopoJSON land borders + maritime-links.
 * Enforces bidirectional integrity within the playable country pool.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { neighbors } from "topojson-client";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const countriesPath = join(root, "src/data/countries.json");
const topoPath = join(root, "public/world-countries-110m.json");
const maritimePath = join(root, "src/data/maritime-links.json");

function linkPair(graph, a, b) {
  if (!graph.has(a)) graph.set(a, new Set());
  if (!graph.has(b)) graph.set(b, new Set());
  graph.get(a).add(b);
  graph.get(b).add(a);
}

function buildBorderGraph() {
  const topo = JSON.parse(readFileSync(topoPath, "utf8"));
  const maritimeLinks = JSON.parse(readFileSync(maritimePath, "utf8"));
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

  for (const [a, b] of maritimeLinks) {
    if (!a || !b) throw new Error(`Invalid maritime link: ${JSON.stringify([a, b])}`);
    linkPair(graph, a, b);
  }

  return graph;
}

function syncNeighbors(countries, graph) {
  const byMapName = new Map(countries.map((country) => [country.mapName, country]));
  const byId = new Map(countries.map((country) => [country.id, country]));
  const errors = [];

  for (const country of countries) {
    const mapNeighbors = graph.get(country.mapName) ?? new Set();
    const neighborIds = [...mapNeighbors]
      .map((mapName) => byMapName.get(mapName)?.id)
      .filter(Boolean)
      .sort();

    country.neighbors = neighborIds;
  }

  for (const country of countries) {
    for (const neighborId of country.neighbors) {
      const neighbor = byId.get(neighborId);
      if (!neighbor) {
        errors.push(`${country.id} references missing neighbor ${neighborId}`);
        continue;
      }
      if (!neighbor.neighbors.includes(country.id)) {
        errors.push(
          `Bidirectional mismatch: ${country.id} -> ${neighborId} but not reverse`,
        );
      }
    }
  }

  return errors;
}

const dataset = JSON.parse(readFileSync(countriesPath, "utf8"));
const graph = buildBorderGraph();
const errors = syncNeighbors(dataset.countries, graph);

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
