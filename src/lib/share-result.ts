import { getCountryDisplayName } from "@/lib/country-resolve";
import type { CompletedDailyResult } from "@/lib/daily-play";

function getSiteUrl(): string {
  if (typeof window !== "undefined") {
    return window.location.origin;
  }
  return process.env.NEXT_PUBLIC_SITE_URL ?? "https://dailygeography.app";
}

export function buildShareText(result: CompletedDailyResult): string {
  const pathLine =
    result.path.length > 0
      ? result.path.map(getCountryDisplayName).join(" → ")
      : "No countries claimed";

  return [
    `Daily Geography ${result.date}`,
    `🌍 ${result.streak} ${result.streak === 1 ? "country" : "countries"} swept`,
    "",
    pathLine,
    "",
    `Play at ${getSiteUrl()}`,
  ].join("\n");
}

export function getTwitterShareUrl(text: string): string {
  return `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
}

export function getFacebookShareUrl(url: string): string {
  return `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
}

export function getLinkedInShareUrl(url: string): string {
  return `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;
}

export function getWhatsAppShareUrl(text: string): string {
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}

export function getShareUrl(): string {
  return getSiteUrl();
}

export async function copyShareText(text: string): Promise<boolean> {
  if (typeof navigator === "undefined" || !navigator.clipboard) {
    return false;
  }

  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

export async function nativeShare(
  result: CompletedDailyResult,
): Promise<boolean> {
  if (typeof navigator === "undefined" || !navigator.share) {
    return false;
  }

  const text = buildShareText(result);
  const url = getShareUrl();

  try {
    await navigator.share({
      title: "Daily Geography",
      text,
      url,
    });
    return true;
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      return true;
    }
    return false;
  }
}
