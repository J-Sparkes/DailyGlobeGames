import { NextResponse } from "next/server";
import { jsonError, requireAuthUser } from "@/lib/server/api-utils";
import { joinProfile } from "@/lib/server/supabase-join";

function slugifyUsername(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 24);
}

export async function GET() {
  const { supabase, user } = await requireAuthUser();
  if (!supabase || !user) {
    return NextResponse.json({ profile: null, friends: [] });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  const { data: friendships } = await supabase
    .from("friendships")
    .select("id, friend_id, created_at, profiles!friendships_friend_id_fkey(username, display_name)")
    .eq("user_id", user.id);

  const friends = (friendships ?? []).map((f) => {
    const p = joinProfile(f.profiles);
    return {
      id: f.friend_id,
      username: p?.username ?? "",
      displayName: p?.display_name ?? "",
      addedAt: f.created_at,
    };
  });

  return NextResponse.json({
    profile: profile
      ? {
          id: profile.id,
          username: profile.username,
          displayName: profile.display_name,
          createdAt: profile.created_at,
        }
      : null,
    friends,
  });
}

export async function POST(request: Request) {
  const { supabase, user } = await requireAuthUser();
  if (!supabase || !user) {
    return jsonError("Sign in required", 401);
  }

  const body = (await request.json()) as {
    username?: string;
    displayName?: string;
  };

  const username = slugifyUsername(body.username ?? "");
  const displayName = (body.displayName ?? "").trim();

  if (!username || username.length < 2) {
    return jsonError("Username must be at least 2 characters");
  }
  if (displayName.length < 2) {
    return jsonError("Display name must be at least 2 characters");
  }

  const { data, error } = await supabase
    .from("profiles")
    .upsert(
      {
        id: user.id,
        username,
        display_name: displayName,
      },
      { onConflict: "id" },
    )
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      return jsonError("Username already taken", 409);
    }
    return jsonError(error.message, 500);
  }

  return NextResponse.json({
    profile: {
      id: data.id,
      username: data.username,
      displayName: data.display_name,
      createdAt: data.created_at,
    },
  });
}

export async function DELETE() {
  const { supabase, user } = await requireAuthUser();
  if (!supabase || !user) {
    return jsonError("Sign in required", 401);
  }

  const admin = (await import("@/lib/supabase/admin")).createSupabaseAdminClient();
  if (!admin) {
    return jsonError("Server configuration error", 500);
  }

  await admin.from("daily_results").delete().eq("user_id", user.id);
  await admin.from("friendships").delete().eq("user_id", user.id);
  await admin.from("friendships").delete().eq("friend_id", user.id);
  await admin.from("profiles").delete().eq("id", user.id);

  const { error } = await admin.auth.admin.deleteUser(user.id);
  if (error) {
    return jsonError(error.message, 500);
  }

  await supabase.auth.signOut();

  return NextResponse.json({ ok: true });
}
