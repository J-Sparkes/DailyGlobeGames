import type { WarmerHint } from "@/types/hunt";

export const MAX_HUNT_GUESSES = 3;
export const MAX_HUNT_SCORE = 3;

export function scoreForGuess(guessNumber: number): number {
  if (guessNumber === 1) return 3;
  if (guessNumber === 2) return 2;
  if (guessNumber === 3) return 1;
  return 0;
}

export function getWarmerHint(
  currentMiles: number,
  previousMiles: number | null,
): WarmerHint {
  if (previousMiles === null) return null;
  const delta = currentMiles - previousMiles;
  if (Math.abs(delta) < 5) return "same";
  return delta < 0 ? "warmer" : "colder";
}

export function formatMiles(miles: number): string {
  if (miles < 10) return `${Math.round(miles)} mi`;
  return `${Math.round(miles).toLocaleString()} mi`;
}

export function buildShareGrid(
  won: boolean,
  solvedOnGuess: number | null,
): string {
  const cells = ["⬜", "⬜", "⬜"];
  if (won && solvedOnGuess !== null && solvedOnGuess >= 1 && solvedOnGuess <= 3) {
    cells[solvedOnGuess - 1] = "🟩";
  }
  return cells.join("");
}
