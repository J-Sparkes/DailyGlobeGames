import { NextResponse } from "next/server";
import { jsonError, requireAuthUser } from "@/lib/server/api-utils";
import { validateSweepPath } from "@/lib/server/daily-engine";
import { shouldSkipLeaderboardSubmit } from "@/lib/server/premium";
import { updateProfileCalendarStreak } from "@/lib/server/profile-streak";
import { getDateSeed } from "@/lib/daily-seed";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    date?: string;
    path?: string[];
    failedGuess?: string;
    targetCountryId?: string;
    streak?: number;
  };

  const date = body.date ?? getDateSeed();
  const path = body.path ?? [];
  const failedGuess = body.failedGuess ?? "";
  const targetCountryId = body.targetCountryId ?? "";

  if (!Array.isArray(path) || path.length === 0) {
    return jsonError("Invalid path");
  }

  const validation = await validateSweepPath(
    date,
    path,
    failedGuess,
    targetCountryId,
  );

  if (!validation.valid) {
    return jsonError("Invalid sweep submission", 422);
  }

  const score = validation.streak;
  const { user, supabase } = await requireAuthUser();

  if (user && supabase && !shouldSkipLeaderboardSubmit(date)) {
    await supabase.from("daily_results").upsert(
      {
        user_id: user.id,
        mode: "sweep",
        date,
        score,
        metadata: { path, targetCountryId, failedGuess },
      },
      { onConflict: "user_id,mode,date" },
    );
    await updateProfileCalendarStreak(supabase, user.id, date);
  }

  return NextResponse.json({ ok: true, score, date });
}
