import { getDateSeed } from "@/lib/daily-seed";

const FREEZE_KEY = "geography-game-streak-freeze-month-v1";

function getDateSeedMonth(date: Date = new Date()): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

export function getStreakFreezeMonth(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(FREEZE_KEY);
}

export function useStreakFreeze(): boolean {
  if (typeof window === "undefined") return false;
  const month = getDateSeedMonth();
  if (getStreakFreezeMonth() === month) return false;
  window.localStorage.setItem(FREEZE_KEY, month);
  return true;
}

export function canUseStreakFreezeThisMonth(): boolean {
  return getStreakFreezeMonth() !== getDateSeedMonth();
}
