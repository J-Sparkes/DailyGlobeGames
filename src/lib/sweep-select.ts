import type { GamePhase } from "@/lib/daily-play";

export function canSelectFrontierCountry(
  phase: GamePhase,
  targetId: string,
  claimedIds: string[],
): boolean {
  if (phase === "selecting") return true;

  // Naming an unclaimed frontier pick — allow switching to another neighbor
  if (
    phase === "naming" &&
    claimedIds.length > 0 &&
    !claimedIds.includes(targetId)
  ) {
    return true;
  }

  return false;
}
