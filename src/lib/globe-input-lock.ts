export function acquireGlobeInputLock(lock: { current: boolean }): boolean {
  if (lock.current) return false;
  lock.current = true;
  return true;
}

export function releaseGlobeInputLock(lock: { current: boolean }): void {
  lock.current = false;
}
