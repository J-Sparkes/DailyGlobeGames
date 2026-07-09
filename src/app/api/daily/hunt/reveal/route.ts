import { NextResponse } from "next/server";
import { getServerHuntCountryId } from "@/lib/server/daily-engine";
import { getDateSeed } from "@/lib/daily-seed";
import { jsonError } from "@/lib/server/api-utils";
import { MAX_HUNT_GUESSES } from "@/lib/hunt-scoring";

export async function POST(request: Request) {
  const body = (await request.json()) as { date?: string; guessCount?: number };
  const date = body.date ?? getDateSeed();
  const guessCount = body.guessCount ?? 0;

  if (guessCount < MAX_HUNT_GUESSES) {
    return jsonError("Reveal not allowed yet", 403);
  }

  const hiddenCountryId = await getServerHuntCountryId(date);
  return NextResponse.json({ date, hiddenCountryId });
}
