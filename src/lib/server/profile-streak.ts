import type { SupabaseClient } from "@supabase/supabase-js";
import { computeCalendarStreak } from "@/lib/calendar-streak";
import { getDateSeed } from "@/lib/daily-seed";

export async function updateProfileCalendarStreak(
  supabase: SupabaseClient,
  userId: string,
  playedDate: string = getDateSeed(),
): Promise<void> {
  const { data: profile } = await supabase
    .from("profiles")
    .select("current_streak, longest_streak, last_played_date, streak_freeze_month")
    .eq("id", userId)
    .maybeSingle();

  if (!profile) return;
  if (profile.last_played_date === playedDate) return;

  const { data: results } = await supabase
    .from("daily_results")
    .select("date")
    .eq("user_id", userId);

  const playDates = [
    ...new Set([
      ...(results ?? []).map((row) => row.date as string),
      playedDate,
    ]),
  ];

  const streak = computeCalendarStreak(
    playDates,
    playedDate,
    profile.streak_freeze_month as string | null,
  );

  await supabase
    .from("profiles")
    .update({
      current_streak: streak.current,
      longest_streak: Math.max(
        (profile.longest_streak as number) ?? 0,
        streak.longest,
      ),
      last_played_date: playedDate,
    })
    .eq("id", userId);
}
