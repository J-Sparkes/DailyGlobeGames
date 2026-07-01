import { haversineKm } from "@/lib/geo-distance";

export { haversineKm };

export const ROUND_MULTIPLIERS = [1, 1, 2, 3, 3] as const;

export const MAX_ROUNDS = 5;

export const MAX_TAP_SCORE = ROUND_MULTIPLIERS.reduce(
  (sum, mult) => sum + 100 * mult,
  0,
);

export function distanceToPoints(distanceKm: number): number {
  if (distanceKm <= 5) return 100;
  if (distanceKm >= 2500) return 0;
  return Math.round(100 * Math.exp(-distanceKm / 400));
}

export function getRoundMultiplier(roundIndex: number): number {
  return ROUND_MULTIPLIERS[roundIndex] ?? 1;
}

export function scoreRound(
  distanceKm: number,
  roundIndex: number,
): { basePoints: number; multiplier: number; totalPoints: number } {
  const basePoints = distanceToPoints(distanceKm);
  const multiplier = getRoundMultiplier(roundIndex);
  return {
    basePoints,
    multiplier,
    totalPoints: basePoints * multiplier,
  };
}

export function sumTapScore(rounds: { totalPoints: number }[]): number {
  return rounds.reduce((sum, round) => sum + round.totalPoints, 0);
}

export function getScoreEmoji(basePoints: number): string {
  if (basePoints >= 95) return "🎯";
  if (basePoints >= 85) return "🎉";
  if (basePoints >= 70) return "🔥";
  if (basePoints >= 50) return "🌟";
  return "🤨";
}

export function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m`;
  if (km < 100) return `${Math.round(km)} km`;
  return `${Math.round(km).toLocaleString()} km`;
}
