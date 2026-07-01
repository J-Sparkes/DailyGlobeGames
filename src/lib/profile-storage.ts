import type { CompletedDailyResult } from "@/lib/daily-play";
import {
  appendGuestHuntHistory,
  appendGuestSweepHistory,
  appendGuestTapHistory,
} from "@/lib/guest-history";
import type { CompletedTapResult } from "@/lib/tap-daily-play";
import type { CompletedHuntResult } from "@/types/hunt";
import type { Friend, GameHistoryEntry, UserProfile } from "@/types/profile";

const PROFILE_KEY = "geography-game-profile-v1";
const FRIENDS_KEY = "geography-game-friends-v1";

function slugifyUsername(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 24);
}

export function getProfile(): UserProfile | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(PROFILE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as UserProfile;
  } catch {
    return null;
  }
}

export function saveProfile(profile: UserProfile): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
}

export function createProfile(displayName: string, username?: string): UserProfile {
  const baseUsername = username?.trim() || slugifyUsername(displayName);
  const profile: UserProfile = {
    id: crypto.randomUUID(),
    displayName: displayName.trim(),
    username: baseUsername || `player-${Date.now().toString(36)}`,
    createdAt: new Date().toISOString(),
    gameHistory: [],
  };
  saveProfile(profile);
  return profile;
}

export function updateProfile(
  updates: Partial<Pick<UserProfile, "displayName" | "username">>,
): UserProfile | null {
  const profile = getProfile();
  if (!profile) return null;

  const next: UserProfile = {
    ...profile,
    displayName: updates.displayName?.trim() || profile.displayName,
    username: updates.username
      ? slugifyUsername(updates.username) || profile.username
      : profile.username,
  };
  saveProfile(next);
  return next;
}

export function appendGameHistory(result: CompletedDailyResult): UserProfile | null {
  const profile = getProfile();
  if (!profile) {
    appendGuestSweepHistory(result);
    return null;
  }

  const entry: GameHistoryEntry = {
    date: result.date,
    mode: "sweep",
    streak: result.streak,
    path: result.path,
    recordedAt: new Date().toISOString(),
  };

  const withoutDuplicate = profile.gameHistory.filter(
    (g) => !(g.date === result.date && (g.mode ?? "sweep") === "sweep"),
  );
  const next: UserProfile = {
    ...profile,
    gameHistory: [entry, ...withoutDuplicate].sort((a, b) =>
      b.date.localeCompare(a.date),
    ),
  };
  saveProfile(next);
  return next;
}

export function appendTapGameHistory(
  result: CompletedTapResult,
): UserProfile | null {
  const profile = getProfile();
  if (!profile) {
    appendGuestTapHistory(result);
    return null;
  }

  const entry: GameHistoryEntry = {
    date: result.date,
    mode: "tap",
    totalScore: result.totalScore,
    roundScores: result.rounds.map((round) => round.totalPoints),
    recordedAt: new Date().toISOString(),
  };

  const withoutDuplicate = profile.gameHistory.filter(
    (g) => !(g.date === result.date && g.mode === "tap"),
  );
  const next: UserProfile = {
    ...profile,
    gameHistory: [entry, ...withoutDuplicate].sort((a, b) =>
      b.date.localeCompare(a.date),
    ),
  };
  saveProfile(next);
  return next;
}

export function getBestStreak(profile: UserProfile): number {
  const sweepGames = profile.gameHistory.filter(
    (g) => (g.mode ?? "sweep") === "sweep",
  );
  if (sweepGames.length === 0) return 0;
  return Math.max(...sweepGames.map((g) => g.streak ?? 0));
}

export function getBestTapScore(profile: UserProfile): number {
  const tapGames = profile.gameHistory.filter((g) => g.mode === "tap");
  if (tapGames.length === 0) return 0;
  return Math.max(...tapGames.map((g) => g.totalScore ?? 0));
}

