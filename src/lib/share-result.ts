import { getCountryDisplayName } from "@/lib/country-resolve";
import type { CompletedDailyResult } from "@/lib/daily-play";
import { trifectaShareSuffix } from "@/lib/retention-events";
import { sweepChallengeLine } from "@/lib/share-challenge";
import { getModeDeepLink } from "@/lib/share-deep-link";

function getSiteUrl(): string {
  if (typeof window !== "undefined") {
    return window.location.origin;
  }
  return process.env.NEXT_PUBLIC_SITE_URL ?? "https://dailyglobegames.com";
}

export function buildShareText(result: CompletedDailyResult): string {
  const pathLine =
    result.path.length > 0
      ? result.path.map(getCountryDisplayName).join(" → ")
      : "No countries claimed";

  return [
    sweepChallengeLine(result.streak),
    `Daily Globe Games ${result.date}`,
    `🌍 ${result.streak} ${result.streak === 1 ? "country" : "countries"} swept`,
    "",
    pathLine,
    trifectaShareSuffix(),
    "",
    `Play at ${getModeDeepLink("sweep", result.date)}`,
  ]
    .filter((line, index, arr) => !(line === "" && arr[index - 1] === ""))
    .join("\n");
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

export function getShareUrl(date?: string): string {
  if (date) return getModeDeepLink("sweep", date);
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
  const url = getShareUrl(result.date);

  try {
    await navigator.share({
      title: "Daily Globe Games",
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
