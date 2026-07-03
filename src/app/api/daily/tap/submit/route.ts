import { NextResponse } from "next/server";
import { jsonError, requireAuthUser } from "@/lib/server/api-utils";
import { shouldSkipLeaderboardSubmit } from "@/lib/server/premium";
import { updateProfileCalendarStreak } from "@/lib/server/profile-streak";
import { sumTapScore } from "@/lib/tap-scoring";
import { getDateSeed } from "@/lib/daily-seed";
import type { TapRoundResult } from "@/types/location";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    date?: string;
    rounds?: TapRoundResult[];
  };

  const date = body.date ?? getDateSeed();
  const rounds = body.rounds ?? [];

  if (!Array.isArray(rounds) || rounds.length === 0) {
    return jsonError("Invalid rounds");
  }

  const score = sumTapScore(rounds);
  const { user, supabase } = await requireAuthUser();

  if (user && supabase && !shouldSkipLeaderboardSubmit(date)) {
    await supabase.from("daily_results").upsert(
      {
        user_id: user.id,
        mode: "tap",
        date,
        score,
        metadata: { rounds: rounds.length },
      },
      { onConflict: "user_id,mode,date" },
    );
    await updateProfileCalendarStreak(supabase, user.id, date);
  }

  return NextResponse.json({ ok: true, score, date });
}
