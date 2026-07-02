import { NextResponse } from "next/server";
import { dailyDateFromRequest } from "@/lib/server/api-utils";
import { getServerTapRounds } from "@/lib/server/daily-engine";

export async function GET(request: Request) {
  const date = dailyDateFromRequest(request);
  const rounds = getServerTapRounds(date);

  return NextResponse.json({ date, rounds });
}
