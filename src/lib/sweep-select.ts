import type { GamePhase } from "@/lib/daily-play";

export function canSelectFrontierCountry(
  phase: GamePhase,
  selectionLocked: boolean,
): boolean {
  return phase === "selecting" && !selectionLocked;
}
