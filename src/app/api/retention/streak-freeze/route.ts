import { NextResponse } from "next/server";
import { jsonError, requireAuthUser } from "@/lib/server/api-utils";
import { getDateSeed } from "@/lib/daily-seed";

export async function POST() {
  const { supabase, user } = await requireAuthUser();
  if (!supabase || !user) {
    return jsonError("Sign in required", 401);
  }

  const month = getDateSeed().slice(0, 7);
  const { data: profile } = await supabase
    .from("profiles")
    .select("streak_freeze_month")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.streak_freeze_month === month) {
    return jsonError("Streak freeze already used this month");
  }

  const { error } = await supabase
    .from("profiles")
    .update({ streak_freeze_month: month })
    .eq("id", user.id);

  if (error) {
    return jsonError(error.message, 500);
  }

  return NextResponse.json({ ok: true, month });
}
