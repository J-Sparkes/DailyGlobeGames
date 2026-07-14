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

if (countries.length !== 197) {
  fail(`Playable country set must be 197 UN countries (got ${countries.length})`);
}

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

// Playable graph must be one connected component (Sweep can reach every country)
{
  const graph = new Map(countries.map((c) => [c.id, new Set()]));
  for (const country of countries) {
    for (const neighbor of [
      ...(country.land_borders ?? []),
      ...(country.maritime_links ?? []),
    ]) {
      if (!countryIds.has(neighbor)) continue;
      graph.get(country.id).add(neighbor);
      graph.get(neighbor).add(country.id);
    }
  }

  const start = countries[0]?.id;
  const seen = new Set();
  if (start) {
    const stack = [start];
    seen.add(start);
    while (stack.length) {
      const cur = stack.pop();
      for (const next of graph.get(cur) ?? []) {
        if (!seen.has(next)) {
          seen.add(next);
          stack.push(next);
        }
      }
    }
  }

  if (seen.size !== countries.length) {
    fail(
      `Country graph is disconnected (${seen.size}/${countries.length} reachable). Run: node scripts/connect-island-graph.mjs && npm run sync-borders`,
    );
  } else {
    console.log(`Country graph: 1 connected component (${countries.length} countries)`);
  }
}

// --- UN world set must match playable countries ---
const unData = loadJson("src/data/un-countries.json");
const unCountries = unData.countries ?? [];
const unCountryIds = new Set(unCountries.map((c) => c.id));

if (unCountries.length !== 197) {
  fail(`UN country set must have 197 entries (got ${unCountries.length})`);
}

for (const id of countryIds) {
  if (!unCountryIds.has(id)) {
    fail(`Playable country ${id} missing from un-countries.json`);
  }
}
for (const id of unCountryIds) {
  if (!countryIds.has(id)) {
    fail(`UN country ${id} missing from countries.json`);
  }
}

for (const country of unCountries) {
  if (!country.id || !country.name || !country.capital) {
    fail(`UN country missing required fields: ${JSON.stringify(country.id)}`);
  }
  if (typeof country.lat !== "number" || typeof country.lng !== "number") {
    fail(`UN country ${country.id} missing coordinates`);
  }
}

console.log(`UN countries: ${unCountries.length} (aligned with playable set)`);

// --- Locations (Tap) ---
const locations = loadJson("src/data/locations.json");
const locationIds = new Set();
const tapCountryCoverage = new Set();

for (const loc of locations) {
  if (!loc.id || !loc.prompt || typeof loc.lat !== "number" || typeof loc.lng !== "number") {
    fail(`Invalid location: ${loc.id ?? "unknown"}`);
  }
  if (locationIds.has(loc.id)) {
    fail(`Duplicate Tap location id ${loc.id}`);
  }
  locationIds.add(loc.id);
  if (loc.difficulty < 1 || loc.difficulty > 5) {
    fail(`Location ${loc.id} has invalid difficulty`);
  }
  if (loc.countryId) {
    if (!unCountryIds.has(loc.countryId)) {
      fail(`Location ${loc.id} references unknown UN countryId ${loc.countryId}`);
    }
    tapCountryCoverage.add(loc.countryId);
  }
}

for (const country of unCountries) {
  if (!tapCountryCoverage.has(country.id)) {
    fail(`Tap locations missing coverage for UN country ${country.id}`);
  }
}

console.log(
  `Locations: ${locations.length} (UN coverage ${tapCountryCoverage.size}/${unCountries.length})`,
);

if (tapCountryCoverage.size < 197) {
  fail(
    `Need Tap coverage for all 197 UN countries (have ${tapCountryCoverage.size})`,
  );
}

// --- Quiz trivia bank ---
const triviaCountries = loadJson("src/data/trivia-countries.json");
let triviaCovered = 0;
for (const country of unCountries) {
  const clues = triviaCountries[country.id];
  if (!Array.isArray(clues) || clues.length < 5) {
    fail(
      `Quiz trivia missing 5 clues for ${country.id} (have ${Array.isArray(clues) ? clues.length : 0})`,
    );
    continue;
  }
  for (const clue of clues) {
    if (typeof clue !== "string" || !clue.trim()) {
      fail(`Quiz trivia has an empty clue for ${country.id}`);
      break;
    }
  }
  triviaCovered++;
}

for (const id of Object.keys(triviaCountries)) {
  if (!unCountryIds.has(id)) {
    fail(`Quiz trivia has unknown country id ${id}`);
  }
}

console.log(`Quiz trivia: ${triviaCovered}/${unCountries.length} UN countries covered`);

if (triviaCovered < unCountries.length) {
  fail(`Quiz trivia must cover every UN country (${triviaCovered}/${unCountries.length})`);
}

if (errors > 0) {
  process.exit(1);
}

console.log("Data validation passed.");
