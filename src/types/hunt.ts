export type WarmerHint = "warmer" | "colder" | "same" | null;

export interface HuntGuess {
  countryId: string;
  distanceMiles: number;
  warmer: WarmerHint;
}

export interface CompletedHuntResult {
  date: string;
  hiddenCountryId: string;
  guesses: HuntGuess[];
  won: boolean;
  solvedOnGuess: number | null;
  score: number;
}
