export const POV_COOLDOWN_MS = 500;

export function shouldTriggerPovRefocus(
  lastInteractionMs: number,
  nowMs: number,
  isInteracting: boolean,
): boolean {
  if (isInteracting) return false;
  return nowMs - lastInteractionMs >= POV_COOLDOWN_MS;
}
