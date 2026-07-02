import { NextResponse } from "next/server";
import { getDateSeed } from "@/lib/daily-seed";

export function dailyDateFromRequest(request: Request): string {
  const url = new URL(request.url);
  const param = url.searchParams.get("date");
  if (param && /^\d{4}-\d{2}-\d{2}$/.test(param)) {
    return param;
  }
  return getDateSeed();
}

export function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export async function requireAuthUser() {
  const { createSupabaseServerClient } = await import("@/lib/supabase/server");
  const supabase = await createSupabaseServerClient();
  if (!supabase) return { supabase: null, user: null };

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return { supabase, user };
}
