import type { GameHistoryEntry } from "@/types/profile";
import { getGuestHistory } from "@/lib/guest-history";
import { getProfile } from "@/lib/profile-storage";

export function getAllGameHistory(): GameHistoryEntry[] {
  const profile = getProfile();
  const profileHistory = profile?.gameHistory ?? [];
  const guestHistory = getGuestHistory();

  const byKey = new Map<string, GameHistoryEntry>();

  for (const entry of [...guestHistory, ...profileHistory]) {
    const mode = entry.mode ?? "sweep";
    byKey.set(`${entry.date}-${mode}`, entry);
  }

  return [...byKey.values()].sort((a, b) => b.date.localeCompare(a.date));
}

export function getBestScoreForMode(
  mode: "sweep" | "tap" | "hunt",
): number {
  const history = getAllGameHistory().filter(
    (entry) => (entry.mode ?? "sweep") === mode,
  );
  if (history.length === 0) return 0;

  if (mode === "sweep") {
    return Math.max(...history.map((entry) => entry.streak ?? 0));
  }
  if (mode === "tap") {
    return Math.max(...history.map((entry) => entry.totalScore ?? 0));
  }
  return Math.max(...history.map((entry) => entry.huntScore ?? 0));
}
