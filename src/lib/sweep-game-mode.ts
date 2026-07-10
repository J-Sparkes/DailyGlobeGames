export type SweepGameMode = "sweep" | "sweep_blitz";

export function isSweepBlitzMode(mode: SweepGameMode): boolean {
  return mode === "sweep_blitz";
}
