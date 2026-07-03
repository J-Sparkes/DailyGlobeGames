import { getDateSeed } from "@/lib/daily-seed";
import { getAllGameHistory } from "@/lib/game-history";

export interface CalendarStreakInfo {
  current: number;
  longest: number;
  playedToday: boolean;
  playDates: string[];
}

function parseUtcDate(dateSeed: string): Date {
  return new Date(`${dateSeed}T00:00:00Z`);
}

function addUtcDays(dateSeed: string, days: number): string {
  const date = parseUtcDate(dateSeed);
  date.setUTCDate(date.getUTCDate() + days);
  return getDateSeed(date);
}

function daysBetween(later: string, earlier: string): number {
  const ms =
    parseUtcDate(later).getTime() - parseUtcDate(earlier).getTime();
  return Math.round(ms / (1000 * 60 * 60 * 24));
}

/** Unique UTC dates with at least one completed mode */
export function getUniquePlayDates(
  dates: string[] = getAllGameHistory().map((e) => e.date),
): string[] {
  return [...new Set(dates)].sort((a, b) => b.localeCompare(a));
}

export function computeCalendarStreak(
  playDates: string[],
  today: string = getDateSeed(),
  streakFreezeMonth?: string | null,
): CalendarStreakInfo {
  const unique = [...new Set(playDates)].sort((a, b) => b.localeCompare(a));
  const playedToday = unique.includes(today);

  if (unique.length === 0) {
    return { current: 0, longest: 0, playedToday: false, playDates: unique };
  }

  let current = 0;
  let cursor = playedToday ? today : addUtcDays(today, -1);

  if (!unique.includes(cursor)) {
    const monthKey = today.slice(0, 7);
    const freezeUsed = streakFreezeMonth === monthKey;
    if (freezeUsed && daysBetween(today, unique[0]!) === 2) {
      cursor = unique[0]!;
    } else {
      return {
        current: 0,
        longest: computeLongestStreak(unique),
        playedToday,
        playDates: unique,
      };
    }
  }

  while (unique.includes(cursor)) {
    current++;
    cursor = addUtcDays(cursor, -1);
  }

  return {
    current,
    longest: Math.max(computeLongestStreak(unique), current),
    playedToday,
    playDates: unique,
  };
}

function computeLongestStreak(sortedDesc: string[]): number {
  if (sortedDesc.length === 0) return 0;

  const asc = [...sortedDesc].sort((a, b) => a.localeCompare(b));
  let longest = 1;
  let run = 1;

  for (let i = 1; i < asc.length; i++) {
    if (daysBetween(asc[i]!, asc[i - 1]!) === 1) {
      run++;
      longest = Math.max(longest, run);
    } else {
      run = 1;
    }
  }

  return longest;
}

export function getLocalCalendarStreak(
  streakFreezeMonth?: string | null,
): CalendarStreakInfo {
  return computeCalendarStreak(
    getUniquePlayDates(),
    getDateSeed(),
    streakFreezeMonth,
  );
}
