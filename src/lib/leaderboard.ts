import type { LeaderboardEntry, LeaderboardMode } from "@/types/profile";
import { fetchLeaderboard } from "@/lib/api/client";
import {
  getBestHuntScore,
  getBestStreak,
  getBestTapScore,
  getFriends,
  getProfile,
} from "@/lib/profile-storage";
import { isSupabaseConfigured } from "@/lib/supabase/client";

function getYourScore(mode: LeaderboardMode): number {
  const profile = getProfile();
  if (profile) {
    if (mode === "sweep") return getBestStreak(profile);
    if (mode === "tap") return getBestTapScore(profile);
    return getBestHuntScore(profile);
  }
  return 0;
}

function withRanks(
  entries: Omit<LeaderboardEntry, "rank">[],
): LeaderboardEntry[] {
  return entries
    .sort((a, b) => b.score - a.score)
    .map((entry, index) => ({ ...entry, rank: index + 1 }));
}

function getLocalLeaderboard(mode: LeaderboardMode): LeaderboardEntry[] {
  const profile = getProfile();
  const yourScore = getYourScore(mode);
  const entries: Omit<LeaderboardEntry, "rank">[] = [];

  if (yourScore > 0 && profile) {
    entries.push({
      username: profile.username,
      displayName: profile.displayName,
      score: yourScore,
      isYou: true,
    });
  }

  return withRanks(entries).slice(0, 15);
}

function getLocalFriendsLeaderboard(mode: LeaderboardMode): LeaderboardEntry[] {
  const profile = getProfile();
  const friends = getFriends();
  const entries: Omit<LeaderboardEntry, "rank">[] = friends.map((friend) => ({
    username: friend.username,
    displayName: friend.displayName,
    score: 0,
    isYou: false,
  }));

  if (profile) {
    entries.push({
      username: profile.username,
      displayName: profile.displayName,
      score: getYourScore(mode),
      isYou: true,
    });
  }

  return withRanks(entries);
}

export async function getGlobalLeaderboard(
  mode: LeaderboardMode = "sweep",
): Promise<LeaderboardEntry[]> {
  if (isSupabaseConfigured()) {
    const entries = await fetchLeaderboard(mode, "global");
    if (entries.length > 0) return entries;
  }
  return getLocalLeaderboard(mode);
}

export async function getFriendsLeaderboard(
  mode: LeaderboardMode = "sweep",
): Promise<LeaderboardEntry[]> {
  if (isSupabaseConfigured()) {
    const entries = await fetchLeaderboard(mode, "friends");
    if (entries.length > 0) return entries;
  }
  return getLocalFriendsLeaderboard(mode);
}

export function getLeaderboardScoreLabel(mode: LeaderboardMode): string {
  if (mode === "sweep") return "countries";
  if (mode === "tap") return "pts";
  return "pts";
}

export function isCloudSyncEnabled(): boolean {
  return isSupabaseConfigured();
}
