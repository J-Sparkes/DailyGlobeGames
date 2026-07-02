import { NextResponse } from "next/server";
import { jsonError } from "@/lib/server/api-utils";
import {
  getServerHuntCountryId,
  scoreServerHuntGuess,
} from "@/lib/server/daily-engine";
import { loadServerCountryFeatures } from "@/lib/server/world-geographies";
import { getDateSeed } from "@/lib/daily-seed";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    date?: string;
    countryId?: string;
    previousDistanceMiles?: number | null;
  };

  const date = body.date ?? getDateSeed();
  const countryId = body.countryId;
  const previousDistanceMiles = body.previousDistanceMiles ?? null;

  if (!countryId) {
    return jsonError("countryId required");
  }

  try {
    const hiddenCountryId = await getServerHuntCountryId(date);
    const features = loadServerCountryFeatures();
    const result = scoreServerHuntGuess(
      hiddenCountryId,
      countryId,
      previousDistanceMiles,
      features,
    );

    return NextResponse.json({
      date,
      distanceMiles: result.distanceMiles,
      warmer: result.warmer,
      won: result.won,
      // Only reveal answer on win
      hiddenCountryId: result.won ? result.hiddenCountryId : undefined,
    });
  } catch {
    return jsonError("Could not score guess", 422);
  }
}
