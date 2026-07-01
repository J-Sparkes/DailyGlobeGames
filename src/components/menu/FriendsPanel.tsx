"use client";

import { useState } from "react";
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
  const [friends, setFriends] = useState<Friend[]>(() => getFriends());
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState("");

  const profile = getProfile();

  const refresh = () => {
    setFriends(getFriends());
    onFriendsChange();
  };

  const handleAdd = (event: React.FormEvent) => {
    event.preventDefault();
    if (!profile) return;

    const added = addFriend(displayName || username, username);
    if (!added) {
      setError("Could not add friend. Check the username and try again.");
      return;
    }

    setUsername("");
    setDisplayName("");
    setError("");
    refresh();
  };

  if (!profile) {
    return (
      <p className="text-sm text-slate-400">
        Create a profile first to build your friends list.
      </p>
    );
  }

  return (
    <div className="space-y-5">
      <p className="text-sm text-slate-400">
        Add friends by username. Rankings compare your best streaks — full
        cross-device friends sync when cloud accounts launch.
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
        <input
          type="text"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="Display name (optional)"
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
                onClick={() => {
                  removeFriend(friend.id);
                  refresh();
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
