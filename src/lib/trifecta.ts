import { getDateSeed } from "@/lib/daily-seed";
import { getCompletedResultForToday } from "@/lib/daily-play";
import { getBlitzCompletedForToday } from "@/lib/blitz-daily-play";
import { getHuntCompletedResultForToday } from "@/lib/hunt-daily-play";
import { getAllGameHistory } from "@/lib/game-history";
import { getQuizCompletedForToday } from "@/lib/quiz-daily-play";
import { getTapCompletedResultForToday } from "@/lib/tap-daily-play";

export const DAILY_MODE_COUNT = 5;

export type TrifectaMode = "sweep" | "blitz" | "quiz" | "tap" | "hunt";

export interface TrifectaStatus {
  date: string;
  sweep: boolean;
  blitz: boolean;
  quiz: boolean;
  tap: boolean;
  hunt: boolean;
  completed: number;
  complete: boolean;
}

export function getTrifectaForDate(date: string): TrifectaStatus {
  const history = getAllGameHistory();
  const modes = new Set(
    history.filter((e) => e.date === date).map((e) => e.mode ?? "sweep"),
  );

  const today = getDateSeed();
  if (date === today) {
    if (getCompletedResultForToday() && !getBlitzCompletedForToday()) {
      modes.add("sweep");
    }
    if (getBlitzCompletedForToday()) modes.add("blitz");
    if (getQuizCompletedForToday()) modes.add("quiz");
    if (getTapCompletedResultForToday()) modes.add("tap");
    if (getHuntCompletedResultForToday()) modes.add("hunt");
  }

  const sweep = modes.has("sweep");
  const blitz = modes.has("blitz");
  const quiz = modes.has("quiz");
  const tap = modes.has("tap");
  const hunt = modes.has("hunt");
  const completed = [sweep, blitz, quiz, tap, hunt].filter(Boolean).length;

  return {
    date,
    sweep,
    blitz,
    quiz,
    tap,
    hunt,
    completed,
    complete: completed === DAILY_MODE_COUNT,
  };
}

export function getTodayTrifecta(): TrifectaStatus {
  return getTrifectaForDate(getDateSeed());
}

export function getRemainingModeLabels(status: TrifectaStatus): string[] {
  const remaining: string[] = [];
  if (!status.sweep) remaining.push("Sweep");
  if (!status.blitz) remaining.push("Blitz");
  if (!status.quiz) remaining.push("Quiz");
  if (!status.tap) remaining.push("Tap");
  if (!status.hunt) remaining.push("Hunt");
  return remaining;
}
