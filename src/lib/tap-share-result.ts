import type { CompletedTapResult } from "@/lib/tap-daily-play";
import { getScoreEmoji } from "@/lib/tap-scoring";
import { MAX_TAP_SCORE } from "@/lib/tap-scoring";

function getSiteUrl(): string {
  if (typeof window !== "undefined") {
    return window.location.origin;
  }
  return process.env.NEXT_PUBLIC_SITE_URL ?? "https://dailygeography.app";
}

export function buildTapShareText(result: CompletedTapResult): string {
  const scoreLine = result.rounds
    .map((round) => `${round.basePoints}${getScoreEmoji(round.basePoints)}`)
    .join(" ");

  return [
    `Daily Tap ${result.date}`,
    scoreLine,
    `Score: ${result.totalScore}/${MAX_TAP_SCORE}`,
    "",
    `Play at ${getSiteUrl()}/tap`,
  ].join("\n");
}

export async function copyTapShareText(text: string): Promise<boolean> {
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

export async function nativeTapShare(
  result: CompletedTapResult,
): Promise<boolean> {
  if (typeof navigator === "undefined" || !navigator.share) {
    return false;
  }

  const text = buildTapShareText(result);
  const url = `${getSiteUrl()}/tap`;

  try {
    await navigator.share({
      title: "Daily Tap",
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

export function getTapTwitterShareUrl(text: string): string {
  return `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
}

export function getTapWhatsAppShareUrl(text: string): string {
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}

export function getTapShareUrl(): string {
  return `${getSiteUrl()}/tap`;
}
