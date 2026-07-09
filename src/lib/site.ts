export const SITE_NAME = "Daily Globe Games";
export const SITE_DOMAIN = "dailyglobegames.com";

export function getSiteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL ?? `https://${SITE_DOMAIN}`;
}

export function absoluteUrl(path = "/"): string {
  const base = getSiteUrl().replace(/\/$/, "");
  if (!path || path === "/") return base;
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}
