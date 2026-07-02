import { getDateSeed } from "@/lib/daily-seed";

export function isDateSeedStale(mountedDateSeed: string, now: Date = new Date()): boolean {
  return getDateSeed(now) !== mountedDateSeed;
}
