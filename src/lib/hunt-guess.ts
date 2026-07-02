import { getWarmerHint } from "@/lib/hunt-scoring";
import type { HuntGuess } from "@/types/hunt";

export function buildWinningHuntGuess(
  countryId: string,
  previousMiles: number | null,
): HuntGuess {
  return {
    countryId,
    distanceMiles: 0,
    warmer: getWarmerHint(0, previousMiles),
  };
}

export function appendHuntGuess(
  guesses: HuntGuess[],
  guess: HuntGuess,
): HuntGuess[] {
  if (guesses.some((entry) => entry.countryId === guess.countryId)) {
    return guesses;
  }
  return [...guesses, guess];
}
