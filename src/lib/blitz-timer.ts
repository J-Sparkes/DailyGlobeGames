export const BLITZ_START_SECONDS = 30;
export const BLITZ_BONUS_SECONDS = 3;

export function tickBlitzTimer(current: number): {
  next: number;
  expired: boolean;
} {
  if (current <= 0) return { next: 0, expired: false };
  if (current <= 1) return { next: 0, expired: true };
  return { next: current - 1, expired: false };
}

export function addBlitzBonus(current: number, amount: number): number {
  return current + amount;
}
