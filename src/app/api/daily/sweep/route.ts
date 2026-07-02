import { NextResponse } from "next/server";
import { dailyDateFromRequest } from "@/lib/server/api-utils";
import { getServerSweepStart } from "@/lib/server/daily-engine";

export async function GET(request: Request) {
  const date = dailyDateFromRequest(request);
  const start = getServerSweepStart(date);

  return NextResponse.json({
    date,
    startCountryId: start.id,
    startCountryName: start.name,
  });
}
