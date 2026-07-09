export type GameMode = "sweep" | "tap" | "hunt";

export const GAME_MODE_INSTRUCTIONS: Record<GameMode, string> = {
  sweep:
    "Sweep across the globe to wipe away the fog and reveal today's hidden country!",
  tap: "Pinpoint the exact location on the grid. Tap closely—every kilometer counts!",
  hunt: "Follow the hot-or-cold distance clues to track down the secret territory.",
};

export function getGameModeInstruction(mode: GameMode): string {
  return GAME_MODE_INSTRUCTIONS[mode];
}
