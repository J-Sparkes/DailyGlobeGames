import { NextResponse } from "next/server";
import { jsonError, requireAuthUser } from "@/lib/server/api-utils";
import type { GameHistoryEntry } from "@/types/profile";

export async function POST(request: Request) {
  const { supabase, user } = await requireAuthUser();
  if (!supabase || !user) {
    return jsonError("Sign in required", 401);
  }

  const body = (await request.json()) as { history?: GameHistoryEntry[] };
  const history = body.history ?? [];

  for (const entry of history) {
    const mode = entry.mode ?? "sweep";
    let score = 0;

    if (mode === "sweep") score = entry.streak ?? 0;
    else if (mode === "tap") score = entry.totalScore ?? 0;
    else if (mode === "hunt") score = entry.huntScore ?? 0;

    if (score <= 0) continue;

    await supabase.from("daily_results").upsert(
      {
        user_id: user.id,
        mode,
        date: entry.date,
        score,
        metadata: { imported: true },
      },
      { onConflict: "user_id,mode,date", ignoreDuplicates: false },
    );
  }

  return NextResponse.json({ ok: true, imported: history.length });
}
