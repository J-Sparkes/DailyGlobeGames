import { getDateSeed } from "@/lib/daily-seed";
import type { TapRoundResult } from "@/types/location";

export interface TapRoundPublic {
  locationId: string;
  prompt: string;
  difficulty: number;
  fact?: string;
}

export async function fetchSweepDaily(date?: string) {
  const q = date ? `?date=${date}` : "";
  const res = await fetch(`/api/daily/sweep${q}`);
  if (!res.ok) throw new Error("Failed to load sweep daily");
  return res.json() as Promise<{
    date: string;
    startCountryId: string;
    startCountryName: string;
  }>;
}

export async function submitSweepResult(payload: {
  date: string;
  path: string[];
  failedGuess: string;
  targetCountryId: string;
}) {
  const res = await fetch("/api/daily/sweep/submit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) return null;
  return res.json();
}

export async function fetchTapDaily(date?: string) {
  const q = date ? `?date=${date}` : "";
  const res = await fetch(`/api/daily/tap${q}`);
  if (!res.ok) throw new Error("Failed to load tap daily");
  return res.json() as Promise<{ date: string; rounds: TapRoundPublic[] }>;
}

export async function submitTapGuess(payload: {
  date: string;
  roundIndex: number;
  lat: number;
  lng: number;
}) {
  const res = await fetch("/api/daily/tap/guess", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Guess failed");
  return res.json() as Promise<{
    date: string;
    roundIndex: number;
    result: TapRoundResult;
  }>;
}

export async function submitTapResult(payload: {
  date: string;
  rounds: TapRoundResult[];
}) {
  const res = await fetch("/api/daily/tap/submit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) return null;
  return res.json();
}

export async function fetchHuntDaily(date?: string) {
  const q = date ? `?date=${date}` : "";
  const res = await fetch(`/api/daily/hunt${q}`);
  if (!res.ok) throw new Error("Failed to load hunt daily");
  return res.json() as Promise<{ date: string; maxGuesses: number }>;
}

export async function submitHuntGuess(payload: {
  date: string;
  countryId: string;
  previousDistanceMiles: number | null;
}) {
  const res = await fetch("/api/daily/hunt/guess", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Guess failed");
  return res.json() as Promise<{
    date: string;
    distanceMiles: number;
    warmer: "warmer" | "colder" | "same" | null;
    won: boolean;
    hiddenCountryId?: string;
  }>;
}

export async function submitHuntResult(payload: {
  date: string;
  won: boolean;
  solvedOnGuess: number | null;
  guessCount: number;
}) {
  const res = await fetch("/api/daily/hunt/submit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) return null;
  return res.json();
}

export async function fetchLeaderboard(
  mode: "sweep" | "tap" | "hunt",
  scope: "global" | "friends" = "global",
) {
  const res = await fetch(`/api/leaderboard?mode=${mode}&scope=${scope}`);
  if (!res.ok) return [];
  const data = (await res.json()) as { entries: import("@/types/profile").LeaderboardEntry[] };
  return data.entries;
}

export async function fetchFriends() {
  const res = await fetch("/api/friends");
  if (!res.ok) return [];
  const data = (await res.json()) as { friends: import("@/types/profile").Friend[] };
  return data.friends;
}

export async function addFriendApi(username: string) {
  const res = await fetch("/api/friends", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error((data as { error?: string }).error ?? "Failed to add friend");
  }
  return res.json();
}

export async function removeFriendApi(friendId: string) {
  await fetch(`/api/friends?id=${encodeURIComponent(friendId)}`, {
    method: "DELETE",
  });
}

export async function fetchProfile() {
  const res = await fetch("/api/profile");
  if (!res.ok) return null;
  return res.json();
}

export async function upsertProfile(payload: {
  username: string;
  displayName: string;
}) {
  const res = await fetch("/api/profile", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error((data as { error?: string }).error ?? "Failed to save profile");
  }
  return res.json();
}

export async function deleteAccountApi() {
  const res = await fetch("/api/profile", { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete account");
}

export async function importLocalHistoryApi(history: unknown[]) {
  const res = await fetch("/api/profile/import", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ history }),
  });
  return res.ok;
}

export function todayDate() {
  return getDateSeed();
}
