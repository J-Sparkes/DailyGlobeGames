import Fuse from "fuse.js";
import { countries } from "@/lib/game-data";
import type { Country } from "@/types/country";

export const FUSE_THRESHOLD = 0.35;
export const MIN_MATCH_CHAR_LENGTH = 2;

const FUSE_OPTIONS = {
  threshold: FUSE_THRESHOLD,
  ignoreLocation: true,
  isCaseSensitive: false,
  minMatchCharLength: MIN_MATCH_CHAR_LENGTH,
  includeScore: true,
};

const fuseCache = new Map<string, Fuse<string>>();

function stripDiacritics(value: string): string {
  return value.normalize("NFD").replace(/\p{M}/gu, "");
}

function normalizeInput(input: string): string {
  return stripDiacritics(input.trim().replace(/\s+/g, " "));
}

export function expandAliases(aliases: string[]): string[] {
  const expanded = new Set<string>();

  for (const alias of aliases) {
    const trimmed = alias.trim();
    if (!trimmed) continue;

    expanded.add(trimmed);
    expanded.add(stripDiacritics(trimmed));
  }

  return [...expanded];
}

function getFuseForCountry(country: Country): Fuse<string> {
  const cached = fuseCache.get(country.id);
  if (cached) return cached;

  const fuse = new Fuse(expandAliases(country.aliases), FUSE_OPTIONS);
  fuseCache.set(country.id, fuse);
  return fuse;
}

export function clearAnswerCheckCache(): void {
  fuseCache.clear();
}

function matchesExactly(normalized: string, country: Country): boolean {
  const normalizedLower = normalized.toLowerCase();
  return expandAliases(country.aliases).some(
    (alias) => stripDiacritics(alias).toLowerCase() === normalizedLower,
  );
}

function getBestFuzzyMatch(
  normalized: string,
): { countryId: string; score: number } | null {
  let best: { countryId: string; score: number } | null = null;

  for (const candidate of countries) {
    const results = getFuseForCountry(candidate).search(normalized);
    const top = results[0];
    if (!top || top.score === undefined) continue;

    if (!best || top.score < best.score) {
      best = { countryId: candidate.id, score: top.score };
    }
  }

  return best;
}

export function isCorrectAnswer(input: string, country: Country): boolean {
  const normalized = normalizeInput(input);
  if (!normalized) return false;

  if (matchesExactly(normalized, country)) {
    return true;
  }

  if (normalized.length < MIN_MATCH_CHAR_LENGTH) return false;

  const bestMatch = getBestFuzzyMatch(normalized);
  if (!bestMatch) return false;

  return (
    bestMatch.countryId === country.id && bestMatch.score <= FUSE_THRESHOLD
  );
}
