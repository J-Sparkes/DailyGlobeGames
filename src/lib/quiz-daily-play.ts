import { getDateSeed } from "@/lib/daily-seed";
import { isUnlimitedPlaysEnabled } from "@/lib/daily-play";

const STORAGE_KEY = "geography-game-quiz-daily-v1";

export interface QuizDailyProgress {
  date: string;
  score: number;
  lives: number;
  currentClueIndex: number;
  guesses: string[];
  gameMode: "daily" | "bonus";
}

export interface CompletedQuizResult {
  date: string;
  score: number;
  won: boolean;
  dailyCountry: string;
  bonusCountry: string;
  guesses: string[];
}

interface QuizStorage {
  progress?: QuizDailyProgress;
  completed?: CompletedQuizResult;
}

function readStorage(): QuizStorage {
  if (typeof window === "undefined") return {};

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as QuizStorage;
  } catch {
    return {};
  }
}

function writeStorage(data: QuizStorage): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function getQuizCompletedForDate(
  date: string = getDateSeed(),
): CompletedQuizResult | null {
  if (isUnlimitedPlaysEnabled()) return null;

  const { completed } = readStorage();
  if (completed?.date === date) return completed;
  return null;
}

export function getQuizCompletedForToday(): CompletedQuizResult | null {
  return getQuizCompletedForDate(getDateSeed());
}

export function getQuizProgressForDate(
  date: string = getDateSeed(),
): QuizDailyProgress | null {
  if (isUnlimitedPlaysEnabled()) return null;

  const { progress } = readStorage();
  if (progress?.date === date) return progress;
  return null;
}

export function getQuizProgressForToday(): QuizDailyProgress | null {
  return getQuizProgressForDate(getDateSeed());
}

export function saveQuizProgress(progress: QuizDailyProgress): void {
  if (isUnlimitedPlaysEnabled()) return;

  const storage = readStorage();
  if (storage.completed?.date === progress.date) return;

  writeStorage({
    ...storage,
    progress,
  });
}

export function saveQuizCompletedResult(result: CompletedQuizResult): void {
  if (isUnlimitedPlaysEnabled()) return;

  writeStorage({
    completed: result,
    progress: undefined,
  });
}

export function clearQuizDailyStorage(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY);
}

/** @deprecated Use saveQuizCompletedResult */
export function saveQuizCompleted(score: number, date: string = getDateSeed()): void {
  saveQuizCompletedResult({
    date,
    score,
    won: true,
    dailyCountry: "",
    bonusCountry: "",
    guesses: [],
  });
}
