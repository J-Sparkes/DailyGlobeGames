#!/usr/bin/env node
/**
 * Rebuild UN world datasets used by Tap + Quiz.
 *
 * Source definition of 197:
 *   193 UN member states
 * + Holy See (Vatican City) and Palestine (UN observers)
 * + Cook Islands and Niue (UN-associated states in free association with NZ)
 *
 * Requires: /tmp/mledoze-countries.json
 *   curl -sL https://raw.githubusercontent.com/mledoze/countries/master/countries.json \
 *     -o /tmp/mledoze-countries.json
 *
 * Usage: node scripts/build-un-world-data.mjs
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function loadJson(rel) {
  return JSON.parse(readFileSync(join(root, rel), "utf8"));
}

const mledoze = JSON.parse(readFileSync("/tmp/mledoze-countries.json", "utf8"));
const playable = loadJson("src/data/countries.json").countries;
const existingTrivia = loadJson("src/data/trivia-countries.json");
const existingLocations = loadJson("src/data/locations.json");

const playableByIso = new Map(
  playable.map((c) => [String(c.iso3166Alpha2 || "").toUpperCase(), c]),
);

function toId(name) {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function difficultyFor(cca2, region) {
  const easy = new Set([
    "US", "GB", "FR", "DE", "IT", "ES", "CN", "JP", "IN", "BR", "AU", "CA",
    "RU", "MX", "EG", "KR", "NL", "SE", "NO", "CH",
  ]);
  const hard = new Set([
    "TV", "NR", "PW", "KI", "ST", "KM", "SC", "WS", "TO", "FM", "MH", "LI",
    "SM", "AD", "MC", "VA", "CK", "NU",
  ]);
  if (easy.has(cca2)) return 1;
  if (hard.has(cca2)) return 5;
  if (region === "Europe" || region === "Americas") return 2;
  if (region === "Asia" || region === "Africa") return 3;
  return 4;
}

const members = mledoze.filter((c) => c.unMember && c.cca3 !== "VAT");
const extras = ["VAT", "PSE", "COK", "NIU"].map((cca3) =>
  mledoze.find((c) => c.cca3 === cca3),
);
const source = [...members, ...extras];
if (source.length !== 197) {
  console.error(`Expected 197 countries, got ${source.length}`);
  process.exit(1);
}

const unCountries = [];
const usedIds = new Set();

for (const c of source) {
  const iso2 = c.cca2;
  const play = playableByIso.get(iso2);
  let id = play?.id ?? toId(c.name.common);
  if (usedIds.has(id) && !play) id = `${id}-${iso2.toLowerCase()}`;
  usedIds.add(id);

  const capital = c.capital?.[0] ?? c.name.common;
  const [lat, lng] = c.latlng;
  const aliases = Array.from(
    new Set(
      [
        c.name.common,
        c.name.official,
        ...(c.altSpellings || []),
        play?.name,
        play?.mapName,
        ...(play?.aliases || []),
      ].filter(Boolean),
    ),
  );

  let unStatus = "member";
  if (c.cca3 === "VAT" || c.cca3 === "PSE") unStatus = "observer";
  if (c.cca3 === "COK" || c.cca3 === "NIU") unStatus = "associated";

  unCountries.push({
    id,
    name: play?.name ?? c.name.common,
    officialName: c.name.official,
    iso2,
    iso3: c.cca3,
    capital,
    lat,
    lng,
    region: c.region || "",
    subregion: c.subregion || "",
    landlocked: Boolean(c.landlocked),
    borders: Array.isArray(c.borders) ? c.borders.length : 0,
    aliases,
    unStatus,
    inSweepPool: Boolean(play),
  });
}

unCountries.sort((a, b) => a.name.localeCompare(b.name));

writeFileSync(
  join(root, "src/data/un-countries.json"),
  `${JSON.stringify(
    {
      meta: {
        count: 197,
        note: "193 UN members + Holy See + Palestine + Cook Islands + Niue",
      },
      countries: unCountries,
    },
    null,
    2,
  )}\n`,
);

const KEEP_EXTRA = new Set([
  "petra", "machu-picchu", "great-wall", "angkor-wat", "timbuktu", "galapagos",
  "berlin-wall", "everest", "antarctica-pole", "easter-island", "lake-baikal",
  "sahara-center", "svalbard", "okinawa", "kyoto",
]);

const locations = [];
const locIds = new Set();

for (const c of unCountries) {
  const prior = existingLocations.find((l) => l.countryId === c.id || l.id === c.id);
  const lat = prior?.lat ?? c.lat;
  const lng = prior?.lng ?? c.lng;
  const name = prior?.name && prior.countryId === c.id ? prior.name : c.capital;
  locations.push({
    id: c.id,
    name,
    prompt: `${name}, ${c.name}`,
    lat,
    lng,
    difficulty: difficultyFor(c.iso2, c.region),
    category: "city",
    countryId: c.id,
    fact:
      prior?.fact && prior.countryId === c.id
        ? prior.fact
        : `${c.capital} is the capital of ${c.name}.`,
  });
  locIds.add(c.id);
}

for (const loc of existingLocations) {
  if (!KEEP_EXTRA.has(loc.id) || locIds.has(loc.id)) continue;
  const { countryId: _countryId, ...rest } = loc;
  locations.push(rest);
  locIds.add(loc.id);
}

locations.sort((a, b) => a.id.localeCompare(b.id));
const locationsJson = `${JSON.stringify(locations, null, 2)}\n`;
writeFileSync(join(root, "src/data/locations.json"), locationsJson);
writeFileSync(join(root, "src/data/locations.mock.json"), locationsJson);

const trivia = {};
for (const c of unCountries) {
  if (Array.isArray(existingTrivia[c.id]) && existingTrivia[c.id].length >= 5) {
    trivia[c.id] = existingTrivia[c.id].slice(0, 5);
    continue;
  }

  const clues = [];
  if (c.subregion) clues.push(`It is located in ${c.subregion}.`);
  else if (c.region) clues.push(`It is located in ${c.region}.`);
  else clues.push("It is one of the world's recognized countries.");

  if (c.landlocked) {
    clues.push("It is landlocked — no coastline of its own.");
  } else if (c.borders === 0) {
    clues.push("It has no land borders — water surrounds it.");
  } else {
    clues.push(
      c.borders === 1
        ? "It shares a land border with exactly one other country."
        : `It shares land borders with ${c.borders} other countries.`,
    );
  }

  const words = c.name.trim().split(/\s+/).length;
  clues.push(
    words === 1
      ? "Its common English name is a single word."
      : `Its common English name is written as ${words} words.`,
  );

  const letters = c.name.replace(/[^a-z]/gi, "");
  clues.push(
    letters.length <= 6
      ? "Its English name is short — six letters or fewer."
      : letters.length >= 12
        ? "Its English name is long — twelve letters or more."
        : "Its English name is medium length — seven to eleven letters.",
  );

  clues.push(`Its capital city is ${c.capital}.`);
  trivia[c.id] = clues.slice(0, 5);
}

writeFileSync(
  join(root, "src/data/trivia-countries.json"),
  `${JSON.stringify(trivia, null, 2)}\n`,
);

console.log(`Wrote ${unCountries.length} UN countries, ${locations.length} locations, ${Object.keys(trivia).length} trivia entries.`);
