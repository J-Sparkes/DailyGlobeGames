export interface GameHistoryEntry {
  date: string;
  mode?: "sweep" | "blitz" | "quiz" | "tap" | "hunt";
  streak?: number;
  path?: string[];
  totalScore?: number;
  roundScores?: number[];
  huntScore?: number;
  solvedOnGuess?: number | null;
  won?: boolean;
  recordedAt: string;
}

export interface UserProfile {
  id: string;
  displayName: string;
  username: string;
  createdAt: string;
  gameHistory: GameHistoryEntry[];
}

export interface Friend {
  id: string;
  username: string;
  displayName: string;
  addedAt: string;
}

export type LeaderboardMode = "sweep" | "tap" | "hunt";

export interface LeaderboardEntry {
  rank: number;
  username: string;
  displayName: string;
  score: number;
  isYou?: boolean;
}

export type MenuTab = "profile" | "friends" | "rankings";
