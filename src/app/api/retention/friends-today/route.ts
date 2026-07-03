import { NextResponse } from "next/server";
import {
  dailyDateFromRequest,
  jsonError,
  requireAuthUser,
} from "@/lib/server/api-utils";
import { joinProfile } from "@/lib/server/supabase-join";
import type { LeaderboardMode } from "@/types/profile";

export async function GET(request: Request) {
  const { supabase, user } = await requireAuthUser();
  if (!supabase || !user) {
    return NextResponse.json({ friends: [] });
  }

  const url = new URL(request.url);
  const mode = (url.searchParams.get("mode") ?? "sweep") as LeaderboardMode;
  const date = dailyDateFromRequest(request);

  if (!["sweep", "tap", "hunt"].includes(mode)) {
    return jsonError("Invalid mode");
  }

  const { data: friendships } = await supabase
    .from("friendships")
    .select("friend_id, profiles!friendships_friend_id_fkey(username, display_name)")
    .eq("user_id", user.id);

  const friendIds = (friendships ?? []).map((f) => f.friend_id as string);
  const friendProfiles = new Map(
    (friendships ?? []).map((f) => {
      const profile = joinProfile(f.profiles);
      return [
        f.friend_id as string,
        {
          username: profile?.username ?? "",
          displayName: profile?.display_name ?? "",
        },
      ];
    }),
  );

  const userIds = [user.id, ...friendIds];
  const { data: results } = await supabase
    .from("daily_results")
    .select("user_id, score")
    .eq("mode", mode)
    .eq("date", date)
    .in("user_id", userIds);

  const friends = (results ?? [])
    .map((row) => {
      const isYou = row.user_id === user.id;
      const profile = isYou
        ? null
        : friendProfiles.get(row.user_id as string);
      if (!isYou && !profile) return null;

      return {
        username: isYou ? "you" : profile!.username,
        displayName: isYou ? "You" : profile!.displayName,
        score: row.score as number,
        isYou,
      };
    })
    .filter((row): row is NonNullable<typeof row> => row !== null)
    .sort((a, b) => b.score - a.score);

  return NextResponse.json({ friends });
}
