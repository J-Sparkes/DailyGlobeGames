import { trackEvent } from "@/lib/analytics";
import { getDateSeed } from "@/lib/daily-seed";

const LAST_PLAY_KEY = "geography-game-last-play-date-v1";
const FIRST_WIN_KEY = "geography-game-first-win-v1";
const SIGNUP_TRACKED_KEY = "geography-game-signup-tracked-v1";

export function recordPlayDay(): void {
  if (typeof window === "undefined") return;

  const today = getDateSeed();
  const lastPlay = window.localStorage.getItem(LAST_PLAY_KEY);

  if (lastPlay && lastPlay !== today) {
    const last = new Date(`${lastPlay}T00:00:00Z`);
    const now = new Date(`${today}T00:00:00Z`);
    const diffDays = Math.round(
      (now.getTime() - last.getTime()) / (1000 * 60 * 60 * 24),
    );
    if (diffDays === 1) {
      trackEvent("return_within_24h", { gap_days: diffDays });
    }
  }

  window.localStorage.setItem(LAST_PLAY_KEY, today);
}

export function recordFirstWin(mode: "sweep" | "blitz" | "quiz" | "tap" | "hunt"): void {
  if (typeof window === "undefined") return;
  if (window.localStorage.getItem(FIRST_WIN_KEY)) return;
  window.localStorage.setItem(FIRST_WIN_KEY, mode);
}

export function hasRecordedFirstWin(): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(FIRST_WIN_KEY) !== null;
}

export function trackSignupAfterFirstWin(): void {
  if (typeof window === "undefined") return;
  if (window.localStorage.getItem(SIGNUP_TRACKED_KEY)) return;
  const firstWin = window.localStorage.getItem(FIRST_WIN_KEY);
  if (!firstWin) return;

  trackEvent("signup_after_first_win", { first_mode: firstWin });
  window.localStorage.setItem(SIGNUP_TRACKED_KEY, "1");
}
