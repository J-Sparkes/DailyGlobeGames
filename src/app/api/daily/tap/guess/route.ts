import { NextResponse } from "next/server";
import { jsonError } from "@/lib/server/api-utils";
import { scoreServerTapGuess } from "@/lib/server/daily-engine";
import { getDateSeed } from "@/lib/daily-seed";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    date?: string;
    roundIndex?: number;
    lat?: number;
    lng?: number;
  };

  const date = body.date ?? getDateSeed();
  const roundIndex = body.roundIndex ?? 0;
  const lat = body.lat;
  const lng = body.lng;

  if (typeof lat !== "number" || typeof lng !== "number") {
    return jsonError("lat and lng required");
  }

  if (roundIndex < 0 || roundIndex > 4) {
    return jsonError("Invalid round index");
  }

  try {
    const result = scoreServerTapGuess(date, roundIndex, lat, lng);
    return NextResponse.json({ date, roundIndex, result });
  } catch {
    return jsonError("Could not score guess", 422);
  }
}
