export type GameMode = "sweep" | "tap" | "hunt";

const STORAGE_KEYS: Record<GameMode, string> = {
  sweep: "geography-game-welcome-sweep-seen",
  tap: "geography-game-welcome-tap-seen",
  hunt: "geography-game-welcome-hunt-seen",
};

export function hasSeenWelcome(mode: GameMode = "sweep"): boolean {
  if (typeof window === "undefined") return true;
  if (window.localStorage.getItem(STORAGE_KEYS[mode]) === "true") return true;
  if (
    mode === "sweep" &&
    window.localStorage.getItem("geography-game-welcome-seen") === "true"
  ) {
    return true;
  }
  return false;
}

export function markWelcomeSeen(mode: GameMode = "sweep"): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEYS[mode], "true");
}
