export const MILESTONE_THRESHOLDS = [5, 10, 20] as const;

export const TAP_HIGH_SCORE_STREAK_TARGET = 3;
export const TAP_HIGH_SCORE_THRESHOLD = 70;

export type HapticType = "success" | "error" | "milestone";

export function isNewMilestone(prev: number, next: number): boolean {
  if (next <= prev) return false;
  return MILESTONE_THRESHOLDS.some(
    (threshold) => prev < threshold && next >= threshold,
  );
}

export function triggerHaptic(type: HapticType): void {
  if (typeof navigator === "undefined" || typeof navigator.vibrate !== "function") {
    return;
  }

  try {
    switch (type) {
      case "success":
        navigator.vibrate(12);
        break;
      case "error":
        navigator.vibrate([8, 40, 8]);
        break;
      case "milestone":
        navigator.vibrate([10, 30, 10, 30, 14]);
        break;
    }
  } catch {
    // Haptics are optional.
  }
}
