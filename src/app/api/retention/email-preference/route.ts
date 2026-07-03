import { NextResponse } from "next/server";
import { jsonError, requireAuthUser } from "@/lib/server/api-utils";

export async function GET() {
  const { supabase, user } = await requireAuthUser();
  if (!supabase || !user) {
    return NextResponse.json({ enabled: false });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("email_reminders, email_timezone")
    .eq("id", user.id)
    .maybeSingle();

  return NextResponse.json({
    enabled: Boolean(profile?.email_reminders),
    timezone: (profile?.email_timezone as string) ?? "UTC",
  });
}

export async function POST(request: Request) {
  const { supabase, user } = await requireAuthUser();
  if (!supabase || !user) {
    return jsonError("Sign in required", 401);
  }

  const body = (await request.json()) as {
    enabled?: boolean;
    timezone?: string;
  };

  const { error } = await supabase
    .from("profiles")
    .update({
      email_reminders: Boolean(body.enabled),
      email_timezone: body.timezone ?? "UTC",
    })
    .eq("id", user.id);

  if (error) {
    return jsonError(error.message, 500);
  }

  return NextResponse.json({ ok: true, enabled: Boolean(body.enabled) });
}
