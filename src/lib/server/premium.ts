import { getDateSeed } from "@/lib/daily-seed";
import { isArchiveDate } from "@/lib/archive-play";

export function shouldSkipLeaderboardSubmit(date: string): boolean {
  return date !== getDateSeed() || isArchiveDate(date);
}

export function isPremiumActive(premiumUntil: string | null | undefined): boolean {
  if (!premiumUntil) return false;
  return new Date(premiumUntil).getTime() > Date.now();
}
