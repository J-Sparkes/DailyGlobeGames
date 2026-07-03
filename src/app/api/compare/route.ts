import { NextResponse } from "next/server";
import { dailyDateFromRequest, jsonError, requireAuthUser } from "@/lib/server/api-utils";
import type { LeaderboardMode } from "@/types/profile";

export async function GET(request: Request) {
  const { createSupabaseServerClient } = await import("@/lib/supabase/server");
  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json({ error: "Not configured" }, { status: 503 });
  }

  const url = new URL(request.url);
  const username = (url.searchParams.get("user") ?? "").trim().toLowerCase();
  const mode = (url.searchParams.get("mode") ?? "sweep") as LeaderboardMode;
  const date = dailyDateFromRequest(request);

  if (!username) return jsonError("user required");
  if (!["sweep", "tap", "hunt"].includes(mode)) {
    return jsonError("Invalid mode");
  }

  const { data: targetProfile } = await supabase
    .from("profiles")
    .select("id, username, display_name")
    .eq("username", username)
    .maybeSingle();

  if (!targetProfile) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const { data: targetResult } = await supabase
    .from("daily_results")
    .select("score")
    .eq("user_id", targetProfile.id)
    .eq("mode", mode)
    .eq("date", date)
    .maybeSingle();

  const { user } = await requireAuthUser();

  let viewerScore: number | null = null;
  let viewerPlayed = false;

  if (user) {
    const { data: viewerResult } = await supabase
      .from("daily_results")
      .select("score")
      .eq("user_id", user.id)
      .eq("mode", mode)
      .eq("date", date)
      .maybeSingle();

    if (viewerResult) {
      viewerPlayed = true;
      viewerScore = viewerResult.score as number;
    }
  }

  return NextResponse.json({
    date,
    mode,
    target: {
      username: targetProfile.username,
      displayName: targetProfile.display_name,
      score: targetResult?.score ?? null,
      played: Boolean(targetResult),
    },
    viewer: {
      played: viewerPlayed,
      score: viewerScore,
    },
  });
}
