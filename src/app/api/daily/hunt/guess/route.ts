import { NextResponse } from "next/server";
import { jsonError } from "@/lib/server/api-utils";
import {
  getServerHuntCountryId,
  scoreServerHuntGuess,
} from "@/lib/server/daily-engine";
import { loadServerCountryFeatures } from "@/lib/server/world-geographies";
import { getDateSeed } from "@/lib/daily-seed";
import { MAX_HUNT_GUESSES } from "@/lib/hunt-scoring";
import { getHuntTriviaFact } from "@/lib/hunt-trivia";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    date?: string;
    countryId?: string;
    previousDistanceMiles?: number | null;
    guessNumber?: number;
  };

  const date = body.date ?? getDateSeed();
  const countryId = body.countryId;
  const previousDistanceMiles = body.previousDistanceMiles ?? null;
  const guessNumber = body.guessNumber ?? 1;

  if (!countryId) {
    return jsonError("countryId required");
  }

  if (guessNumber < 1 || guessNumber > MAX_HUNT_GUESSES) {
    return jsonError("Invalid guess number");
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
      fact: result.won
        ? undefined
        : getHuntTriviaFact(hiddenCountryId, date, guessNumber - 1),
      hiddenCountryId: result.won ? result.hiddenCountryId : undefined,
    });
  } catch {
    return jsonError("Could not score guess", 422);
  }
}
