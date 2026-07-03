import type { CompletedHuntResult } from "@/types/hunt";
import { trifectaShareSuffix } from "@/lib/retention-events";
import { huntChallengeLine } from "@/lib/share-challenge";
import { getModeDeepLink } from "@/lib/share-deep-link";
import { buildShareGrid, MAX_HUNT_SCORE } from "@/lib/hunt-scoring";
import { getHuntWinStreak } from "@/lib/profile-storage";

function getSiteUrl(): string {
  if (typeof window !== "undefined") {
    return window.location.origin;
  }
  return process.env.NEXT_PUBLIC_SITE_URL ?? "https://dailyglobegames.com";
}

export function buildHuntShareText(result: CompletedHuntResult): string {
  const grid = buildShareGrid(result.won, result.solvedOnGuess);
  const streak = getHuntWinStreak();
  const closest =
    result.guesses.length > 0
      ? Math.min(...result.guesses.map((g) => g.distanceMiles))
      : null;

  const lines = [
    huntChallengeLine(result.score, result.won),
    `Daily Hunt ${result.date}`,
    grid,
    `Score: ${result.score}/${MAX_HUNT_SCORE}`,
  ];

  if (result.won && streak > 0) {
    lines.push(`Streak: ${streak} ${streak === 1 ? "day" : "days"}`);
  }

  if (closest !== null && !result.won) {
    lines.push(`Closest: ${Math.round(closest).toLocaleString()} mi`);
  }

  lines.push(trifectaShareSuffix());
  lines.push("", `Play at ${getModeDeepLink("hunt", result.date)}`);

  return lines.join("\n");
}

export async function copyHuntShareText(text: string): Promise<boolean> {
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

export async function nativeHuntShare(
  result: CompletedHuntResult,
): Promise<boolean> {
  if (typeof navigator === "undefined" || !navigator.share) {
    return false;
  }

  const text = buildHuntShareText(result);
  const url = `${getSiteUrl()}/hunt`;

  try {
    await navigator.share({
      title: "Daily Hunt",
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

export function getHuntTwitterShareUrl(text: string): string {
  return `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
}

export function getHuntWhatsAppShareUrl(text: string): string {
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}

export function getHuntShareUrl(date?: string): string {
  if (date) return getModeDeepLink("hunt", date);
  return `${getSiteUrl()}/hunt`;
}
