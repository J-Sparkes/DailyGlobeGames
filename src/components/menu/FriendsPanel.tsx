"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { addFriendApi, fetchFriends, removeFriendApi } from "@/lib/api/client";
import { trackEvent } from "@/lib/analytics";
import {
  addFriend,
  getFriends,
  getProfile,
  removeFriend,
} from "@/lib/profile-storage";
import type { Friend } from "@/types/profile";

interface FriendsPanelProps {
  onFriendsChange: () => void;
}

export function FriendsPanel({ onFriendsChange }: FriendsPanelProps) {
  const { user, profile: cloudProfile, configured } = useAuth();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");

  const localProfile = getProfile();
  const hasProfile = Boolean(cloudProfile || localProfile);

  const refresh = useCallback(async () => {
    if (configured && user) {
      const remote = await fetchFriends();
      setFriends(remote);
    } else {
      setFriends(getFriends());
    }
    onFriendsChange();
  }, [configured, user, onFriendsChange]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const handleAdd = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!hasProfile) return;

    setError("");
    try {
      if (configured && user) {
        await addFriendApi(username.trim());
      } else if (localProfile) {
        const added = addFriend(username, username);
        if (!added) throw new Error("Could not add friend");
      }
      setUsername("");
      trackEvent("friend_added");
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not add friend");
    }
  };

  if (!hasProfile) {
    return (
      <p className="text-sm text-slate-400">
        Create a profile first to build your friends list.
      </p>
    );
  }

  return (
    <div className="space-y-5">
      <p className="text-sm text-slate-400">
        Add friends by username to compare daily scores on the friends
        leaderboard.
      </p>

      <form onSubmit={handleAdd} className="space-y-2">
        <input
          type="text"
          value={username}
          onChange={(e) => {
            setUsername(e.target.value);
            setError("");
          }}
          placeholder="Friend's username"
          className="w-full rounded-lg border border-white/15 bg-black/50 px-4 py-3 text-base text-white placeholder:text-slate-500"
        />
        {error && <p className="text-sm text-red-400">{error}</p>}
        <button
          type="submit"
          disabled={!username.trim()}
          className="touch-target w-full min-h-11 rounded-lg bg-sky-500 py-2.5 text-sm font-semibold text-white disabled:opacity-40"
        >
          Add friend
        </button>
      </form>

      {friends.length === 0 ? (
        <p className="text-sm text-slate-500">No friends yet.</p>
      ) : (
        <ul className="space-y-2">
          {friends.map((friend) => (
            <li
              key={friend.id}
              className="flex items-center justify-between gap-3 rounded-lg border border-white/[0.06] bg-black/30 px-3 py-2.5"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-slate-200">
                  {friend.displayName}
                </p>
                <p className="text-xs text-slate-500">@{friend.username}</p>
              </div>
              <button
                type="button"
                onClick={async () => {
                  if (configured && user) {
                    await removeFriendApi(friend.id);
                  } else {
                    removeFriend(friend.id);
                  }
                  await refresh();
                }}
                className="shrink-0 text-xs text-red-400/80 hover:text-red-300"
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
