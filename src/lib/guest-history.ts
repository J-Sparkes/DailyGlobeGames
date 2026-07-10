import type { CompletedDailyResult } from "@/lib/daily-play";
import type { CompletedTapResult } from "@/lib/tap-daily-play";
import type { CompletedHuntResult } from "@/types/hunt";
import type { GameHistoryEntry } from "@/types/profile";

const GUEST_HISTORY_KEY = "geography-game-guest-history-v1";

function readGuestHistory(): GameHistoryEntry[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(GUEST_HISTORY_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as GameHistoryEntry[];
  } catch {
    return [];
  }
}

function writeGuestHistory(entries: GameHistoryEntry[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(GUEST_HISTORY_KEY, JSON.stringify(entries));
}

function upsertEntry(entry: GameHistoryEntry): void {
  const mode = entry.mode ?? "sweep";
  const withoutDuplicate = readGuestHistory().filter(
    (existing) => !(existing.date === entry.date && (existing.mode ?? "sweep") === mode),
  );
  writeGuestHistory(
    [entry, ...withoutDuplicate].sort((a, b) => b.date.localeCompare(a.date)),
  );
}

export function getGuestHistory(): GameHistoryEntry[] {
  return readGuestHistory();
}

export function appendGuestSweepHistory(result: CompletedDailyResult): void {
  upsertEntry({
    date: result.date,
    mode: "sweep",
    streak: result.streak,
    path: result.path,
    recordedAt: new Date().toISOString(),
  });
}

export function appendGuestTapHistory(result: CompletedTapResult): void {
  upsertEntry({
    date: result.date,
    mode: "tap",
    totalScore: result.totalScore,
    roundScores: result.rounds.map((round) => round.totalPoints),
    recordedAt: new Date().toISOString(),
  });
}

export function appendGuestHuntHistory(result: CompletedHuntResult): void {
  upsertEntry({
    date: result.date,
    mode: "hunt",
    huntScore: result.score,
    solvedOnGuess: result.solvedOnGuess,
    won: result.won,
    recordedAt: new Date().toISOString(),
  });
}

export function appendGuestBlitzHistory(result: CompletedDailyResult): void {
  upsertEntry({
    date: result.date,
    mode: "blitz",
    streak: result.streak,
    path: result.path,
    recordedAt: new Date().toISOString(),
  });
}

export function appendGuestQuizHistory(date: string, score: number): void {
  upsertEntry({
    date,
    mode: "quiz",
    totalScore: score,
    recordedAt: new Date().toISOString(),
  });
}

export function getGuestBestSweep(): number {
  const sweepGames = readGuestHistory().filter(
    (entry) => (entry.mode ?? "sweep") === "sweep",
  );
  if (sweepGames.length === 0) return 0;
  return Math.max(...sweepGames.map((entry) => entry.streak ?? 0));
}

export function getGuestBestTap(): number {
  const tapGames = readGuestHistory().filter((entry) => entry.mode === "tap");
  if (tapGames.length === 0) return 0;
  return Math.max(...tapGames.map((entry) => entry.totalScore ?? 0));
}

export function getGuestBestHunt(): number {
  const huntGames = readGuestHistory().filter((entry) => entry.mode === "hunt");
  if (huntGames.length === 0) return 0;
  return Math.max(...huntGames.map((entry) => entry.huntScore ?? 0));
}
