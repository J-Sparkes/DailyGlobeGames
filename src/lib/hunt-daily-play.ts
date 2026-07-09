import { getDateSeed } from "@/lib/daily-seed";
import { isUnlimitedPlaysEnabled } from "@/lib/daily-play";
import type { CompletedHuntResult, HuntGuess } from "@/types/hunt";

const STORAGE_KEY = "geography-game-hunt-daily-v1";

export type HuntPhase = "playing" | "guess-result";

export interface HuntDailyProgress {
  date: string;
  hiddenCountryId?: string;
  guesses: HuntGuess[];
  phase: HuntPhase;
}

interface HuntStorage {
  progress?: HuntDailyProgress;
  completed?: CompletedHuntResult;
}

function readStorage(): HuntStorage {
  if (typeof window === "undefined") return {};

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as HuntStorage;
  } catch {
    return {};
  }
}

function writeStorage(data: HuntStorage): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function getHuntCompletedResultForDate(
  date: string = getDateSeed(),
): CompletedHuntResult | null {
  if (isUnlimitedPlaysEnabled()) return null;

  const { completed } = readStorage();
  if (completed?.date === date) return completed;
  return null;
}

export function getHuntCompletedResultForToday(): CompletedHuntResult | null {
  return getHuntCompletedResultForDate(getDateSeed());
}

export function getHuntProgressForDate(
  date: string = getDateSeed(),
): HuntDailyProgress | null {
  if (isUnlimitedPlaysEnabled()) return null;

  const { progress } = readStorage();
  if (progress?.date === date) return progress;
  return null;
}

export function getHuntProgressForToday(): HuntDailyProgress | null {
  return getHuntProgressForDate(getDateSeed());
}

export function saveHuntProgress(progress: HuntDailyProgress): void {
  if (isUnlimitedPlaysEnabled()) return;

  const storage = readStorage();
  if (storage.completed?.date === progress.date) return;

  writeStorage({
    ...storage,
    progress,
  });
}

export function saveHuntCompletedResult(result: CompletedHuntResult): void {
  if (isUnlimitedPlaysEnabled()) return;

  writeStorage({
    completed: result,
    progress: undefined,
  });
}

export function clearHuntDailyStorage(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY);
}

export function createInitialHuntProgress(
  date: string = getDateSeed(),
): HuntDailyProgress {
  return {
    date,
    guesses: [],
    phase: "playing",
  };
}
