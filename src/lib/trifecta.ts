import { getDateSeed } from "@/lib/daily-seed";
import { getCompletedResultForToday } from "@/lib/daily-play";
import { getHuntCompletedResultForToday } from "@/lib/hunt-daily-play";
import { getAllGameHistory } from "@/lib/game-history";
import { getTapCompletedResultForToday } from "@/lib/tap-daily-play";

export type TrifectaMode = "sweep" | "tap" | "hunt";

export interface TrifectaStatus {
  date: string;
  sweep: boolean;
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
    if (getCompletedResultForToday()) modes.add("sweep");
    if (getTapCompletedResultForToday()) modes.add("tap");
    if (getHuntCompletedResultForToday()) modes.add("hunt");
  }

  const sweep = modes.has("sweep");
  const tap = modes.has("tap");
  const hunt = modes.has("hunt");
  const completed = [sweep, tap, hunt].filter(Boolean).length;

  return {
    date,
    sweep,
    tap,
    hunt,
    completed,
    complete: completed === 3,
  };
}

export function getTodayTrifecta(): TrifectaStatus {
  return getTrifectaForDate(getDateSeed());
}

export function getRemainingModeLabels(status: TrifectaStatus): string[] {
  const remaining: string[] = [];
  if (!status.sweep) remaining.push("Sweep");
  if (!status.tap) remaining.push("Tap");
  if (!status.hunt) remaining.push("Hunt");
  return remaining;
}
