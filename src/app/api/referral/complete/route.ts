import { NextResponse } from "next/server";
import { jsonError, requireAuthUser } from "@/lib/server/api-utils";

export async function POST(request: Request) {
  const { supabase, user } = await requireAuthUser();
  if (!supabase || !user) {
    return jsonError("Sign in required", 401);
  }

  const body = (await request.json()) as { referrerUsername?: string };
  const referrerUsername = (body.referrerUsername ?? "").trim().toLowerCase();
  if (!referrerUsername) return jsonError("referrerUsername required");

  const { data: existing } = await supabase
    .from("profiles")
    .select("referred_by")
    .eq("id", user.id)
    .maybeSingle();

  if (existing?.referred_by) {
    return NextResponse.json({ ok: true, alreadyReferred: true });
  }

  const { data: referrer } = await supabase
    .from("profiles")
    .select("id")
    .eq("username", referrerUsername)
    .maybeSingle();

  if (!referrer || referrer.id === user.id) {
    return jsonError("Invalid referrer", 400);
  }

  await supabase
    .from("profiles")
    .update({ referred_by: referrer.id })
    .eq("id", user.id);

  const { data: refProfile } = await supabase
    .from("profiles")
    .select("referral_count")
    .eq("id", referrer.id)
    .maybeSingle();

  await supabase
    .from("profiles")
    .update({
      referral_count: ((refProfile?.referral_count as number) ?? 0) + 1,
    })
    .eq("id", referrer.id);

  return NextResponse.json({ ok: true });
}
