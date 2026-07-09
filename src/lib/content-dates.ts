/**
 * Stable last-modified dates for sitemap / content freshness signals.
 * Update a page's date when its public copy meaningfully changes.
 */
export const CONTENT_LAST_MODIFIED = {
  home: "2026-07-09",
  tap: "2026-07-09",
  hunt: "2026-07-09",
  about: "2026-07-09",
  faq: "2026-07-09",
  classroom: "2026-07-09",
  howTo: "2026-07-09",
  updates: "2026-07-09",
  archive: "2026-07-03",
  privacy: "2026-06-30",
  terms: "2026-06-30",
} as const;

export function contentDate(key: keyof typeof CONTENT_LAST_MODIFIED): Date {
  return new Date(`${CONTENT_LAST_MODIFIED[key]}T12:00:00.000Z`);
}
