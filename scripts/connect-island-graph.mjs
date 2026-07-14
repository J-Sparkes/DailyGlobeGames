#!/usr/bin/env node
/**
 * Ensures the Sweep adjacency graph is one connected component.
 * Adds nearest-country maritime bridges between disconnected regions
 * (and guarantees every island has a maritime link to its nearest neighbor).
 *
 * Writes src/data/maritime-links.json, then run: npm run sync-borders
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { geoCentroid } from "d3-geo";
import { feature, neighbors } from "topojson-client";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const countriesPath = join(root, "src/data/countries.json");
const topoPath = join(root, "public/world-countries-50m.json");
const maritimePath = join(root, "src/data/maritime-links.json");
const unPath = join(root, "src/data/un-countries.json");

function haversineKm(lat1, lng1, lat2, lng2) {
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function linkPair(graph, a, b) {
  if (!graph.has(a)) graph.set(a, new Set());
  if (!graph.has(b)) graph.set(b, new Set());
  graph.get(a).add(b);
  graph.get(b).add(a);
}

function components(graph, ids) {
  const seen = new Set();
  const comps = [];
  for (const id of ids) {
    if (seen.has(id)) continue;
    const stack = [id];
    const comp = [];
    seen.add(id);
    while (stack.length) {
      const cur = stack.pop();
      comp.push(cur);
      for (const next of graph.get(cur) ?? []) {
        if (!seen.has(next)) {
          seen.add(next);
          stack.push(next);
        }
      }
    }
    comps.push(comp);
  }
  return comps;
}

function serializeLinks(graph) {
  const pairs = [];
  const seen = new Set();
  for (const [a, neighbors] of graph) {
    for (const b of neighbors) {
      const key = [a, b].sort().join("::");
      if (seen.has(key)) continue;
      seen.add(key);
      pairs.push([a, b].sort());
    }
  }
  return pairs.sort((x, y) => x[0].localeCompare(y[0]) || x[1].localeCompare(y[1]));
}

const dataset = JSON.parse(readFileSync(countriesPath, "utf8"));
const countries = dataset.countries;
const byMapName = new Map(countries.map((c) => [c.mapName, c]));
const byId = new Map(countries.map((c) => [c.id, c]));
const ids = countries.map((c) => c.id);

const topo = JSON.parse(readFileSync(topoPath, "utf8"));
const geometries = topo.objects.countries.geometries;
const landAdjacent = neighbors(geometries);

const centroids = new Map();
for (const geometry of geometries) {
  const name = geometry.properties?.name;
  if (!name || !byMapName.has(name)) continue;
  const geo = feature(topo, geometry);
  const [lng, lat] = geoCentroid(geo);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;
  centroids.set(byMapName.get(name).id, { lat, lng });
}

// Fallback to UN lat/lng when TopoJSON has no polygon (e.g. Tuvalu)
const unCountries = JSON.parse(readFileSync(unPath, "utf8")).countries ?? [];
for (const un of unCountries) {
  if (centroids.has(un.id)) continue;
  if (!Number.isFinite(un.lat) || !Number.isFinite(un.lng)) continue;
  if (!byId.has(un.id)) continue;
  centroids.set(un.id, { lat: un.lat, lng: un.lng });
  console.log(`Using UN coordinates for ${un.id} (no map polygon)`);
}

for (const country of countries) {
  if (centroids.has(country.id)) continue;
  console.warn(`No centroid for ${country.id} (${country.mapName}) — skipping nearest links for it`);
}

const maritimeSeed = JSON.parse(readFileSync(maritimePath, "utf8"));
const maritimeByName = new Map();
for (const [a, b] of maritimeSeed) {
  linkPair(maritimeByName, a, b);
}

const graph = new Map(ids.map((id) => [id, new Set()]));

// Land borders from TopoJSON
geometries.forEach((geometry, index) => {
  const name = geometry.properties?.name;
  const country = byMapName.get(name);
  if (!country) return;
  for (const neighborIndex of landAdjacent[index] ?? []) {
    const neighborName = geometries[neighborIndex]?.properties?.name;
    const neighbor = byMapName.get(neighborName);
    if (!neighbor) continue;
    linkPair(graph, country.id, neighbor.id);
  }
});

// Existing curated maritime links
for (const [aName, bName] of maritimeSeed) {
  const a = byMapName.get(aName);
  const b = byMapName.get(bName);
  if (!a || !b) {
    throw new Error(`Maritime link missing country: ${aName} ↔ ${bName}`);
  }
  linkPair(graph, a.id, b.id);
  linkPair(maritimeByName, aName, bName);
}

function nearestAcross(fromIds, toIds) {
  let best = null;
  for (const a of fromIds) {
    const ca = centroids.get(a);
    if (!ca) continue;
    for (const b of toIds) {
      const cb = centroids.get(b);
      if (!cb) continue;
      const km = haversineKm(ca.lat, ca.lng, cb.lat, cb.lng);
      if (!best || km < best.km) best = { a, b, km };
    }
  }
  return best;
}

function addMaritimeBridge(aId, bId, reason) {
  const a = byId.get(aId);
  const b = byId.get(bId);
  if (!a || !b) return false;
  if (graph.get(aId)?.has(bId)) return false;
  linkPair(graph, aId, bId);
  linkPair(maritimeByName, a.mapName, b.mapName);
  console.log(
    `+ maritime ${a.mapName} ↔ ${b.mapName} (${Math.round(reason.km)} km) [${reason.kind}]`,
  );
  return true;
}

// 1) Every island (no TopoJSON land borders among playable countries) needs a maritime link
const landOnly = new Map(ids.map((id) => [id, new Set()]));
geometries.forEach((geometry, index) => {
  const name = geometry.properties?.name;
  const country = byMapName.get(name);
  if (!country) return;
  for (const neighborIndex of landAdjacent[index] ?? []) {
    const neighborName = geometries[neighborIndex]?.properties?.name;
    const neighbor = byMapName.get(neighborName);
    if (!neighbor) continue;
    linkPair(landOnly, country.id, neighbor.id);
  }
});

for (const country of countries) {
  const isIsland = (landOnly.get(country.id)?.size ?? 0) === 0;
  if (!isIsland) continue;
  if ((graph.get(country.id)?.size ?? 0) > 0) continue;
  if (!centroids.has(country.id)) {
    throw new Error(`Island ${country.id} has no centroid and no links`);
  }
  const others = ids.filter((id) => id !== country.id && centroids.has(id));
  const best = nearestAcross([country.id], others);
  if (!best) {
    throw new Error(`Could not find nearest neighbor for island ${country.id}`);
  }
  addMaritimeBridge(best.a, best.b, { km: best.km, kind: "island-nearest" });
}

// 2) Bridge disconnected components with shortest cross-region links (Kruskal-style)
let comps = components(graph, ids);
let guard = 0;
while (comps.length > 1 && guard < 200) {
  guard += 1;
  let best = null;
  for (let i = 0; i < comps.length; i++) {
    for (let j = i + 1; j < comps.length; j++) {
      const pair = nearestAcross(comps[i], comps[j]);
      if (pair && (!best || pair.km < best.km)) {
        best = { ...pair, kind: "component-bridge" };
      }
    }
  }
  if (!best) {
    throw new Error("Unable to bridge remaining components — missing centroids?");
  }
  addMaritimeBridge(best.a, best.b, best);
  comps = components(graph, ids);
}

if (comps.length !== 1) {
  throw new Error(`Graph still has ${comps.length} components`);
}

const links = serializeLinks(maritimeByName);
writeFileSync(maritimePath, `${JSON.stringify(links, null, 2)}\n`);
console.log(
  `Wrote ${links.length} maritime pairs. Connected component size: ${comps[0].length}/${ids.length}`,
);