export function appendHuntGameHistory(
  result: CompletedHuntResult,
): UserProfile | null {
  const profile = getProfile();
  if (!profile) {
    appendGuestHuntHistory(result);
    return null;
  }

  const entry: GameHistoryEntry = {
    date: result.date,
    mode: "hunt",
    huntScore: result.score,
    solvedOnGuess: result.solvedOnGuess,
    won: result.won,
    recordedAt: new Date().toISOString(),
  };

  const withoutDuplicate = profile.gameHistory.filter(
    (g) => !(g.date === result.date && g.mode === "hunt"),
  );
  const next: UserProfile = {
    ...profile,
    gameHistory: [entry, ...withoutDuplicate].sort((a, b) =>
      b.date.localeCompare(a.date),
    ),
  };
  saveProfile(next);
  return next;
}

export function getBestHuntScore(profile: UserProfile): number {
  const huntGames = profile.gameHistory.filter((g) => g.mode === "hunt");
  if (huntGames.length === 0) return 0;
  return Math.max(...huntGames.map((g) => g.huntScore ?? 0));
}

function getSortedHuntWins(profile: UserProfile | null): GameHistoryEntry[] {
  if (!profile) return [];
  return profile.gameHistory
    .filter((g) => g.mode === "hunt" && g.won)
    .sort((a, b) => b.date.localeCompare(a.date));
}

export function getHuntWinStreak(profile: UserProfile | null = getProfile()): number {
  const wins = getSortedHuntWins(profile);
  if (wins.length === 0) return 0;

  let streak = 0;
  const today = new Date();
  const cursor = new Date(
    Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()),
  );

  for (const win of wins) {
    const winDate = new Date(`${win.date}T00:00:00Z`);
    const diffDays = Math.round(
      (cursor.getTime() - winDate.getTime()) / (1000 * 60 * 60 * 24),
    );

    if (diffDays === 0 || (streak > 0 && diffDays === 1)) {
      streak++;
      cursor.setUTCDate(cursor.getUTCDate() - 1);
      continue;
    }
    break;
  }

  return streak;
}

export function getHuntPerfectStreak(
  profile: UserProfile | null = getProfile(),
): number {
  if (!profile) return 0;

  const perfectWins = profile.gameHistory
    .filter((g) => g.mode === "hunt" && g.won && g.solvedOnGuess === 1)
    .sort((a, b) => b.date.localeCompare(a.date));

  if (perfectWins.length === 0) return 0;

  let streak = 0;
  const today = new Date();
  const cursor = new Date(
    Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()),
  );

  for (const win of perfectWins) {
    const winDate = new Date(`${win.date}T00:00:00Z`);
    const diffDays = Math.round(
      (cursor.getTime() - winDate.getTime()) / (1000 * 60 * 60 * 24),
    );

    if (diffDays === 0 || (streak > 0 && diffDays === 1)) {
      streak++;
      cursor.setUTCDate(cursor.getUTCDate() - 1);
      continue;
    }
    break;
  }

  return streak;
}

export function getFriends(): Friend[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(FRIENDS_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as Friend[];
  } catch {
    return [];
  }
}

export function saveFriends(friends: Friend[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(FRIENDS_KEY, JSON.stringify(friends));
}

export function addFriend(displayName: string, username: string): Friend | null {
  const profile = getProfile();
  if (!profile) return null;

  const normalized = slugifyUsername(username);
  if (!normalized || normalized === profile.username) return null;

  const friends = getFriends();
  if (friends.some((f) => f.username === normalized)) return null;

  const friend: Friend = {
    id: crypto.randomUUID(),
    username: normalized,
    displayName: displayName.trim() || normalized,
    addedAt: new Date().toISOString(),
  };

  saveFriends([friend, ...friends]);
  return friend;
}

export function removeFriend(friendId: string): void {
  saveFriends(getFriends().filter((f) => f.id !== friendId));
}
