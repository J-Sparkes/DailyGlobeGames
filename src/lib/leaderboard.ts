import { getBestScoreForMode } from "@/lib/game-history";
import {
  getBestHuntScore,
  getBestStreak,
  getBestTapScore,
  getFriends,
  getProfile,
} from "@/lib/profile-storage";
import type { LeaderboardEntry, LeaderboardMode } from "@/types/profile";

const MOCK_GLOBAL: Record<
  LeaderboardMode,
  Omit<LeaderboardEntry, "rank" | "isYou">[]
> = {
  sweep: [
    { username: "atlas-ace", displayName: "Atlas Ace", score: 42 },
    { username: "border-hopper", displayName: "Border Hopper", score: 38 },
    { username: "map-sweeper", displayName: "Map Sweeper", score: 35 },
    { username: "terra-trek", displayName: "Terra Trek", score: 31 },
    { username: "geo-guru", displayName: "Geo Guru", score: 28 },
    { username: "lat-long", displayName: "Lat & Long", score: 24 },
    { username: "sweep-king", displayName: "Sweep King", score: 21 },
    { username: "node-runner", displayName: "Node Runner", score: 18 },
    { username: "coast-line", displayName: "Coast Line", score: 15 },
    { username: "pin-drop", displayName: "Pin Drop", score: 12 },
  ],
  tap: [
    { username: "pinpoint", displayName: "Pinpoint", score: 4820 },
    { username: "tap-master", displayName: "Tap Master", score: 4510 },
    { username: "globe-gazer", displayName: "Globe Gazer", score: 4280 },
    { username: "near-miss", displayName: "Near Miss", score: 4010 },
    { username: "lat-snipe", displayName: "Lat Snipe", score: 3760 },
    { username: "maptap-pro", displayName: "MapTap Pro", score: 3520 },
    { username: "geo-click", displayName: "Geo Click", score: 3290 },
    { username: "bullseye", displayName: "Bullseye", score: 3050 },
    { username: "tap-trail", displayName: "Tap Trail", score: 2810 },
    { username: "rough-aim", displayName: "Rough Aim", score: 2540 },
  ],
  hunt: [
    { username: "tracker", displayName: "Tracker", score: 1000 },
    { username: "cold-case", displayName: "Cold Case", score: 750 },
    { username: "warmer", displayName: "Warmer", score: 500 },
    { username: "border-hawk", displayName: "Border Hawk", score: 500 },
    { username: "hide-seek", displayName: "Hide & Seek", score: 250 },
    { username: "clue-finder", displayName: "Clue Finder", score: 250 },
    { username: "geo-detect", displayName: "Geo Detect", score: 250 },
    { username: "trail-blaze", displayName: "Trail Blaze", score: 250 },
    { username: "last-guess", displayName: "Last Guess", score: 250 },
    { username: "near-miss", displayName: "Near Miss", score: 250 },
  ],
};

function getYourScore(mode: LeaderboardMode): number {
  const profile = getProfile();
  if (profile) {
    if (mode === "sweep") return getBestStreak(profile);
    if (mode === "tap") return getBestTapScore(profile);
    return getBestHuntScore(profile);
  }
  return getBestScoreForMode(mode);
}

function withRanks(
  entries: Omit<LeaderboardEntry, "rank">[],
): LeaderboardEntry[] {
  return entries
    .sort((a, b) => b.score - a.score)
    .map((entry, index) => ({ ...entry, rank: index + 1 }));
}

export function getGlobalLeaderboard(
  mode: LeaderboardMode = "sweep",
): LeaderboardEntry[] {
  const profile = getProfile();
  const yourScore = getYourScore(mode);

  const entries: Omit<LeaderboardEntry, "rank">[] = MOCK_GLOBAL[mode].map(
    (entry) => ({
      ...entry,
      isYou: false,
    }),
  );

  if (yourScore > 0) {
    entries.push({
      username: profile?.username ?? "guest",
      displayName: profile?.displayName ?? "You",
      score: yourScore,
      isYou: true,
    });
  }

  return withRanks(entries).slice(0, 15);
}

export function getFriendsLeaderboard(
  mode: LeaderboardMode = "sweep",
): LeaderboardEntry[] {
  const profile = getProfile();
  const friends = getFriends();

  const entries: Omit<LeaderboardEntry, "rank">[] = friends.map((friend) => ({
    username: friend.username,
    displayName: friend.displayName,
    score: mockFriendScore(friend.username, mode),
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

function mockFriendScore(username: string, mode: LeaderboardMode): number {
  let hash = 0;
  for (let i = 0; i < username.length; i++) {
    hash = (hash + username.charCodeAt(i) * (i + 1)) % 997;
  }

  if (mode === "sweep") return 5 + (hash % 20);
  if (mode === "tap") return 1800 + (hash % 2200);
  return 250 + (hash % 750);
}

export function getLeaderboardScoreLabel(mode: LeaderboardMode): string {
  if (mode === "sweep") return "countries";
  if (mode === "tap") return "pts";
  return "pts";
}

export function isCloudSyncEnabled(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}
