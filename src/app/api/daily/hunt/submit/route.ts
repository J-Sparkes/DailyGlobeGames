import { NextResponse } from "next/server";
import { jsonError, requireAuthUser } from "@/lib/server/api-utils";
import { shouldSkipLeaderboardSubmit } from "@/lib/server/premium";
import { updateProfileCalendarStreak } from "@/lib/server/profile-streak";
import { scoreForGuess } from "@/lib/hunt-scoring";
import { getDateSeed } from "@/lib/daily-seed";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    date?: string;
    won?: boolean;
    solvedOnGuess?: number | null;
    guessCount?: number;
  };

  const date = body.date ?? getDateSeed();
  const won = Boolean(body.won);
  const solvedOnGuess = body.solvedOnGuess ?? null;

  const score = won && solvedOnGuess ? scoreForGuess(solvedOnGuess) : 0;
  const { user, supabase } = await requireAuthUser();

  if (user && supabase && !shouldSkipLeaderboardSubmit(date)) {
    await supabase.from("daily_results").upsert(
      {
        user_id: user.id,
        mode: "hunt",
        date,
        score,
        metadata: { won, solvedOnGuess, guessCount: body.guessCount ?? 0 },
      },
      { onConflict: "user_id,mode,date" },
    );
    await updateProfileCalendarStreak(supabase, user.id, date);
  }

  if (!won && body.guessCount === undefined) {
    return jsonError("Invalid hunt submission");
  }

  return NextResponse.json({ ok: true, score, date });
}
