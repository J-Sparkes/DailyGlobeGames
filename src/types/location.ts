export type LocationCategory = "city" | "landmark" | "event";

export interface DailyLocation {
  id: string;
  name: string;
  prompt: string;
  lat: number;
  lng: number;
  difficulty: 1 | 2 | 3 | 4 | 5;
  category: LocationCategory;
  /** Present for country-capital targets covering the playable country set. */
  countryId?: string;
  fact?: string;
}

export interface TapRoundResult {
  locationId: string;
  prompt: string;
  guessLat: number;
  guessLng: number;
  answerLat: number;
  answerLng: number;
  distanceKm: number;
  basePoints: number;
  multiplier: number;
  totalPoints: number;
  fact?: string;
}
