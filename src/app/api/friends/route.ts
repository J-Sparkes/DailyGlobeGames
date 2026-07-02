import { NextResponse } from "next/server";
import { jsonError, requireAuthUser } from "@/lib/server/api-utils";
import { joinProfile } from "@/lib/server/supabase-join";

export async function GET() {
  const { supabase, user } = await requireAuthUser();
  if (!supabase || !user) {
    return NextResponse.json({ friends: [] });
  }

  const { data } = await supabase
    .from("friendships")
    .select("id, friend_id, created_at, profiles!friendships_friend_id_fkey(username, display_name)")
    .eq("user_id", user.id);

  const friends = (data ?? []).map((f) => {
    const p = joinProfile(f.profiles);
    return {
      id: f.friend_id,
      username: p?.username ?? "",
      displayName: p?.display_name ?? "",
      addedAt: f.created_at,
    };
  });

  return NextResponse.json({ friends });
}

export async function POST(request: Request) {
  const { supabase, user } = await requireAuthUser();
  if (!supabase || !user) {
    return jsonError("Sign in required", 401);
  }

  const body = (await request.json()) as { username?: string };
  const username = (body.username ?? "").trim().toLowerCase();
  if (!username) return jsonError("Username required");

  const { data: friendProfile } = await supabase
    .from("profiles")
    .select("id, username, display_name")
    .eq("username", username)
    .maybeSingle();

  if (!friendProfile) {
    return jsonError("User not found", 404);
  }
  if (friendProfile.id === user.id) {
    return jsonError("Cannot add yourself");
  }

  const { error } = await supabase.from("friendships").insert({
    user_id: user.id,
    friend_id: friendProfile.id,
  });

  if (error) {
    if (error.code === "23505") {
      return jsonError("Already friends");
    }
    return jsonError(error.message, 500);
  }

  return NextResponse.json({
    friend: {
      id: friendProfile.id,
      username: friendProfile.username,
      displayName: friendProfile.display_name,
    },
  });
}

export async function DELETE(request: Request) {
  const { supabase, user } = await requireAuthUser();
  if (!supabase || !user) {
    return jsonError("Sign in required", 401);
  }

  const url = new URL(request.url);
  const friendId = url.searchParams.get("id");
  if (!friendId) return jsonError("id required");

  await supabase
    .from("friendships")
    .delete()
    .eq("user_id", user.id)
    .eq("friend_id", friendId);

  return NextResponse.json({ ok: true });
}
