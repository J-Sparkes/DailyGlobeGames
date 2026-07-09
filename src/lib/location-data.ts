/**
 * Client-side location access is disabled — daily Tap rounds are fetched from /api/daily/tap.
 * Server code imports src/data/locations.json directly.
 */
export function getLocationPool() {
  return [];
}
