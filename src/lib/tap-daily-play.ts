import { getDateSeed } from "@/lib/daily-seed";
import { isUnlimitedPlaysEnabled } from "@/lib/daily-play";
import type { TapRoundResult } from "@/types/location";

const STORAGE_KEY = "geography-game-tap-daily-v1";

export type TapPhase = "aiming" | "round-result";

export interface TapDailyProgress {
  date: string;
  roundIndex: number;
  results: TapRoundResult[];
  phase: TapPhase;
}

export interface CompletedTapResult {
  date: string;
  rounds: TapRoundResult[];
  totalScore: number;
}

interface TapStorage {
  progress?: TapDailyProgress;
  completed?: CompletedTapResult;
}

function readStorage(): TapStorage {
  if (typeof window === "undefined") return {};

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as TapStorage;
  } catch {
    return {};
  }
}

function writeStorage(data: TapStorage): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function getTapCompletedResultForToday(): CompletedTapResult | null {
  if (isUnlimitedPlaysEnabled()) return null;

  const today = getDateSeed();
  const { completed } = readStorage();
  if (completed?.date === today) return completed;
  return null;
}

export function getTapProgressForToday(): TapDailyProgress | null {
  if (isUnlimitedPlaysEnabled()) return null;

  const today = getDateSeed();
  const { progress } = readStorage();
  if (progress?.date === today) return progress;
  return null;
}

export function saveTapProgress(progress: TapDailyProgress): void {
  if (isUnlimitedPlaysEnabled()) return;

  const storage = readStorage();
  if (storage.completed?.date === progress.date) return;

  writeStorage({
    ...storage,
    progress,
  });
}

export function saveTapCompletedResult(result: CompletedTapResult): void {
  if (isUnlimitedPlaysEnabled()) return;

  writeStorage({
    completed: result,
    progress: undefined,
  });
}

export function clearTapDailyStorage(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY);
}

export function createInitialTapProgress(): TapDailyProgress {
  return {
    date: getDateSeed(),
    roundIndex: 0,
    results: [],
    phase: "aiming",
  };
}
