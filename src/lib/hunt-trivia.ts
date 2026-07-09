import countryData from "@/data/countries.json";
import curatedFacts from "@/data/hunt-country-facts.json";
import { countryById } from "@/lib/game-data";
import { MAX_HUNT_GUESSES } from "@/lib/hunt-scoring";
import type { CountryDataset } from "@/types/country";

const dataset = countryData as CountryDataset;
const CURATED = curatedFacts as Record<string, string[]>;

function hashSeed(seed: string): number {
  let hash = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    hash ^= seed.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function mulberry32(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffleIndices(length: number, seed: string): number[] {
  const indices = Array.from({ length }, (_, index) => index);
  const rng = mulberry32(hashSeed(seed));
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [indices[i], indices[j]] = [indices[j]!, indices[i]!];
  }
  return indices;
}

function dedupeFacts(facts: string[]): string[] {
  const seen = new Set<string>();
  const unique: string[] = [];
  for (const fact of facts) {
    const trimmed = fact.trim();
    if (!trimmed || seen.has(trimmed)) continue;
    seen.add(trimmed);
    unique.push(trimmed);
  }
  return unique;
}

function buildFallbackFacts(countryId: string): string[] {
  const country = countryById.get(countryId) ?? dataset.countries.find((c) => c.id === countryId);
  if (!country) {
    return [
      "Today's hidden nation is one of dozens of sovereign states on the globe.",
      "Every incorrect guess still narrows the search — distance is your compass.",
      "The target country has a unique shape on the map if you know where to look.",
      "Think about climate bands: tropical, temperate, or polar can rule out whole regions.",
      "Border geometry often matters more than famous cities when you're hunting blind.",
    ];
  }

  const neighbors = country.neighbors ?? [];
  const name = country.name;
  const letters = name.replace(/[^a-z]/gi, "");
  const facts: string[] = [];

  if (neighbors.length === 0) {
    facts.push(
      "Today's mystery nation has no land borders — every edge meets the sea.",
    );
  } else if (neighbors.length === 1) {
    facts.push(
      "Only one other country shares a land border with the nation you're hunting.",
    );
  } else {
    facts.push(
      `The hidden country shares land borders with exactly ${neighbors.length} other nations.`,
    );
  }

  const wordCount = name.trim().split(/\s+/).length;
  facts.push(
    wordCount === 1
      ? "Its English name is a single word."
      : `Its English name is written as ${wordCount} words in English.`,
  );

  facts.push(
    letters.length <= 6
      ? "The English name is relatively short — six letters or fewer."
      : letters.length >= 12
        ? "The English name is a long one — twelve letters or more."
        : "The English name is a medium-length one — between seven and eleven letters.",
  );

  const firstChar = letters[0]?.toUpperCase() ?? "A";
  facts.push(
    firstChar <= "M"
      ? "The English name starts with a letter from A through M."
      : "The English name starts with a letter from N through Z.",
  );

  const vowels = (letters.match(/[aeiou]/gi) ?? []).length;
  facts.push(
    `The English name contains ${vowels} vowel${vowels === 1 ? "" : "s"} — no spaces counted.`,
  );

  facts.push(
    neighbors.length >= 4
      ? "It's a crossroads nation — four or more countries touch its borders."
      : "It isn't one of the world's most crowded border zones — fewer than four land neighbors.",
  );

  return dedupeFacts(facts);
}

export function getHuntTriviaFactsForCountry(countryId: string): string[] {
  const curated = CURATED[countryId] ?? [];
  const merged = dedupeFacts([...curated, ...buildFallbackFacts(countryId)]);

  while (merged.length < MAX_HUNT_GUESSES) {
    merged.push(
      "Keep using distance and direction — each guess reveals more than the miles alone.",
    );
  }

  return merged;
}

function getFactOrder(countryId: string, date: string, factCount: number): number[] {
  return shuffleIndices(factCount, `${date}-hunt-trivia-${countryId}`);
}

export function getHuntTriviaFact(
  countryId: string,
  date: string,
  wrongGuessIndex: number,
): string {
  const facts = getHuntTriviaFactsForCountry(countryId);
  const order = getFactOrder(countryId, date, facts.length);
  const safeIndex = Math.max(0, Math.min(wrongGuessIndex, MAX_HUNT_GUESSES - 1));
  return facts[order[safeIndex] ?? safeIndex] ?? facts[0]!;
}

export function getHuntCountryRevealFact(
  countryId: string,
  displayName: string,
): string {
  const facts = getHuntTriviaFactsForCountry(countryId);
  return (
    facts[0] ??
    `Today's country was ${displayName}. Every guess measured your distance from its center.`
  );
}
