import { NextResponse } from "next/server";
import { jsonError, requireAuthUser } from "@/lib/server/api-utils";
import { getUserPremiumStatus } from "@/lib/server/subscription";

export async function GET() {
  const { supabase, user } = await requireAuthUser();
  if (!supabase || !user) {
    return NextResponse.json({ premium: false, signedIn: false });
  }

  const status = await getUserPremiumStatus(supabase, user.id);
  return NextResponse.json({
    signedIn: true,
    premium: status.premium,
    premiumUntil: status.premiumUntil,
  });
}
