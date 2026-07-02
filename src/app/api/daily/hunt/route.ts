import { NextResponse } from "next/server";
import { dailyDateFromRequest } from "@/lib/server/api-utils";
import { MAX_HUNT_GUESSES } from "@/lib/hunt-scoring";

export async function GET(request: Request) {
  const date = dailyDateFromRequest(request);

  return NextResponse.json({
    date,
    maxGuesses: MAX_HUNT_GUESSES,
  });
}
