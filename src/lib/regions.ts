/**
 * Country names as they appear in `public/world-countries-50m.json` (world-atlas@2).
 * In-focus: Europe plus connecting landmasses (Russia, Turkey, Morocco, Caucasus).
 * Everything else is dimmed on the map.
 */
export const IN_FOCUS_COUNTRY_NAMES = new Set<string>([
  "Albania",
  "Austria",
  "Belarus",
  "Belgium",
  "Bosnia and Herz.",
  "Bulgaria",
  "Croatia",
  "Cyprus",
  "Czechia",
  "Denmark",
  "Estonia",
  "Finland",
  "France",
  "Germany",
  "Greece",
  "Hungary",
  "Iceland",
  "Ireland",
  "Italy",
  "Kosovo",
  "Latvia",
  "Lithuania",
  "Luxembourg",
  "Macedonia",
  "Moldova",
  "Montenegro",
  "Netherlands",
  "N. Cyprus",
  "Norway",
  "Poland",
  "Portugal",
  "Romania",
  "Russia",
  "Serbia",
  "Slovakia",
  "Slovenia",
  "Spain",
  "Sweden",
  "Switzerland",
  "Turkey",
  "Ukraine",
  "United Kingdom",
  // Connecting landmasses
  "Morocco",
  "Georgia",
  "Armenia",
  "Azerbaijan",
]);

export function isInFocusRegion(mapName: string): boolean {
  return IN_FOCUS_COUNTRY_NAMES.has(mapName);
}
