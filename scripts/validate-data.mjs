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

function validateLinkField(countries, countryIds, neighborIndex, field) {
  for (const country of countries) {
    for (const neighbor of country[field] ?? []) {
      if (!countryIds.has(neighbor)) {
        fail(`${country.id} references unknown ${field} target ${neighbor}`);
        continue;
      }
      const reverse = neighborIndex.get(neighbor);
      if (!reverse[field]?.includes(country.id)) {
        fail(
          `Bidirectional mismatch (${field}): ${country.id} -> ${neighbor} but not reverse`,
        );
      }
    }
  }
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
  if (!Array.isArray(country.land_borders) || !Array.isArray(country.maritime_links)) {
    fail(`${country.id} must define land_borders and maritime_links arrays`);
  }
}

validateLinkField(countries, countryIds, neighborIndex, "land_borders");
validateLinkField(countries, countryIds, neighborIndex, "maritime_links");

for (const country of countries) {
  const totalLinks = country.land_borders.length + country.maritime_links.length;
  if (country.inDailyPool && totalLinks === 0) {
    fail(`${country.id} is in daily pool but has no land or maritime links`);
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
