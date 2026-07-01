export function isTouchDevice(): boolean {
  if (typeof window === "undefined") return false;

  return window.matchMedia("(hover: none) and (pointer: coarse)").matches;
}

export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;

  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
