import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getDateSeed } from "@/lib/daily-seed";

function siteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "https://dailyglobegames.com";
}

function isReminderHour(timezone: string): boolean {
  try {
    const hour = Number(
      new Intl.DateTimeFormat("en-US", {
        timeZone: timezone || "UTC",
        hour: "numeric",
        hour12: false,
      }).format(new Date()),
    );
    return hour === 7;
  } catch {
    return false;
  }
}

async function sendReminderEmail(
  to: string,
  date: string,
): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM;
  if (!apiKey || !from) return false;

  const body = {
    from,
    to: [to],
    subject: `Today's Daily Globe Games puzzles (${date})`,
    html: `
      <p>Today's puzzles are ready.</p>
      <ul>
        <li><a href="${siteUrl()}/?d=${date}">Sweep</a></li>
        <li><a href="${siteUrl()}/tap?d=${date}">Tap</a></li>
        <li><a href="${siteUrl()}/hunt?d=${date}">Hunt</a></li>
      </ul>
      <p><a href="${siteUrl()}/privacy">Unsubscribe</a> in your profile settings.</p>
    `,
  };

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  return res.ok;
}

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createSupabaseAdminClient();
  if (!admin) {
    return NextResponse.json({ sent: 0, skipped: "no_supabase" });
  }

  const date = getDateSeed();
  const { data: profiles } = await admin
    .from("profiles")
    .select("id, email_timezone")
    .eq("email_reminders", true);

  let sent = 0;
  let skippedTimezone = 0;

  for (const profile of profiles ?? []) {
    const timezone = (profile.email_timezone as string) ?? "UTC";
    if (!isReminderHour(timezone)) {
      skippedTimezone++;
      continue;
    }

    const { data: authUser } = await admin.auth.admin.getUserById(
      profile.id as string,
    );
    const email = authUser.user?.email;
    if (!email) continue;

    const ok = await sendReminderEmail(email, date);
    if (ok) sent++;
  }

  return NextResponse.json({
    date,
    sent,
    skippedTimezone,
    candidates: profiles?.length ?? 0,
  });
}
