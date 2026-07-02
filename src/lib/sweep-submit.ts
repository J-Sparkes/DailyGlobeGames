import type { GamePhase } from "@/lib/daily-play";

export function shouldAcceptSweepSubmit(
  guess: string,
  phase: GamePhase,
  pendingGameOver: boolean,
): boolean {
  return Boolean(guess.trim()) && phase === "naming" && !pendingGameOver;
}
