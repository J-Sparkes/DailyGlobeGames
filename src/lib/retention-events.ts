import { trackEvent } from "@/lib/analytics";
import { recordFirstWin, recordPlayDay } from "@/lib/cohort-analytics";
import { getLocalCalendarStreak } from "@/lib/calendar-streak";
import { getDateSeed } from "@/lib/daily-seed";
import {
  getStoredReferralCode,
  hasCompletedReferral,
  markReferralComplete,
} from "@/lib/referral";
import { getStreakFreezeMonth } from "@/lib/retention-storage";
import { getTodayTrifecta, DAILY_MODE_COUNT } from "@/lib/trifecta";

let trifectaTrackedDate: string | null = null;

export function notifyRetentionUpdate(): void {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("retention-update"));
  }
}

export function recordDailyComplete(
  mode: "sweep" | "blitz" | "quiz" | "tap" | "hunt",
  score: number,
): void {
  recordPlayDay();
  recordFirstWin(mode);

  const streak = getLocalCalendarStreak(getStreakFreezeMonth());
  trackEvent("daily_complete", {
    mode,
    score,
    streak_length: streak.current,
  });

  const today = getDateSeed();
  const trifecta = getTodayTrifecta();
  if (trifecta.complete && trifectaTrackedDate !== today) {
    trifectaTrackedDate = today;
    trackEvent("trifecta_complete");
  }

  void completeReferralIfNeeded();

  notifyRetentionUpdate();
}

async function completeReferralIfNeeded(): Promise<void> {
  if (typeof window === "undefined" || hasCompletedReferral()) return;
  const code = getStoredReferralCode();
  if (!code) return;

  try {
    const res = await fetch("/api/referral/complete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ referrerUsername: code }),
    });
    if (res.ok) {
      markReferralComplete();
      trackEvent("referral_complete", { ref: code });
    }
  } catch {
    // Non-blocking
  }
}

export function trifectaShareSuffix(): string {
  const trifecta = getTodayTrifecta();
  return trifecta.complete
    ? `\n\n✨ Daily complete — all ${DAILY_MODE_COUNT} modes done today!`
    : "";
}
