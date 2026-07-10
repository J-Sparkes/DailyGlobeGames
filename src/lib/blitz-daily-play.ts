import { getDateSeed } from "@/lib/daily-seed";
import { isUnlimitedPlaysEnabled } from "@/lib/daily-play";
import type { CompletedDailyResult } from "@/lib/daily-play";

const STORAGE_KEY = "geography-game-blitz-daily-v1";

interface BlitzDailyStorage {
  completed?: CompletedDailyResult;
}

function readStorage(): BlitzDailyStorage {
  if (typeof window === "undefined") return {};

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as BlitzDailyStorage;
  } catch {
    return {};
  }
}

function writeStorage(data: BlitzDailyStorage): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function getBlitzCompletedForDate(
  date: string = getDateSeed(),
): CompletedDailyResult | null {
  if (isUnlimitedPlaysEnabled()) return null;

  const { completed } = readStorage();
  if (completed?.date === date) return completed;
  return null;
}

export function getBlitzCompletedForToday(): CompletedDailyResult | null {
  return getBlitzCompletedForDate(getDateSeed());
}

export function saveBlitzCompletedResult(result: CompletedDailyResult): void {
  if (isUnlimitedPlaysEnabled()) return;

  writeStorage({ completed: result });
}
