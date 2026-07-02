import { NextResponse } from "next/server";
import { requireAuthUser } from "@/lib/server/api-utils";
import { joinProfile } from "@/lib/server/supabase-join";
import type { LeaderboardEntry, LeaderboardMode } from "@/types/profile";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const mode = (url.searchParams.get("mode") ?? "sweep") as LeaderboardMode;
  const scope = url.searchParams.get("scope") ?? "global";

  const { supabase, user } = await requireAuthUser();
  if (!supabase) {
    return NextResponse.json({ entries: [] });
  }

  if (scope === "friends") {
    if (!user) return NextResponse.json({ entries: [] });

    const { data: friendships } = await supabase
      .from("friendships")
      .select("friend_id")
      .eq("user_id", user.id);

    const friendIds = (friendships ?? []).map((f) => f.friend_id);
    const userIds = [...friendIds, user.id];

    if (userIds.length === 0) {
      return NextResponse.json({ entries: [] });
    }

    const { data: results } = await supabase
      .from("daily_results")
      .select("user_id, score, profiles(username, display_name)")
      .eq("mode", mode)
      .in("user_id", userIds)
      .order("score", { ascending: false })
      .limit(50);

    const bestByUser = new Map<string, { score: number; username: string; displayName: string }>();
    for (const row of results ?? []) {
      const profile = joinProfile(row.profiles);
      if (!profile) continue;
      const existing = bestByUser.get(row.user_id);
      if (!existing || row.score > existing.score) {
        bestByUser.set(row.user_id, {
          score: row.score,
          username: profile.username,
          displayName: profile.display_name,
        });
      }
    }

    const entries: LeaderboardEntry[] = [...bestByUser.entries()]
      .map(([, v]) => ({
        rank: 0,
        username: v.username,
        displayName: v.displayName,
        score: v.score,
        isYou: user ? v.username === (user.user_metadata?.username as string) : false,
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 15)
      .map((e, i) => ({ ...e, rank: i + 1 }));

    return NextResponse.json({ entries });
  }

  const { data: results } = await supabase
    .from("daily_results")
    .select("user_id, score, profiles(username, display_name)")
    .eq("mode", mode)
    .order("score", { ascending: false })
    .limit(100);

  const bestByUser = new Map<string, { score: number; username: string; displayName: string }>();
  for (const row of results ?? []) {
    const profile = joinProfile(row.profiles);
    if (!profile) continue;
    const existing = bestByUser.get(row.user_id);
    if (!existing || row.score > existing.score) {
      bestByUser.set(row.user_id, {
        score: row.score,
        username: profile.username,
        displayName: profile.display_name,
      });
    }
  }

  let yourUsername: string | null = null;
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("username")
      .eq("id", user.id)
      .maybeSingle();
    yourUsername = profile?.username ?? null;
  }

  const entries: LeaderboardEntry[] = [...bestByUser.values()]
    .sort((a, b) => b.score - a.score)
    .slice(0, 15)
    .map((e, i) => ({
      rank: i + 1,
      username: e.username,
      displayName: e.displayName,
      score: e.score,
      isYou: yourUsername === e.username,
    }));

  return NextResponse.json({ entries });
}
