function getSiteUrl(): string {
  if (typeof window !== "undefined") {
    return window.location.origin;
  }
  return process.env.NEXT_PUBLIC_SITE_URL ?? "https://dailyglobegames.com";
}

const MODE_PATHS = {
  sweep: "",
  tap: "/tap",
  hunt: "/hunt",
} as const;

export function getModeDeepLink(
  mode: keyof typeof MODE_PATHS,
  date: string,
): string {
  const base = `${getSiteUrl()}${MODE_PATHS[mode]}`;
  return `${base}?d=${date}`;
}

export function getShareCardUrl(
  mode: "sweep" | "tap" | "hunt",
  date: string,
  score: number,
  subtitle?: string,
): string {
  const params = new URLSearchParams({
    mode,
    date,
    score: String(score),
  });
  if (subtitle) params.set("subtitle", subtitle);
  return `${getSiteUrl()}/api/share/card?${params.toString()}`;
}
