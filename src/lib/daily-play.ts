import { getDateSeed } from "@/lib/daily-seed";

const STORAGE_KEY = "geography-game-daily-v1";

export function isUnlimitedPlaysEnabled(): boolean {
  if (process.env.NEXT_PUBLIC_UNLIMITED_PLAYS === "true") return true;
  return process.env.NODE_ENV === "development";
}

export type GamePhase = "naming" | "selecting";

export interface DailyProgress {
  date: string;
  dailyCountryId: string;
  claimedIds: string[];
  phase: GamePhase;
  targetId: string;
}

export interface CompletedDailyResult {
  date: string;
  path: string[];
  failedGuess: string;
  targetCountryId: string;
  streak: number;
}

interface DailyStorage {
  progress?: DailyProgress;
  completed?: CompletedDailyResult;
}

function readStorage(): DailyStorage {
  if (typeof window === "undefined") return {};

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as DailyStorage;
  } catch {
    return {};
  }
}

function writeStorage(data: DailyStorage): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function getCompletedResultForDate(
  date: string = getDateSeed(),
): CompletedDailyResult | null {
  if (isUnlimitedPlaysEnabled()) return null;

  const { completed } = readStorage();
  if (completed?.date === date) return completed;
  return null;
}

export function getCompletedResultForToday(): CompletedDailyResult | null {
  return getCompletedResultForDate(getDateSeed());
}

export function getProgressForDate(
  date: string = getDateSeed(),
): DailyProgress | null {
  if (isUnlimitedPlaysEnabled()) return null;

  const { progress } = readStorage();
  if (progress?.date === date) return progress;
  return null;
}

export function getProgressForToday(): DailyProgress | null {
  return getProgressForDate(getDateSeed());
}

export function saveProgress(progress: DailyProgress): void {
  if (isUnlimitedPlaysEnabled()) return;

  const storage = readStorage();
  if (storage.completed?.date === progress.date) return;

  writeStorage({
    ...storage,
    progress,
  });
}

export function saveCompletedResult(result: CompletedDailyResult): void {
  if (isUnlimitedPlaysEnabled()) return;

  writeStorage({
    completed: result,
    progress: undefined,
  });
}

export function clearDailyStorage(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY);
}

export function createInitialProgress(
  dailyCountryId: string,
  date: string = getDateSeed(),
): DailyProgress {
  return {
    date,
    dailyCountryId,
    claimedIds: [],
    phase: "naming",
    targetId: dailyCountryId,
  };
}

export function getMsUntilNextPuzzle(): number {
  const now = new Date();
  const next = new Date(
    Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate() + 1,
      0,
      0,
      0,
      0,
    ),
  );
  return next.getTime() - now.getTime();
}

export function formatCountdown(ms: number): string {
  const hours = Math.floor(ms / (1000 * 60 * 60));
  const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
  return `${hours}h ${minutes}m`;
}
