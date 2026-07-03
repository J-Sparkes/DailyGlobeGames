"use client";

import { useEffect, useState } from "react";
import type { LeaderboardMode } from "@/types/profile";

export interface FriendTodayActivity {
  username: string;
  displayName: string;
  score: number;
  isYou?: boolean;
}

interface FriendResultContextProps {
  mode: LeaderboardMode;
  yourScore: number;
  date: string;
}

export function FriendResultContext({
  mode,
  yourScore,
  date,
}: FriendResultContextProps) {
  const [friends, setFriends] = useState<FriendTodayActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    void fetch(`/api/retention/friends-today?mode=${mode}&date=${date}`)
      .then((res) => (res.ok ? res.json() : { friends: [] }))
      .then((data: { friends: FriendTodayActivity[] }) => {
        if (!cancelled) {
          setFriends(data.friends ?? []);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [mode, date]);

  if (loading || friends.length === 0) return null;

  const others = friends.filter((f) => !f.isYou);
  if (others.length === 0) return null;

  const beaten = others.filter((f) => yourScore > f.score).length;

  return (
    <div className="mt-3 rounded-lg border border-[var(--ui-border-subtle)] bg-[color-mix(in_srgb,var(--ui-accent-primary)_6%,transparent)] px-3 py-2">
      <p className="text-xs text-[var(--ui-text-muted)]">
        {others.length} friend{others.length === 1 ? "" : "s"} played{" "}
        {mode} today
        {beaten > 0 && (
          <>
            {" "}
            — you beat {beaten}
          </>
        )}
      </p>
      <ul className="mt-1.5 space-y-1">
        {others.slice(0, 3).map((friend) => (
          <li
            key={friend.username}
            className="flex items-center justify-between text-xs"
          >
            <span className="truncate text-[var(--ui-text-primary)]">
              {friend.displayName}
            </span>
            <span className="shrink-0 font-stat text-[var(--ui-text-muted)]">
              {friend.score}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
