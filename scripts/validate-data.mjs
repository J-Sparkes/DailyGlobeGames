#!/usr/bin/env node
/**
 * Validates country and location datasets against basic integrity rules.
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
let errors = 0;

function fail(message) {
  console.error(`ERROR: ${message}`);
  errors++;
}

function loadJson(path) {
  return JSON.parse(readFileSync(join(root, path), "utf8"));
}

// --- Countries ---
const countriesData = loadJson("src/data/countries.json");
const countries = countriesData.countries;
const countryIds = new Set(countries.map((c) => c.id));

const neighborIndex = new Map(countries.map((country) => [country.id, country]));

for (const country of countries) {
  if (!country.id || !country.name || !country.mapName) {
    fail(`Country missing required fields: ${JSON.stringify(country.id)}`);
  }
  for (const neighbor of country.neighbors) {
    if (!countryIds.has(neighbor)) {
      fail(`${country.id} references unknown neighbor ${neighbor}`);
      continue;
    }
    const reverse = neighborIndex.get(neighbor);
    if (!reverse.neighbors.includes(country.id)) {
      fail(
        `Bidirectional mismatch: ${country.id} -> ${neighbor} but not reverse`,
      );
    }
  }
  if (country.inDailyPool && country.neighbors.length === 0) {
    fail(`${country.id} is in daily pool but has no neighbors`);
  }
}

const dailyPool = countries.filter((c) => c.inDailyPool);
console.log(`Countries: ${countries.length}, daily pool: ${dailyPool.length}`);

if (dailyPool.length < 20) {
  fail(`Daily pool too small (${dailyPool.length}); need at least 20`);
}

// --- Locations ---
const locations = loadJson("src/data/locations.json");
for (const loc of locations) {
  if (!loc.id || !loc.prompt || typeof loc.lat !== "number" || typeof loc.lng !== "number") {
    fail(`Invalid location: ${loc.id ?? "unknown"}`);
  }
  if (loc.difficulty < 1 || loc.difficulty > 5) {
    fail(`Location ${loc.id} has invalid difficulty`);
  }
}

console.log(`Locations: ${locations.length}`);

if (locations.length < 5) {
  fail("Need at least 5 locations for Tap mode");
}

if (errors > 0) {
  process.exit(1);
}

console.log("Data validation passed.");
